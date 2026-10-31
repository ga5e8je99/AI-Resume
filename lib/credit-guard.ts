import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import mongoose from 'mongoose';
import User from '@/app/models/User';
import DataStore, { isMongoAvailable } from '@/app/lib/datastore';
import { requireAuth, AuthenticatedUser } from '@/app/lib/auth';
import { getUserEntitlements } from '@/lib/credits';
import { applyRateLimit } from '@/app/lib/rateLimit';
import {
  RESUME_GENERATION_CREDIT_COST,
  JOB_MATCH_CREDIT_COST,
  JOB_MATCH_FREE_QUOTA,
} from './plans';

export interface CreditOptions {
  cost?: number;
  feature?: 'cover_letter' | 'resume_generation' | 'job_match';
}

export interface CreditCheckResult {
  allowed: boolean;
  isDemo: boolean;
  unlimited: boolean;
  creditsLeft: number;
  errorResponse?: NextResponse;
}

export interface CreditConsumeResult {
  success: boolean;
  remaining: number;
  deducted: boolean;
  charged?: boolean;
  freeUsed?: number;
  freeRemaining?: number;
  creditsRemaining?: number;
  creditsDeducted?: number;
  resumeGenIncremented?: boolean;
  jobMatchFreeIncremented?: boolean;
  error?: string;
}

export interface CreditGuardHandlerContext {
  user: AuthenticatedUser;
  creditCheck: CreditCheckResult;
  routeContext?: any;
}

/**
 * Checks whether the given user has sufficient AI generation credits or an active Pro plan.
 *
 * Rules:
 * - Missing or unauthenticated user -> HTTP 401 UNAUTHORIZED (never grants fallback credits).
 * - Pro/enterprise active plan -> unlimited, no deduction required.
 * - Demo users (isDemo) -> never charged, protected by a 30 req/hour rate limit.
 * - Free users -> requires feature quota or aiCredits > 0, returns HTTP 402 with { error: "NO_CREDITS", upgradeUrl: "/pricing" } if exhausted.
 */
export async function requireCredits(
  userId: string | null | undefined,
  req?: NextRequest,
  options?: CreditOptions
): Promise<CreditCheckResult> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return {
      allowed: false,
      isDemo: false,
      unlimited: false,
      creditsLeft: 0,
      errorResponse: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  // 1. Fetch user from DB (MongoDB or Local DataStore)
  let user: any = null;
  const mongoUp = await isMongoAvailable();
  if (mongoUp) {
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId).lean();
      }
    } catch (err) {
      console.error('[CreditGuard] MongoDB user lookup failed in requireCredits:', err);
      Sentry.captureException(err);
    }
  }

  if (!user) {
    try {
      user = await DataStore.findUserById(userId);
    } catch (err) {
      console.error('[CreditGuard] DataStore user lookup failed in requireCredits:', err);
      Sentry.captureException(err);
      return {
        allowed: false,
        isDemo: false,
        unlimited: false,
        creditsLeft: 0,
        errorResponse: NextResponse.json(
          { error: 'CREDIT_CHECK_FAILED', message: 'Failed to verify user account credits' },
          { status: 500 }
        ),
      };
    }
  }

  // Unregistered / non-existent user -> 401 (never grant fallback credits)
  if (!user) {
    return {
      allowed: false,
      isDemo: false,
      unlimited: false,
      creditsLeft: 0,
      errorResponse: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  // 2. Demo User Guard: Demo users are never charged, protected by per-hour rate limit
  if (user.isDemo) {
    if (req) {
      const demoRateLimit = applyRateLimit(
        req,
        { limit: 30, windowMs: 60 * 60 * 1000, keyPrefix: 'demo_ai' },
        userId
      );
      if (!demoRateLimit.allowed && demoRateLimit.errorResponse) {
        return {
          allowed: false,
          isDemo: true,
          unlimited: false,
          creditsLeft: 0,
          errorResponse: NextResponse.json(
            {
              error: 'DEMO_RATE_LIMIT',
              message: 'Hourly demo limit reached. Please register a free account to continue.',
            },
            { status: 429 }
          ),
        };
      }
    }

    return {
      allowed: true,
      isDemo: true,
      unlimited: true,
      creditsLeft: Infinity,
    };
  }

  // 3. Entitlement check (Pro vs Free)
  const entitlements = getUserEntitlements(user);

  if (entitlements.unlimited || entitlements.isPro) {
    return {
      allowed: true,
      isDemo: false,
      unlimited: true,
      creditsLeft: Infinity,
    };
  }

  // 4. Feature-specific rules (Resume Generation, Job Match, Cover Letter)
  const currentCredits = typeof user.aiCredits === 'number' ? user.aiCredits : 0;

  if (options?.feature === 'resume_generation') {
    const cost = options.cost ?? RESUME_GENERATION_CREDIT_COST;
    const resumeGensCount =
      typeof user.aiResumeGenerationsCount === 'number' ? user.aiResumeGenerationsCount : 0;

    // Free tier gets 1 AI resume/CV generation total (taste)
    if (resumeGensCount < 1) {
      return {
        allowed: true,
        isDemo: false,
        unlimited: false,
        creditsLeft: currentCredits,
      };
    }

    if (currentCredits < cost) {
      return {
        allowed: false,
        isDemo: false,
        unlimited: false,
        creditsLeft: currentCredits,
        errorResponse: NextResponse.json(
          {
            error: 'NO_CREDITS',
            upgradeUrl: '/pricing',
            message:
              'You have used your 1 free AI resume generation. Upgrade to Pro for unlimited generations or purchase Pay-As-You-Go credits.',
          },
          { status: 402 }
        ),
      };
    }

    return {
      allowed: true,
      isDemo: false,
      unlimited: false,
      creditsLeft: currentCredits,
    };
  }

  if (options?.feature === 'job_match') {
    const cost = options.cost ?? JOB_MATCH_CREDIT_COST;
    const jobMatchFreeUsed =
      typeof user.jobMatchFreeUsed === 'number' ? user.jobMatchFreeUsed : 0;

    // Free tier gets JOB_MATCH_FREE_QUOTA free Job Match searches total
    if (jobMatchFreeUsed < JOB_MATCH_FREE_QUOTA) {
      return {
        allowed: true,
        isDemo: false,
        unlimited: false,
        creditsLeft: JOB_MATCH_FREE_QUOTA - jobMatchFreeUsed,
      };
    }

    if (currentCredits < cost) {
      return {
        allowed: false,
        isDemo: false,
        unlimited: false,
        creditsLeft: currentCredits,
        errorResponse: NextResponse.json(
          {
            error: 'NO_CREDITS',
            upgradeUrl: '/pricing',
            message: `You have used all ${JOB_MATCH_FREE_QUOTA} free Job Match searches. Upgrade to Pro for unlimited searches or purchase Pay-As-You-Go credits.`,
            jobMatchFreeUsed,
          },
          { status: 402 }
        ),
      };
    }

    return {
      allowed: true,
      isDemo: false,
      unlimited: false,
      creditsLeft: currentCredits,
    };
  }

  // Default: Cover letters require aiCredits > 0
  const requiredCost = options?.cost ?? 1;
  if (currentCredits < requiredCost) {
    return {
      allowed: false,
      isDemo: false,
      unlimited: false,
      creditsLeft: currentCredits,
      errorResponse: NextResponse.json(
        {
          error: 'NO_CREDITS',
          upgradeUrl: '/pricing',
          message:
            'You have exhausted your free AI generation credits. Upgrade to Pro for unlimited generations.',
        },
        { status: 402 }
      ),
    };
  }

  return {
    allowed: true,
    isDemo: false,
    unlimited: false,
    creditsLeft: currentCredits,
  };
}

/**
 * Deducts credit ONLY after successful execution.
 * Pro / Enterprise users and Demo users are never deducted.
 * Unauthenticated / missing users fail with UNAUTHORIZED.
 */
export async function consumeCredit(
  userId: string | null | undefined,
  options?: CreditOptions
): Promise<CreditConsumeResult> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return {
      success: false,
      remaining: 0,
      deducted: false,
      error: 'UNAUTHORIZED',
    };
  }

  // 1. Fetch user to check demo or subscription status
  let user: any = null;
  const mongoUp = await isMongoAvailable();
  if (mongoUp) {
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId).lean();
      }
    } catch (err) {
      console.error('[CreditGuard] MongoDB user lookup failed in consumeCredit:', err);
      Sentry.captureException(err);
    }
  }

  if (!user) {
    try {
      user = await DataStore.findUserById(userId);
    } catch (err) {
      console.error('[CreditGuard] DataStore user lookup failed in consumeCredit:', err);
      Sentry.captureException(err);
      return {
        success: false,
        remaining: 0,
        deducted: false,
        error: 'DATABASE_ERROR',
      };
    }
  }

  if (!user) {
    return {
      success: false,
      remaining: 0,
      deducted: false,
      error: 'UNAUTHORIZED',
    };
  }

  // Demo users are never charged
  if (user.isDemo) {
    return { success: true, remaining: Infinity, deducted: false };
  }

  // Pro / Enterprise users: unlimited, no deduction
  const entitlements = getUserEntitlements(user);
  if (entitlements.unlimited || entitlements.isPro) {
    return { success: true, remaining: Infinity, deducted: false };
  }

  // 2. Resume generation handling
  if (options?.feature === 'resume_generation') {
    const cost = options.cost ?? RESUME_GENERATION_CREDIT_COST;
    const resumeGensCount =
      typeof user.aiResumeGenerationsCount === 'number' ? user.aiResumeGenerationsCount : 0;

    // If consuming free taste: increment count without deducting credits
    if (resumeGensCount < 1) {
      if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
        try {
          const updated = await User.findByIdAndUpdate(
            userId,
            { $inc: { aiResumeGenerationsCount: 1 } },
            { new: true }
          );
          if (updated) {
            return {
              success: true,
              remaining: updated.aiCredits,
              deducted: true,
              creditsDeducted: 0,
              resumeGenIncremented: true,
            };
          }
        } catch (err) {
          console.error('[CreditGuard] Failed to increment aiResumeGenerationsCount in MongoDB:', err);
          Sentry.captureException(err);
          return {
            success: false,
            remaining: 0,
            deducted: false,
            error: 'CREDIT_DEDUCTION_FAILED',
          };
        }
      }
      const res = await DataStore.decrementUserCredits(userId, 0, true);
      return {
        ...res,
        creditsDeducted: 0,
        resumeGenIncremented: res.deducted,
      };
    }

    // Free taste already consumed: deduct cost credits (e.g. 2) atomically
    if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const updatedUser = await User.findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(userId),
            aiCredits: { $gte: cost },
          },
          {
            $inc: { aiCredits: -cost, aiResumeGenerationsCount: 1 },
          },
          { new: true }
        );

        if (updatedUser) {
          return {
            success: true,
            remaining: updatedUser.aiCredits,
            deducted: true,
            creditsDeducted: cost,
            resumeGenIncremented: true,
          };
        }
        return {
          success: false,
          remaining: 0,
          deducted: false,
          error: 'No credits remaining',
        };
      } catch (err) {
        console.error('[CreditGuard] Failed to deduct resume generation credits in MongoDB:', err);
        Sentry.captureException(err);
        return {
          success: false,
          remaining: 0,
          deducted: false,
          error: 'CREDIT_DEDUCTION_FAILED',
        };
      }
    }

    const res = await DataStore.decrementUserCredits(userId, cost, true);
    return {
      ...res,
      creditsDeducted: res.deducted ? cost : 0,
      resumeGenIncremented: res.deducted,
    };
  }

  // 3. Job Match search consumption: first JOB_MATCH_FREE_QUOTA free, then 1 PAYG credit
  if (options?.feature === 'job_match') {
    try {
      const res = await DataStore.consumeJobMatchCredit(userId);
      return {
        success: res.success,
        remaining: res.remaining,
        deducted: res.deducted,
        charged: res.charged,
        freeUsed: res.freeUsed,
        freeRemaining: res.freeRemaining,
        creditsRemaining: res.creditsRemaining,
        creditsDeducted: res.creditsDeducted ?? 0,
        jobMatchFreeIncremented: res.jobMatchFreeIncremented ?? res.deducted,
      };
    } catch (err) {
      console.error('[CreditGuard] Failed to consume job match credit:', err);
      Sentry.captureException(err);
      return {
        success: false,
        remaining: 0,
        deducted: false,
        charged: false,
        error: 'CREDIT_DEDUCTION_FAILED',
      };
    }
  }

  // 4. Default: Free users atomic credit decrement for cover letters
  const cost = options?.cost ?? 1;
  if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(userId),
          aiCredits: { $gte: cost },
        },
        {
          $inc: { aiCredits: -cost },
        },
        {
          new: true,
        }
      );

      if (updatedUser) {
        return {
          success: true,
          remaining: updatedUser.aiCredits,
          deducted: true,
          creditsDeducted: cost,
        };
      }
      return {
        success: false,
        remaining: 0,
        deducted: false,
        error: 'No credits remaining',
      };
    } catch (err) {
      console.error('[CreditGuard] Failed to deduct cover letter credit in MongoDB:', err);
      Sentry.captureException(err);
      return {
        success: false,
        remaining: 0,
        deducted: false,
        error: 'CREDIT_DEDUCTION_FAILED',
      };
    }
  }

  try {
    const res = await DataStore.decrementUserCredits(userId, cost, false);
    return {
      ...res,
      creditsDeducted: res.deducted ? cost : 0,
      error: res.success ? undefined : 'No credits remaining',
    };
  } catch (err) {
    console.error('[CreditGuard] Failed to deduct credit in DataStore:', err);
    Sentry.captureException(err);
    return {
      success: false,
      remaining: 0,
      deducted: false,
      error: 'CREDIT_DEDUCTION_FAILED',
    };
  }
}

/**
 * Refunds a previously consumed credit or quota slot if the downstream operation failed.
 */
export async function refundCredit(
  userId: string,
  consumed?: CreditConsumeResult | null,
  options?: CreditOptions
): Promise<{ success: boolean; remaining: number }> {
  if (!userId || (consumed !== undefined && consumed !== null && !consumed.deducted)) {
    return { success: false, remaining: 0 };
  }

  const amount =
    typeof consumed?.creditsDeducted === 'number'
      ? consumed.creditsDeducted
      : options?.cost ?? 1;

  try {
    return await DataStore.refundUserCredits(userId, {
      amount,
      decrementResumeGen: Boolean(
        consumed?.resumeGenIncremented || options?.feature === 'resume_generation'
      ),
      decrementJobMatchFree: Boolean(
        consumed?.jobMatchFreeIncremented || options?.feature === 'job_match'
      ),
    });
  } catch (err) {
    console.error('[CreditGuard] Failed to refund credit:', err);
    Sentry.captureException(err);
    return { success: false, remaining: 0 };
  }
}

/**
 * Route handler wrapper that enforces the full credit guard lifecycle:
 * 1. Authenticates the user (401 if unauthenticated) and verifies credits/quota (402 if exhausted).
 * 2. Executes the route handler.
 * 3. Deducts credit ONLY when the handler succeeds (2xx status).
 * 4. Refunds the credit automatically if a post-deduction error occurs.
 */
export function withCreditGuard(
  handlerOrOptions:
    | CreditOptions
    | ((req: NextRequest, context: CreditGuardHandlerContext) => Promise<NextResponse>),
  maybeHandler?: (req: NextRequest, context: CreditGuardHandlerContext) => Promise<NextResponse>
) {
  const options: CreditOptions | undefined =
    typeof handlerOrOptions === 'function' ? undefined : handlerOrOptions;
  const handler =
    typeof handlerOrOptions === 'function' ? handlerOrOptions : maybeHandler!;

  return async (req: NextRequest, routeContext?: any): Promise<NextResponse> => {
    // 1. Authenticate user
    const auth = requireAuth(req);
    if (!auth.user || auth.errorResponse) {
      return (
        auth.errorResponse ||
        NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        )
      );
    }

    const userId = auth.user.id;

    // 2. Verify credits / quota before executing operation
    const creditCheck = await requireCredits(userId, req, options);
    if (!creditCheck.allowed) {
      return (
        creditCheck.errorResponse ||
        NextResponse.json(
          { error: 'NO_CREDITS', upgradeUrl: '/pricing' },
          { status: 402 }
        )
      );
    }

    let consumed: CreditConsumeResult | null = null;

    try {
      // 3. Execute handler
      const response = await handler(req, {
        user: auth.user,
        creditCheck,
        routeContext,
      });

      // Only deduct when the handler succeeded (2xx) and did not opt out (e.g. cache hit)
      if (response.status >= 200 && response.status < 300) {
        const skipDeduct = response.headers.get('x-skip-credit-deduction') === 'true';
        if (!skipDeduct) {
          consumed = await consumeCredit(userId, options);
          if (!consumed.success) {
            return NextResponse.json(
              {
                error: 'NO_CREDITS',
                upgradeUrl: '/pricing',
                message: consumed.error || 'Insufficient credits to complete request.',
              },
              { status: 402 }
            );
          }
        }
      }

      return response;
    } catch (err: any) {
      console.error('[CreditGuard] Error during guarded handler execution:', err);
      Sentry.captureException(err);

      // 4. Refund credit if it was already deducted before the failure
      if (consumed?.deducted) {
        await refundCredit(userId, consumed, options);
      }

      return NextResponse.json(
        {
          error: 'INTERNAL_ERROR',
          message: err?.message || 'An unexpected error occurred while processing your request.',
        },
        { status: 500 }
      );
    }
  };
}

export default {
  requireCredits,
  consumeCredit,
  refundCredit,
  withCreditGuard,
};
