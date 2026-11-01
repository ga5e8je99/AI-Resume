import * as Sentry from '@sentry/nextjs';
import { reportOperationalAlert } from '@/lib/sentry';
import DataStore, { StoredAiUsage } from './datastore';
import { getPlanDailyAiLimit, PlanId } from '@/lib/plans';
import { getUserEntitlements } from '@/lib/credits';
import { sendEmail } from '@/lib/email';
import { AiUsageStatus } from '../models/AiUsage';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerSnapshot {
  state: CircuitState;
  consecutiveFailures: number;
  failureThreshold: number;
  cooldownMs: number;
  openedAt: number | null;
  openUntil: number | null;
  lastError: string | null;
}

export interface AiBudgetAlertEvent {
  type: 'daily_budget_exceeded' | 'user_daily_limit_exceeded' | 'circuit_breaker_tripped';
  message: string;
  endpoint?: string;
  userId?: string;
  dailyCostUsd?: number;
  dailyBudgetUsd?: number;
  userDailyUsed?: number;
  userDailyLimit?: number;
  userPlan?: string;
  timestamp: string;
  emailSent: boolean;
  sentryCaptured: boolean;
}

// ============================================================================
// 1. Circuit Breaker State (Shared across AI Clients)
// ============================================================================

let consecutiveFailures = 0;
let openedAtMs: number | null = null;
let openUntilMs: number | null = null;
let lastCircuitError: string | null = null;

// Alert deduplication keys per UTC day / window + in-memory log for tests/admin
const sentAlertKeys = new Set<string>();
const recentAlerts: AiBudgetAlertEvent[] = [];

export function getCircuitBreakerConfig(): { failureThreshold: number; cooldownMs: number } {
  const rawThreshold = parseInt(process.env.AI_CIRCUIT_BREAKER_THRESHOLD || '3', 10);
  const rawCooldown = parseInt(process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS || '60000', 10);
  return {
    failureThreshold: Number.isFinite(rawThreshold) && rawThreshold >= 1 ? rawThreshold : 3,
    cooldownMs: Number.isFinite(rawCooldown) && rawCooldown >= 100 ? rawCooldown : 60000,
  };
}

export function getCircuitBreakerState(now: number = Date.now()): CircuitBreakerSnapshot {
  const { failureThreshold, cooldownMs } = getCircuitBreakerConfig();
  let state: CircuitState = 'CLOSED';

  if (openUntilMs !== null) {
    if (now < openUntilMs) {
      state = 'OPEN';
    } else {
      state = 'HALF_OPEN';
    }
  }

  return {
    state,
    consecutiveFailures,
    failureThreshold,
    cooldownMs,
    openedAt: openedAtMs,
    openUntil: openUntilMs,
    lastError: lastCircuitError,
  };
}

export function isCircuitOpen(now: number = Date.now()): boolean {
  return getCircuitBreakerState(now).state === 'OPEN';
}

export function recordCircuitSuccess(): void {
  consecutiveFailures = 0;
  openedAtMs = null;
  openUntilMs = null;
  lastCircuitError = null;
}

export function recordCircuitFailure(errorMessage: string, now: number = Date.now()): CircuitBreakerSnapshot {
  const { failureThreshold, cooldownMs } = getCircuitBreakerConfig();
  consecutiveFailures += 1;
  lastCircuitError = errorMessage;

  if (consecutiveFailures >= failureThreshold) {
    openedAtMs = now;
    openUntilMs = now + cooldownMs;

    const msg = `[AICircuitBreaker] Provider failed ${consecutiveFailures} consecutive times (threshold=${failureThreshold}). Circuit OPEN for ${Math.round(
      cooldownMs / 1000
    )}s. Last error: ${errorMessage}`;
    console.warn(msg);
    Sentry.captureMessage(msg, {
      level: 'warning',
      tags: { component: 'AICircuitBreaker' },
      extra: { consecutiveFailures, failureThreshold, cooldownMs, errorMessage },
    });
    reportOperationalAlert({
      category: 'ai_failure',
      severity: 'error',
      title: 'AI Provider Circuit Breaker Tripped',
      message: msg,
      tags: { component: 'AICircuitBreaker' },
      metadata: { consecutiveFailures, failureThreshold, cooldownMs, errorMessage },
    });

    recentAlerts.unshift({
      type: 'circuit_breaker_tripped',
      message: msg,
      timestamp: new Date(now).toISOString(),
      emailSent: false,
      sentryCaptured: true,
    });
    if (recentAlerts.length > 50) recentAlerts.pop();
  }

  return getCircuitBreakerState(now);
}

export function resetCircuitBreaker(): void {
  consecutiveFailures = 0;
  openedAtMs = null;
  openUntilMs = null;
  lastCircuitError = null;
}

// ============================================================================
// 2. Token & Cost Estimation
// ============================================================================

export function estimateTokensFromText(text: string | undefined | null): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
}

export function estimateAiCostUsd(
  promptTokens: number,
  completionTokens: number,
  model: string = 'gpt-4o-mini'
): number {
  const pTokens = Math.max(0, promptTokens);
  const cTokens = Math.max(0, completionTokens);

  const envInputPer1k = parseFloat(process.env.AI_COST_PER_1K_INPUT_USD || '');
  const envOutputPer1k = parseFloat(process.env.AI_COST_PER_1K_OUTPUT_USD || '');

  if (Number.isFinite(envInputPer1k) && envInputPer1k >= 0 && Number.isFinite(envOutputPer1k) && envOutputPer1k >= 0) {
    const cost = (pTokens / 1000) * envInputPer1k + (cTokens / 1000) * envOutputPer1k;
    return Number(cost.toFixed(6));
  }

  const normalizedModel = (model || 'gpt-4o-mini').toLowerCase();
  // Default pricing per 1,000 tokens:
  // gpt-4o: $0.0025 / 1K input, $0.010 / 1K output
  // gpt-4o-mini (default): $0.00015 / 1K input, $0.0006 / 1K output
  let inputRatePer1k = 0.00015;
  let outputRatePer1k = 0.0006;

  if (normalizedModel.includes('gpt-4o') && !normalizedModel.includes('mini')) {
    inputRatePer1k = 0.0025;
    outputRatePer1k = 0.01;
  } else if (normalizedModel.includes('gpt-4-turbo') || normalizedModel === 'gpt-4') {
    inputRatePer1k = 0.01;
    outputRatePer1k = 0.03;
  }

  const totalCost = (pTokens / 1000) * inputRatePer1k + (cTokens / 1000) * outputRatePer1k;
  return Number(Math.max(0.000001, totalCost).toFixed(6));
}

// ============================================================================
// 3. Daily Budget & Per-User Daily Limits + Sentry & Resend Alerting
// ============================================================================

export function getDailyBudgetUsd(): number {
  const raw = parseFloat(process.env.AI_DAILY_BUDGET_USD || '10');
  return Number.isFinite(raw) && raw >= 0 ? raw : 10;
}

export async function resolveUserPlanTier(userId?: string | null): Promise<{
  planId: PlanId;
  dailyLimit: number;
  userEmail?: string;
}> {
  if (!userId || userId === 'anonymous') {
    return {
      planId: 'free',
      dailyLimit: getPlanDailyAiLimit('free'),
    };
  }

  try {
    const user = await DataStore.findUserById(userId);
    if (!user) {
      return {
        planId: 'free',
        dailyLimit: getPlanDailyAiLimit('free'),
      };
    }

    const entitlements = getUserEntitlements(user);
    if (entitlements.isPro || entitlements.unlimited || user.plan === 'pro' || user.plan === 'enterprise') {
      return {
        planId: 'pro',
        dailyLimit: getPlanDailyAiLimit('pro'),
        userEmail: user.email,
      };
    }

    // Check if user is on PAYG (explicitly or purchased bundle >= 15 credits)
    const credits = typeof user.aiCredits === 'number' ? user.aiCredits : 0;
    if (
      (user.plan as string) === 'payg' ||
      credits >= 15 ||
      (user.paymentProvider && user.paymentProvider !== 'none' && user.plan !== 'free')
    ) {
      return {
        planId: 'payg',
        dailyLimit: getPlanDailyAiLimit('payg'),
        userEmail: user.email,
      };
    }

    return {
      planId: 'free',
      dailyLimit: getPlanDailyAiLimit('free'),
      userEmail: user.email,
    };
  } catch {
    return {
      planId: 'free',
      dailyLimit: getPlanDailyAiLimit('free'),
    };
  }
}

export async function sendAiGovernanceAlert(params: {
  type: 'daily_budget_exceeded' | 'user_daily_limit_exceeded';
  endpoint: string;
  userId?: string;
  dailyCostUsd?: number;
  dailyBudgetUsd?: number;
  userDailyUsed?: number;
  userDailyLimit?: number;
  userPlan?: string;
}): Promise<AiBudgetAlertEvent> {
  const todayKey = new Date().toISOString().slice(0, 10);
  const dedupeKey =
    params.type === 'daily_budget_exceeded'
      ? `budget:${todayKey}`
      : `user_limit:${todayKey}:${params.userId || 'anon'}`;

  const message =
    params.type === 'daily_budget_exceeded'
      ? `[AIGovernance] Global AI daily budget exceeded ($${(params.dailyCostUsd ?? 0).toFixed(
          4
        )} / $${(params.dailyBudgetUsd ?? 0).toFixed(2)} USD) on ${params.endpoint}. Switching to built-in ATS fallback.`
      : `[AIGovernance] User "${params.userId}" (plan=${params.userPlan || 'free'}) reached daily AI limit (${
          params.userDailyUsed
        }/${params.userDailyLimit}) on ${params.endpoint}. Switching to built-in ATS fallback.`;

  console.warn(message);

  // Always capture in Sentry
  Sentry.captureMessage(message, {
    level: 'warning',
    tags: {
      component: 'AIGovernance',
      alertType: params.type,
      endpoint: params.endpoint,
    },
    extra: { ...params },
  });
  reportOperationalAlert({
    category: 'ai_failure',
    severity: 'warning',
    title: `AI Governance Alert (${params.type})`,
    message,
    tags: {
      component: 'AIGovernance',
      alertType: params.type,
      endpoint: params.endpoint,
    },
    metadata: { ...params },
  });

  let emailSent = false;
  if (!sentAlertKeys.has(dedupeKey)) {
    sentAlertKeys.add(dedupeKey);
    const alertRecipient =
      process.env.ADMIN_ALERT_EMAIL ||
      process.env.ADMIN_EMAIL ||
      'admin@jobmatch.ai';

    const subject =
      params.type === 'daily_budget_exceeded'
        ? `[JobMatch AI Alert] Daily AI Budget Exceeded ($${(params.dailyCostUsd ?? 0).toFixed(2)} / $${(
            params.dailyBudgetUsd ?? 0
          ).toFixed(2)})`
        : `[JobMatch AI Alert] User Daily AI Limit Reached (${params.userId})`;

    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #14181F; background: #FAF8F4; border: 1px solid #E4DFD5; border-radius: 8px;">
        <h2 style="color: #9A5B00; margin-top: 0;">⚠️ JobMatch AI Governance Alert</h2>
        <p>${message}</p>
        <ul>
          <li><strong>Type:</strong> ${params.type}</li>
          <li><strong>Endpoint:</strong> ${params.endpoint}</li>
          ${params.userId ? `<li><strong>User ID:</strong> ${params.userId} (${params.userPlan || 'free'})</li>` : ''}
          ${
            params.dailyCostUsd !== undefined
              ? `<li><strong>Daily Spend:</strong> $${params.dailyCostUsd.toFixed(4)} / $${(
                  params.dailyBudgetUsd ?? 0
                ).toFixed(2)} USD</li>`
              : ''
          }
          ${
            params.userDailyUsed !== undefined
              ? `<li><strong>User Daily Requests:</strong> ${params.userDailyUsed} / ${params.userDailyLimit}</li>`
              : ''
          }
          <li><strong>Action Taken:</strong> Automatically switched to built-in ATS fallback engine.</li>
        </ul>
      </div>
    `;

    try {
      const emailRes = await sendEmail({
        to: alertRecipient,
        subject,
        html,
      });
      emailSent = emailRes.success;
    } catch (err) {
      console.error('[AIGovernance] Failed to send Resend alert email:', err);
    }
  }

  const alertEvent: AiBudgetAlertEvent = {
    type: params.type,
    message,
    endpoint: params.endpoint,
    userId: params.userId,
    dailyCostUsd: params.dailyCostUsd,
    dailyBudgetUsd: params.dailyBudgetUsd,
    userDailyUsed: params.userDailyUsed,
    userDailyLimit: params.userDailyLimit,
    userPlan: params.userPlan,
    timestamp: new Date().toISOString(),
    emailSent,
    sentryCaptured: true,
  };

  recentAlerts.unshift(alertEvent);
  if (recentAlerts.length > 50) recentAlerts.pop();

  return alertEvent;
}

export interface AiPreCallGuardResult {
  allowExternalCall: boolean;
  fallbackReason?: string;
  dailyBudgetUsd: number;
  currentDailySpendUsd: number;
  userPlan?: PlanId;
  userDailyLimit?: number;
  userDailyUsed?: number;
}

/**
 * Evaluates circuit breaker, project daily budget (AI_DAILY_BUDGET_USD), and per-user daily limits (from lib/plans.ts).
 * If any threshold is exceeded, returns allowExternalCall: false so the caller smoothly uses the fallback engine
 * and dispatches a Sentry + Resend alert.
 */
export async function evaluateAiPreCallGuard(params: {
  userId?: string | null;
  endpoint: string;
}): Promise<AiPreCallGuardResult> {
  const dailyBudgetUsd = getDailyBudgetUsd();

  // 1. Check Circuit Breaker
  if (isCircuitOpen()) {
    const spend = await DataStore.getProjectDailyAiSpend();
    return {
      allowExternalCall: false,
      fallbackReason: 'circuit_breaker_open',
      dailyBudgetUsd,
      currentDailySpendUsd: spend.totalCostUsd,
    };
  }

  // 2. Check Project Daily Budget (AI_DAILY_BUDGET_USD)
  const spend = await DataStore.getProjectDailyAiSpend();
  if (dailyBudgetUsd <= 0 || spend.totalCostUsd >= dailyBudgetUsd) {
    await sendAiGovernanceAlert({
      type: 'daily_budget_exceeded',
      endpoint: params.endpoint,
      userId: params.userId || 'anonymous',
      dailyCostUsd: spend.totalCostUsd,
      dailyBudgetUsd,
    });
    return {
      allowExternalCall: false,
      fallbackReason: 'daily_budget_exceeded',
      dailyBudgetUsd,
      currentDailySpendUsd: spend.totalCostUsd,
    };
  }

  // 3. Check Per-User Daily Limit (from lib/plans.ts)
  const cleanUserId = (params.userId || '').trim();
  if (cleanUserId && cleanUserId !== 'anonymous') {
    const { planId, dailyLimit } = await resolveUserPlanTier(cleanUserId);
    const userUsage = await DataStore.getUserDailyAiUsageCount(cleanUserId);

    if (userUsage.total >= dailyLimit) {
      await sendAiGovernanceAlert({
        type: 'user_daily_limit_exceeded',
        endpoint: params.endpoint,
        userId: cleanUserId,
        userPlan: planId,
        userDailyUsed: userUsage.total,
        userDailyLimit: dailyLimit,
      });
      return {
        allowExternalCall: false,
        fallbackReason: 'user_daily_limit_exceeded',
        dailyBudgetUsd,
        currentDailySpendUsd: spend.totalCostUsd,
        userPlan: planId,
        userDailyLimit: dailyLimit,
        userDailyUsed: userUsage.total,
      };
    }

    return {
      allowExternalCall: true,
      dailyBudgetUsd,
      currentDailySpendUsd: spend.totalCostUsd,
      userPlan: planId,
      userDailyLimit: dailyLimit,
      userDailyUsed: userUsage.total,
    };
  }

  return {
    allowExternalCall: true,
    dailyBudgetUsd,
    currentDailySpendUsd: spend.totalCostUsd,
  };
}

/**
 * Records an AI request in the AiUsage collection and triggers a budget alert if cumulative daily spend crossed AI_DAILY_BUDGET_USD.
 */
export async function logAiUsageAndCheckBudget(input: {
  userId?: string | null;
  endpoint: string;
  tokens: number;
  promptTokens?: number;
  completionTokens?: number;
  costUsd: number;
  latencyMs: number;
  status: AiUsageStatus;
  fallbackReason?: string;
  provider?: string;
  model?: string;
}): Promise<StoredAiUsage> {
  const entry = await DataStore.recordAiUsage(input);

  if (input.status === 'hit' && input.costUsd > 0) {
    const dailyBudgetUsd = getDailyBudgetUsd();
    const spend = await DataStore.getProjectDailyAiSpend();
    if (spend.totalCostUsd >= dailyBudgetUsd) {
      await sendAiGovernanceAlert({
        type: 'daily_budget_exceeded',
        endpoint: input.endpoint,
        userId: input.userId || 'anonymous',
        dailyCostUsd: spend.totalCostUsd,
        dailyBudgetUsd,
      });
    }
  }

  return entry;
}

export function getRecentAiAlerts(): AiBudgetAlertEvent[] {
  return [...recentAlerts];
}

export function clearAiAlertsForTesting(): void {
  sentAlertKeys.clear();
  recentAlerts.length = 0;
}

