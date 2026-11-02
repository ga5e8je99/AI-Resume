import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymobHmac } from '@/lib/payments/paymob';
import { getPlanCredits } from '@/lib/plans';
import DataStore from '@/app/lib/datastore';
import { requireCredits, consumeCredit, refundCredit, withCreditGuard } from '@/lib/credit-guard';
import { signToken, hashPassword, verifyToken } from '@/app/lib/auth';
import { POST as extractProfilePOST } from '@/app/api/jobs/extract-profile/route';
import {
  buildCacheKey,
  stripUserMatchDataFromJob,
  setCachedJobResults,
  getCachedJobResults,
} from '@/lib/jobs/cache';
import { scoreJob, rankJobs } from '@/lib/jobs/matcher';
import { Job } from '@/lib/jobs/types';
import Stripe from 'stripe';
import { POST as paymentWebhookPOST } from '@/app/api/webhooks/payment/route';
import { POST as lemonSqueezyWebhookPOST } from '@/app/api/webhooks/lemonsqueezy/route';
import { GET as providersGET } from '@/app/api/payments/providers/route';
import {
  lemonSqueezyProvider,
  stripeProvider,
  paymobProvider,
  ProviderNotConfiguredError,
} from '@/lib/payments';
import {
  applyRateLimit,
  clearAllRateLimits,
  checkRateLimitAsync,
  resetProdUpstashWarningFlag,
  RateLimitModel,
} from '@/lib/rate-limit';
import { POST as extractKeywordsPOST } from '@/app/api/cover-letter/extract-keywords/route';
import { POST as generateResumePOST } from '@/app/api/resume/generate/route';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as forgotPasswordPOST } from '@/app/api/auth/forgot-password/route';
import { GET as verifyEmailGET, POST as verifyEmailPOST } from '@/app/api/auth/verify-email/route';
import { POST as resendVerificationPOST } from '@/app/api/auth/resend-verification/route';
import { POST as jobSearchPOST } from '@/app/api/jobs/search/route';
import { POST as checkoutPOST } from '@/app/api/checkout/route';
import { GET as exportAccountGET } from '@/app/api/account/export/route';
import { DELETE as accountDELETE } from '@/app/api/account/route';
import { GET as adminAiUsageGET } from '@/app/api/admin/ai-usage/route';
import { POST as contactPOST } from '@/app/api/contact/route';
import {
  hasConsent,
  getConsentStatus,
  trackEvent,
  getAnalyticsLog,
  clearAnalyticsLog,
  initPostHog,
} from '@/lib/analytics';
import { AIResumeClient } from '@/app/lib/aiResumeClient';
import { AICoverLetterClient } from '@/app/lib/aiCoverLetterClient';
import {
  getCircuitBreakerState,
  resetCircuitBreaker,
  getRecentAiAlerts,
  clearAiAlertsForTesting,
} from '@/app/lib/aiGovernance';
import { getPlanDailyAiLimit } from '@/lib/plans';
import {
  sendEmail,
  resolveVerifiedSenderAddress,
  getEmailRetryQueue,
  getEmailFailureLogs,
  clearEmailRetryQueueForTests,
  setCustomResendSenderForTests,
  flushEmailRetryQueue,
  getWelcomeEmailHtml,
  getEmailVerificationHtml,
  getPasswordResetEmailHtml,
  getPaymentReceiptEmailHtml,
  getSubscriptionRenewedEmailHtml,
  getSubscriptionCancelledEmailHtml,
  getSubscriptionFailedEmailHtml,
  getAccountDeletedEmailHtml,
  getAccountDeleteConfirmEmailHtml,
} from '@/lib/email';
import { GET as healthGET, HEAD as healthHEAD } from '@/app/api/health/route';
import {
  scrubPiiEvent,
  isBotUserAgent,
  getSentryEnvironment,
  getSentryRelease,
  reportOperationalAlert,
  recordServer5xxAndAlert,
  getOperationalAlertsForTesting,
  clearOperationalAlertsForTesting,
} from '@/lib/sentry';
import { reconcilePayments } from '../scripts/reconcile-payments';
import Organization from '@/app/models/Organization';
import EmployerJob from '@/app/models/EmployerJob';
import Application from '@/app/models/Application';
import HrCreditLedger from '@/app/models/HrCreditLedger';
import {
  hasAccountRole,
  sanitizeJobMarkdown,
  resolveAccountRoleState,
} from '@/lib/hr';
import { GET as employerOverviewGET, POST as employerOverviewPOST } from '@/app/api/employer/overview/route';
import { POST as verifyOrgPOST } from '@/app/api/employer/organizations/[orgId]/verify/route';
import { GET as employerJobsGET, POST as employerJobsPOST } from '@/app/api/employer/jobs/route';
import { GET as employerJobDetailGET, PUT as employerJobDetailPUT } from '@/app/api/employer/jobs/[jobId]/route';
import { GET as jobApplicantsGET } from '@/app/api/employer/jobs/[jobId]/applicants/route';
import { PATCH as applicationPATCH } from '@/app/api/employer/applications/[applicationId]/route';
import { POST as applicationEmailPOST } from '@/app/api/employer/applications/[applicationId]/email/route';
import { POST as jobReportPOST } from '@/app/api/jobs/report/route';
import { GET as adminModerationGET, POST as adminModerationPOST } from '@/app/api/admin/moderation/route';

const DB_FILE = path.join(process.cwd(), '.data', 'db.json');

describe('Critical Platform Security, Payments, Credits & Matching Tests', () => {
  let dbSnapshot: string | null = null;

  before(() => {
    if (fs.existsSync(DB_FILE)) {
      dbSnapshot = fs.readFileSync(DB_FILE, 'utf-8');
    }
  });

  after(() => {
    if (dbSnapshot !== null) {
      fs.writeFileSync(DB_FILE, dbSnapshot, 'utf-8');
    }
  });

  // =========================================================================
  // 1. verifyPaymobHmac
  // =========================================================================
  describe('1. verifyPaymobHmac', () => {
    const hmacSecret = 'paymob_test_hmac_secret_2026_secure_key';

    const sampleTxObj = {
      amount_cents: 25000,
      created_at: '2026-10-31T10:00:00.000000',
      currency: 'EGP',
      error_occured: false,
      has_parent_transaction: false,
      id: 987654321,
      integration_id: 445566,
      is_3d_secure: true,
      is_auth: false,
      is_capture: false,
      is_refunded: false,
      is_standalone_payment: true,
      is_voided: false,
      order: { id: 11223344 },
      owner: 334455,
      pending: false,
      source_data: {
        pan: '2346',
        sub_type: 'MasterCard',
        type: 'card',
      },
      success: true,
    };

    function computeExpectedPaymobHmac(obj: Record<string, any>, secret: string): string {
      const fields = [
        obj.amount_cents,
        obj.created_at,
        obj.currency,
        obj.error_occured,
        obj.has_parent_transaction,
        obj.id,
        obj.integration_id,
        obj.is_3d_secure,
        obj.is_auth,
        obj.is_capture,
        obj.is_refunded,
        obj.is_standalone_payment,
        obj.is_voided,
        obj.order?.id ?? obj.order,
        obj.owner,
        obj.pending,
        obj.source_data?.pan ?? '',
        obj.source_data?.sub_type ?? '',
        obj.source_data?.type ?? '',
        obj.success,
      ];
      const concat = fields
        .map((val) => {
          if (val === undefined || val === null) return '';
          if (typeof val === 'boolean') return val ? 'true' : 'false';
          return String(val);
        })
        .join('');
      return crypto.createHmac('sha512', secret).update(concat).digest('hex');
    }

    it('accepts a valid SHA-512 HMAC computed over the 20 mandatory Paymob fields', () => {
      const validHmac = computeExpectedPaymobHmac(sampleTxObj, hmacSecret);
      assert.equal(verifyPaymobHmac(sampleTxObj, validHmac, hmacSecret), true);
      // Case-insensitive hex check
      assert.equal(verifyPaymobHmac(sampleTxObj, validHmac.toUpperCase(), hmacSecret), true);
      // Scalar order ID compatibility
      const scalarOrderObj = { ...sampleTxObj, order: 11223344 };
      assert.equal(verifyPaymobHmac(scalarOrderObj, validHmac, hmacSecret), true);
    });

    it('rejects tampered transaction fields, wrong secrets, and malformed signatures', () => {
      const validHmac = computeExpectedPaymobHmac(sampleTxObj, hmacSecret);

      // Tampered amount_cents
      assert.equal(
        verifyPaymobHmac({ ...sampleTxObj, amount_cents: 100 }, validHmac, hmacSecret),
        false
      );

      // Tampered success flag
      assert.equal(
        verifyPaymobHmac({ ...sampleTxObj, success: false }, validHmac, hmacSecret),
        false
      );

      // Tampered order.id
      assert.equal(
        verifyPaymobHmac({ ...sampleTxObj, order: { id: 99999999 } }, validHmac, hmacSecret),
        false
      );

      // Wrong secret
      assert.equal(verifyPaymobHmac(sampleTxObj, validHmac, 'wrong_secret_key'), false);

      // Malformed / non-128 hex string
      assert.equal(verifyPaymobHmac(sampleTxObj, 'deadbeef', hmacSecret), false);
      assert.equal(verifyPaymobHmac(sampleTxObj, '', hmacSecret), false);

      // Missing or unconfigured secret
      assert.equal(verifyPaymobHmac(sampleTxObj, validHmac, ''), false);
      assert.equal(verifyPaymobHmac(sampleTxObj, validHmac, 'your_paymob_hmac_secret'), false);
    });
  });

  // =========================================================================
  // 2. completeOrder idempotency
  // =========================================================================
  describe('2. completeOrder idempotency', () => {
    it('completes a PAYG order once and guarantees idempotency on repeated and concurrent calls', async () => {
      const user = await DataStore.createUserAccount({
        name: 'Idempotency Tester',
        email: `idem_${Date.now()}@test.com`,
        password: 'password123',
        plan: 'free',
        aiCredits: 2,
      });

      const order = await DataStore.createOrder({
        userId: user.id,
        userEmail: user.email,
        planId: 'payg',
        billingCycle: 'once',
        baseAmount: 5,
        amount: 5,
        currency: 'USD',
        method: 'stripe',
        reference: `ref_idem_${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      // Concurrent completion calls on the same order
      const [res1, res2, res3] = await Promise.all([
        DataStore.completeOrder(order.id, { actor: 'test' }),
        DataStore.completeOrder(order.id, { actor: 'test' }),
        DataStore.completeOrder(order.id, { actor: 'test' }),
      ]);

      assert.equal(res1.success, true);
      assert.equal(res2.success, true);
      assert.equal(res3.success, true);

      // Exactly one call processed the initial transition; subsequent ones report alreadyPaid: true
      const freshCompletions = [res1, res2, res3].filter((r) => !r.alreadyPaid);
      const repeatCompletions = [res1, res2, res3].filter((r) => r.alreadyPaid === true);
      assert.equal(freshCompletions.length, 1, 'Exactly one completion should be non-alreadyPaid');
      assert.equal(repeatCompletions.length, 2, 'Repeat completions must return alreadyPaid: true');

      // Sequential call after completion
      const res4 = await DataStore.completeOrder(order.id, { actor: 'test' });
      assert.equal(res4.success, true);
      assert.equal(res4.alreadyPaid, true);

      // Verify user credits were incremented only ONCE (initial 2 + PAYG pack credits = 17)
      const paygCredits = Number(getPlanCredits('payg'));
      const updatedUser = await DataStore.findUserById(user.id);
      assert.equal(
        updatedUser?.aiCredits,
        2 + paygCredits,
        'PAYG credits must be granted exactly once'
      );
    });
  });

  // =========================================================================
  // 3. Order reference lookup & status transitions (Stripe & Paymob)
  // =========================================================================
  describe('3. Order reference lookup & status transitions', () => {
    it('creates Stripe/Paymob orders without requiring txid/network and tracks status transitions accurately', async () => {
      const user = await DataStore.createUserAccount({
        name: 'Order Lifecycle Tester',
        email: `order_ref_${Date.now()}@test.com`,
        password: 'password123',
        plan: 'free',
        aiCredits: 1,
      });

      const refA = `ref_order_a_${Date.now()}`;
      const orderA = await DataStore.createOrder({
        userId: user.id,
        userEmail: user.email,
        planId: 'pro',
        billingCycle: 'monthly',
        baseAmount: 9,
        amount: 9,
        currency: 'USD',
        method: 'stripe',
        reference: refA,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const foundByRef = await DataStore.findOrderByReference(refA);
      assert.equal(foundByRef?.id, orderA.id);
      assert.equal(foundByRef?.currency, 'USD');
      assert.equal(foundByRef?.method, 'stripe');

      const completeA = await DataStore.completeOrder(orderA.id, {
        actor: 'test',
      });
      assert.equal(completeA.success, true);

      const checkOrderA = await DataStore.findOrderById(orderA.id);
      assert.equal(checkOrderA?.status, 'paid');
    });
  });

  // =========================================================================
  // 4. Atomic credit deduction & refund on failure
  // =========================================================================
  describe('4. Atomic credit deduction & refund on failure', () => {
    it('deducts credits atomically with floor guard at 0 and refunds upon failure', async () => {
      const user = await DataStore.createUserAccount({
        name: 'Credit Atomic Tester',
        email: `credit_atomic_${Date.now()}@test.com`,
        password: 'password123',
        plan: 'free',
        aiCredits: 2,
      });
      const token = signToken({ userId: user.id, email: user.email, name: user.name });

      // 1. Failing route handler (HTTP 500) inside withCreditGuard must NOT deduct credits
      const failingHandler = withCreditGuard(async () => {
        return NextResponse.json({ error: 'AI_UPSTREAM_TIMEOUT' }, { status: 500 });
      });
      const failReq = new NextRequest('http://localhost:3000/api/test-credit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const failRes = await failingHandler(failReq);
      assert.equal(failRes.status, 500);
      const afterFail = await DataStore.findUserById(user.id);
      assert.equal(afterFail?.aiCredits, 2, 'Credits must remain 2 when guarded handler returns 500');

      // 2. Successful route handler (HTTP 200) deducts 1 credit atomically (2 -> 1)
      const okHandler = withCreditGuard(async () => {
        return NextResponse.json({ ok: true }, { status: 200 });
      });
      const okReq = new NextRequest('http://localhost:3000/api/test-credit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const okRes = await okHandler(okReq);
      assert.equal(okRes.status, 200);
      const afterOk = await DataStore.findUserById(user.id);
      assert.equal(afterOk?.aiCredits, 1, 'Credits must be 1 after 200 OK response');

      // 3. Consume remaining credit (1 -> 0) and verify floor guard prevents negative balance
      const consumeLast = await consumeCredit(user.id);
      assert.equal(consumeLast.success, true);
      assert.equal(consumeLast.deducted, true);
      assert.equal(consumeLast.remaining, 0);

      const consumeWhenZero = await consumeCredit(user.id);
      assert.equal(consumeWhenZero.success, false);
      assert.equal(consumeWhenZero.deducted, false);
      assert.equal(consumeWhenZero.remaining, 0, 'Credits must never go below 0');

      // 4. Exhausted user gets HTTP 402 with upgradeUrl: '/pricing'
      const exhaustedCheck = await requireCredits(user.id);
      assert.equal(exhaustedCheck.allowed, false);
      assert.equal(exhaustedCheck.errorResponse?.status, 402);
      const exhaustedBody = await exhaustedCheck.errorResponse?.json();
      assert.equal(exhaustedBody.error, 'NO_CREDITS');
      assert.equal(exhaustedBody.upgradeUrl, '/pricing');

      // 5. refundCredit restores credit when a downstream step fails after deduction (0 -> 1)
      const refunded = await refundCredit(user.id, consumeLast);
      assert.equal(refunded.success, true);
      assert.equal(refunded.remaining, 1, 'refundCredit must restore the deducted credit');
    });
  });

  // =========================================================================
  // 5. Resume ownership in extract-profile
  // =========================================================================
  describe('5. Resume ownership in /api/jobs/extract-profile', () => {
    it('enforces authentication and blocks cross-user IDOR access to another user resumeId', async () => {
      const ownerUser = await DataStore.createUserAccount({
        name: 'Resume Owner',
        email: `owner_${Date.now()}@test.com`,
        password: 'password123',
        plan: 'free',
        aiCredits: 3,
      });
      const otherUser = await DataStore.createUserAccount({
        name: 'Other User',
        email: `other_${Date.now()}@test.com`,
        password: 'password123',
        plan: 'free',
        aiCredits: 3,
      });

      const ownerResume = await DataStore.createUserResume(ownerUser.id, {
        title: 'Owner Private Senior DevOps Resume',
        templateId: 'compact',
        theme: 'jade',
        data: {
          personalInfo: {
            fullName: 'Owner User',
            jobTitle: 'Senior Kubernetes Architect',
            location: 'Berlin, Germany',
          },
          skills: ['Kubernetes', 'Terraform', 'AWS', 'Golang', 'Docker'],
          experience: [{ title: 'Senior Kubernetes Architect', company: 'CloudCorp' }],
        },
      });

      const ownerToken = signToken({
        userId: ownerUser.id,
        email: ownerUser.email,
        name: ownerUser.name,
      });
      const otherToken = signToken({
        userId: otherUser.id,
        email: otherUser.email,
        name: otherUser.name,
      });

      // 1. Unauthenticated request -> 401
      const unauthReq = new NextRequest('http://localhost:3000/api/jobs/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: ownerResume.id }),
      });
      const unauthRes = await extractProfilePOST(unauthReq);
      assert.equal(unauthRes.status, 401);

      // 2. Other user attempting to extract profile from ownerUser's resumeId -> 404 RESUME_NOT_FOUND
      const idorReq = new NextRequest('http://localhost:3000/api/jobs/extract-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherToken}`,
        },
        body: JSON.stringify({ resumeId: ownerResume.id }),
      });
      const idorRes = await extractProfilePOST(idorReq);
      assert.equal(idorRes.status, 404);
      const idorBody = await idorRes.json();
      assert.equal(idorBody.error, 'RESUME_NOT_FOUND');

      // 3. Owner requesting their own resumeId -> 200 OK with matching profile
      const ownerReq = new NextRequest('http://localhost:3000/api/jobs/extract-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ resumeId: ownerResume.id }),
      });
      const ownerRes = await extractProfilePOST(ownerReq);
      assert.equal(ownerRes.status, 200);
      const ownerBody = await ownerRes.json();
      assert.equal(ownerBody.success, true);
      assert.ok(ownerBody.profile.topSkills.includes('Kubernetes'));
    });
  });

  // =========================================================================
  // 6. Job cache key + per-user matching
  // =========================================================================
  describe('6. Job cache key isolation + per-user matching', () => {
    it('builds normalized user-agnostic cache keys, strips user match fields from cache, and computes distinct per-user scores', async () => {
      // 1. Cache key normalization
      const key1 = buildCacheKey({
        query: '  Software Engineer ',
        location: 'Cairo, Egypt ',
        remote: true,
        country: 'EG',
      });
      const key2 = buildCacheKey({
        query: 'software engineer',
        location: 'cairo, egypt',
        remote: true,
        country: 'eg',
      });
      assert.equal(key1, key2);
      assert.equal(key1, 'job_search:software engineer:cairo, egypt:remote:eg');

      // 2. Cache stores strictly raw jobs (strips matchScore, matchReasons, missingSkills, matchedSkills)
      const pollutedJob: Job = {
        id: 'job_cache_1',
        title: 'Senior Frontend React Engineer',
        company: 'TechFlow',
        location: 'Cairo, Egypt',
        remote: true,
        description: 'Build modern web apps using React, TypeScript, Next.js, Tailwind, and GraphQL.',
        url: 'https://example.com/jobs/1',
        source: 'Remotive',
        postedDate: new Date().toISOString(),
        tags: ['React', 'TypeScript', 'Next.js'],
        matchScore: 97,
        matchReasons: ['Polluted reason from User A'],
        matchedSkills: ['React', 'TypeScript'],
        missingSkills: ['GraphQL'],
      };

      const stripped = stripUserMatchDataFromJob(pollutedJob);
      assert.equal(stripped.matchScore, undefined);
      assert.equal(stripped.matchReasons, undefined);
      assert.equal(stripped.matchedSkills, undefined);
      assert.equal(stripped.missingSkills, undefined);

      const uniqueQuery = `software_engineer_cache_test_${Date.now()}`;
      await setCachedJobResults(
        { query: uniqueQuery, location: 'Cairo', remote: true, country: 'eg' },
        {
          jobs: [
            pollutedJob,
            {
              id: 'job_cache_2',
              title: 'Senior Backend Python Engineer',
              company: 'DataSystems',
              location: 'Cairo, Egypt',
              remote: true,
              description: 'Architect scalable APIs with Python, Django, FastAPI, PostgreSQL, and Docker.',
              url: 'https://example.com/jobs/2',
              source: 'Arbeitnow',
              postedDate: new Date().toISOString(),
              tags: ['Python', 'Django', 'PostgreSQL', 'Docker'],
            },
          ],
          totalFound: 2,
          attributions: [],
          sourcesQueried: ['Remotive', 'Arbeitnow'],
        }
      );

      const cached = await getCachedJobResults({
        query: uniqueQuery,
        location: 'Cairo',
        remote: true,
        country: 'eg',
      });
      assert.ok(cached);
      assert.equal(cached.jobs.length, 2);
      assert.equal(cached.jobs[0].matchScore, undefined, 'Cached job must not retain user matchScore');
      assert.equal(cached.jobs[0].matchedSkills, undefined, 'Cached job must not retain user matchedSkills');

      // 3. Per-user matching produces personalized rankings for different users on the same cached jobs
      const frontendUserRanked = rankJobs(cached.jobs, {
        query: 'Senior Frontend Engineer',
        location: 'Cairo',
        remote: true,
        skills: ['React', 'TypeScript', 'Next.js', 'Tailwind'],
        seniority: 'senior',
      });

      const backendUserRanked = rankJobs(cached.jobs, {
        query: 'Senior Backend Engineer',
        location: 'Cairo',
        remote: true,
        skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
        seniority: 'senior',
      });

      assert.equal(
        frontendUserRanked[0].id,
        'job_cache_1',
        'Frontend user should have React job ranked #1'
      );
      assert.equal(
        backendUserRanked[0].id,
        'job_cache_2',
        'Backend user should have Python job ranked #1'
      );
      assert.ok(
        (frontendUserRanked[0].matchScore ?? 0) > (frontendUserRanked[1].matchScore ?? 0)
      );
      assert.ok(
        (backendUserRanked[0].matchScore ?? 0) > (backendUserRanked[1].matchScore ?? 0)
      );

      // Direct scoreJob check
      const feScoreOnReactJob = scoreJob(cached.jobs[0], {
        query: 'Frontend Engineer',
        skills: ['React', 'TypeScript', 'Next.js'],
        remote: true,
      });
      assert.ok(feScoreOnReactJob.matchedSkills.includes('React'));
      assert.ok(feScoreOnReactJob.missingSkills.includes('Graphql'));
    });
  });

  // =========================================================================
  // 7. Paymob webhook amount & currency mismatch rejection
  // =========================================================================
  describe('7. Paymob webhook amount & currency mismatch rejection', () => {
    const hmacSecret = 'paymob_webhook_test_secret_2026_key';

    function createSignedPaymobWebhookRequest(txObj: Record<string, any>): NextRequest {
      const fields = [
        txObj.amount_cents,
        txObj.created_at,
        txObj.currency,
        txObj.error_occured,
        txObj.has_parent_transaction,
        txObj.id,
        txObj.integration_id,
        txObj.is_3d_secure,
        txObj.is_auth,
        txObj.is_capture,
        txObj.is_refunded,
        txObj.is_standalone_payment,
        txObj.is_voided,
        txObj.order?.id ?? txObj.order,
        txObj.owner,
        txObj.pending,
        txObj.source_data?.pan ?? '',
        txObj.source_data?.sub_type ?? '',
        txObj.source_data?.type ?? '',
        txObj.success,
      ];
      const concat = fields
        .map((val) => {
          if (val === undefined || val === null) return '';
          if (typeof val === 'boolean') return val ? 'true' : 'false';
          return String(val);
        })
        .join('');
      const hmac = crypto.createHmac('sha512', hmacSecret).update(concat).digest('hex');

      return new NextRequest(
        `http://localhost:3000/api/webhooks/payment?hmac=${hmac}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ obj: txObj }),
        }
      );
    }

    it('rejects underpaid and currency-mismatched Paymob webhooks with HTTP 400 and leaves order unpaid', async () => {
      const origSecret = process.env.PAYMOB_HMAC_SECRET;
      process.env.PAYMOB_HMAC_SECRET = hmacSecret;

      try {
        const user = await DataStore.createUserAccount({
          name: 'Paymob Webhook Tester',
          email: `paymob_wh_${Date.now()}@test.com`,
          password: 'password123',
          plan: 'free',
          aiCredits: 1,
        });

        const reference = `jm_paymob_${Date.now()}`;
        const order = await DataStore.createOrder({
          userId: user.id,
          userEmail: user.email,
          planId: 'pro',
          billingCycle: 'monthly',
          baseAmount: 350,
          amount: 350,
          currency: 'EGP',
          method: 'paymob',
          reference,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        const baseTxObj = {
          created_at: '2026-10-31T12:00:00.000000',
          error_occured: false,
          has_parent_transaction: false,
          integration_id: 445566,
          is_3d_secure: true,
          is_auth: false,
          is_capture: false,
          is_refunded: false,
          is_standalone_payment: true,
          is_voided: false,
          order: { id: 778899, merchant_order_id: reference },
          owner: 334455,
          pending: false,
          source_data: { pan: '2346', sub_type: 'MasterCard', type: 'card' },
          success: true,
        };

        // 1. Underpaid webhook (paid 100 EGP instead of expected 350 EGP) -> HTTP 400
        const underpaidReq = createSignedPaymobWebhookRequest({
          ...baseTxObj,
          id: 900001,
          amount_cents: 10000,
          currency: 'EGP',
        });

        const underpaidRes = await paymentWebhookPOST(underpaidReq);
        assert.equal(underpaidRes.status, 400);
        const underpaidBody = await underpaidRes.json();
        assert.equal(underpaidBody.error, 'AMOUNT_OR_CURRENCY_MISMATCH');

        // Verify order was NOT marked paid
        const orderAfterUnderpaid = await DataStore.findOrderById(order.id);
        assert.notEqual(orderAfterUnderpaid?.status, 'paid');

        // 2. Currency mismatch webhook (paid 350 USD instead of EGP) -> HTTP 400
        const wrongCurrencyReq = createSignedPaymobWebhookRequest({
          ...baseTxObj,
          id: 900002,
          amount_cents: 35000,
          currency: 'USD',
        });

        const wrongCurrencyRes = await paymentWebhookPOST(wrongCurrencyReq);
        assert.equal(wrongCurrencyRes.status, 400);
        const wrongCurrencyBody = await wrongCurrencyRes.json();
        assert.equal(wrongCurrencyBody.error, 'AMOUNT_OR_CURRENCY_MISMATCH');

        // 3. Valid exact amount (350 EGP = 35000 cents) -> HTTP 200 and order becomes 'paid'
        const validReq = createSignedPaymobWebhookRequest({
          ...baseTxObj,
          id: 900003,
          amount_cents: 35000,
          currency: 'EGP',
        });

        const validRes = await paymentWebhookPOST(validReq);
        assert.equal(validRes.status, 200);

        const orderAfterValid = await DataStore.findOrderById(order.id);
        assert.equal(orderAfterValid?.status, 'paid');
      } finally {
        if (origSecret !== undefined) {
          process.env.PAYMOB_HMAC_SECRET = origSecret;
        } else {
          delete process.env.PAYMOB_HMAC_SECRET;
        }
      }
    });
  });

  // =========================================================================
  // 8. vercel.json maxDuration, per-user + per-IP rate limits (Retry-After) & AI body/input bounds
  // =========================================================================
  describe('8. vercel.json maxDuration, dual rate limiting (Retry-After), and AI payload bounds', () => {
    it('configures maxDuration: 60 strictly on the 3 AI & job search routes in vercel.json', () => {
      const vercelJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf-8')
      );
      const fnKeys = Object.keys(vercelJson.functions || {}).sort();
      assert.deepEqual(fnKeys, [
        'app/api/cover-letter/generate/route.ts',
        'app/api/jobs/search/route.ts',
        'app/api/resume/generate/route.ts',
      ]);
      for (const k of fnKeys) {
        assert.equal(vercelJson.functions[k].maxDuration, 60);
      }
    });

    it('enforces both per-user and per-IP rate limits and sets Retry-After on 429 responses', async () => {
      await clearAllRateLimits();

      // 1. Per-user limit check (limit: 2, ipLimit: 10)
      const makeUserReq = () =>
        new NextRequest('http://localhost:3000/api/test-rl', {
          method: 'POST',
          headers: { 'x-forwarded-for': '203.0.113.10' },
        });

      const u1 = await applyRateLimit(
        makeUserReq(),
        { limit: 2, ipLimit: 10, windowMs: 60000, keyPrefix: 'test_dual_u' },
        'user_rl_1'
      );
      const u2 = await applyRateLimit(
        makeUserReq(),
        { limit: 2, ipLimit: 10, windowMs: 60000, keyPrefix: 'test_dual_u' },
        'user_rl_1'
      );
      const u3 = await applyRateLimit(
        makeUserReq(),
        { limit: 2, ipLimit: 10, windowMs: 60000, keyPrefix: 'test_dual_u' },
        'user_rl_1'
      );

      assert.equal(u1.allowed, true);
      assert.equal(u2.allowed, true);
      assert.equal(u3.allowed, false);
      assert.equal(u3.errorResponse?.status, 429);
      assert.ok(Number(u3.errorResponse?.headers.get('Retry-After')) >= 1);

      // 2. Per-IP limit check across different users from the same IP (limit: 5, ipLimit: 2)
      const makeIpReq = () =>
        new NextRequest('http://localhost:3000/api/test-rl', {
          method: 'POST',
          headers: { 'x-forwarded-for': '203.0.113.99' },
        });

      const i1 = await applyRateLimit(
        makeIpReq(),
        { limit: 5, ipLimit: 2, windowMs: 60000, keyPrefix: 'test_dual_ip' },
        'user_a'
      );
      const i2 = await applyRateLimit(
        makeIpReq(),
        { limit: 5, ipLimit: 2, windowMs: 60000, keyPrefix: 'test_dual_ip' },
        'user_b'
      );
      const i3 = await applyRateLimit(
        makeIpReq(),
        { limit: 5, ipLimit: 2, windowMs: 60000, keyPrefix: 'test_dual_ip' },
        'user_c'
      );

      assert.equal(i1.allowed, true);
      assert.equal(i2.allowed, true);
      assert.equal(i3.allowed, false, 'Third request from same IP must be blocked by ipLimit');
      assert.equal(i3.errorResponse?.status, 429);
      assert.ok(Number(i3.errorResponse?.headers.get('Retry-After')) >= 1);
    });

    it('rejects oversized request bodies (413) and excessive input lengths (400) on AI endpoints', async () => {
      // 1. Oversized body (> 100KB) on /api/cover-letter/extract-keywords -> 413 PAYLOAD_TOO_LARGE
      const hugePayload = JSON.stringify({ text: 'A'.repeat(110 * 1024) });
      const oversizedReq = new NextRequest(
        'http://localhost:3000/api/cover-letter/extract-keywords',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: oversizedReqBody(hugePayload),
        }
      );
      const oversizedRes = await extractKeywordsPOST(oversizedReq);
      assert.equal(oversizedRes.status, 413);
      const oversizedData = await oversizedRes.json();
      assert.equal(oversizedData.error, 'PAYLOAD_TOO_LARGE');

      // 2. Input text > 35,000 chars (but body < 100KB) -> 400 INPUT_TOO_LONG
      const tooLongTextReq = new NextRequest(
        'http://localhost:3000/api/cover-letter/extract-keywords',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'B'.repeat(36000) }),
        }
      );
      const tooLongRes = await extractKeywordsPOST(tooLongTextReq);
      assert.equal(tooLongRes.status, 400);
      const tooLongData = await tooLongRes.json();
      assert.equal(tooLongData.error, 'INPUT_TOO_LONG');

      // 3. Oversized targetJobTitle (> 120 chars) on /api/resume/generate -> 400
      const user = await DataStore.createUserAccount({
        name: 'Bounds Tester',
        email: `bounds_${Date.now()}@test.com`,
        password: 'password123',
        plan: 'pro',
        aiCredits: 10,
      });
      const token = signToken({ userId: user.id, email: user.email, name: user.name });

      const longTitleReq = new NextRequest('http://localhost:3000/api/resume/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetJobTitle: 'S'.repeat(150),
          jobDescription: 'Valid job description with sufficient length for testing.',
        }),
      });
      const longTitleRes = await generateResumePOST(longTitleReq);
      assert.equal(longTitleRes.status, 400);
    });

    it('uses Upstash Redis Sliding Window when configured and logs warning + falls back to MongoDB TTL collection in production when Upstash is missing', async () => {
      const origUrl = process.env.UPSTASH_REDIS_REST_URL;
      const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      const origNodeEnv = process.env.NODE_ENV;
      const origFetch = global.fetch;

      try {
        // 1. Upstash Redis Sliding Window pipeline test
        process.env.UPSTASH_REDIS_REST_URL = 'https://mock-upstash.upstash.io';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'mock_upstash_secret_token';

        let capturedPipelineCommands: any[] = [];
        global.fetch = (async (_url: any, init: any) => {
          capturedPipelineCommands = JSON.parse(init.body);
          const now = Date.now();
          return new Response(
            JSON.stringify([
              { result: 0 }, // ZREMRANGEBYSCORE
              { result: 1 }, // ZADD
              { result: 3 }, // ZCARD (3 requests in window)
              { result: [`${now}:abc`, String(now - 5000)] }, // ZRANGE WITHSCORES
              { result: 1 }, // PEXPIRE
            ]),
            { status: 200 }
          );
        }) as any;

        const upstashAllowed = await checkRateLimitAsync('test_sw_key', {
          limit: 3,
          windowMs: 60000,
        });
        assert.equal(upstashAllowed.allowed, true);
        assert.equal(upstashAllowed.remaining, 0);
        assert.equal(upstashAllowed.backend, 'upstash');
        assert.equal(capturedPipelineCommands[0][0], 'ZREMRANGEBYSCORE');
        assert.equal(capturedPipelineCommands[1][0], 'ZADD');
        assert.equal(capturedPipelineCommands[2][0], 'ZCARD');
        assert.equal(capturedPipelineCommands[4][0], 'PEXPIRE');

        // 2. Missing Upstash in production -> logs warning and verifies Mongo TTL schema index
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
        (process.env as any).NODE_ENV = 'production';
        resetProdUpstashWarningFlag();

        const warnings: string[] = [];
        const origWarn = console.warn;
        console.warn = (...args: any[]) => {
          warnings.push(args.join(' '));
        };

        try {
          await checkRateLimitAsync('prod_no_upstash_key', {
            limit: 5,
            windowMs: 60000,
          });
        } finally {
          console.warn = origWarn;
        }

        assert.ok(
          warnings.some((w) => w.includes('UPSTASH_REDIS_REST_URL') && w.includes('MongoDB TTL')),
          'Must log warning when Upstash is not configured in production'
        );

        // Verify RateLimitModel schema has TTL index `{ expires: 0 }` on `resetAt`
        const resetAtPath: any = RateLimitModel.schema.path('resetAt');
        assert.ok(resetAtPath, 'RateLimitModel must define resetAt field');
        assert.equal(
          resetAtPath.options?.index?.expires,
          0,
          'RateLimitModel.resetAt must have MongoDB TTL index { expires: 0 }'
        );
      } finally {
        global.fetch = origFetch;
        (process.env as any).NODE_ENV = origNodeEnv;
        if (origUrl !== undefined) process.env.UPSTASH_REDIS_REST_URL = origUrl;
        else delete process.env.UPSTASH_REDIS_REST_URL;
        if (origToken !== undefined) process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
        else delete process.env.UPSTASH_REDIS_REST_TOKEN;
      }
    });
  });

  // =========================================================================
  // 9. Lemon Squeezy PaymentProvider & Webhook Verification Suite
  // =========================================================================
  describe('9. Lemon Squeezy PaymentProvider, Webhook HMAC, Idempotency, Refunds & Amount Mismatch', () => {
    const lsSecret = 'ls_test_webhook_secret_2026_hmac_key';

    function signLemonPayload(rawBody: string, secret = lsSecret): string {
      return crypto.createHmac('sha256', secret).update(Buffer.from(rawBody, 'utf8')).digest('hex');
    }

    function makeLemonWebhookRequest(payloadObj: Record<string, any>, customSignature?: string): NextRequest {
      const rawBody = JSON.stringify(payloadObj);
      const signature = customSignature !== undefined ? customSignature : signLemonPayload(rawBody);
      return new NextRequest('http://localhost:3000/api/webhooks/lemonsqueezy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
        },
        body: rawBody,
      });
    }

    it('rejects invalid or tampered X-Signature with HTTP 401', async () => {
      const origSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET = lsSecret;

      try {
        const payload = {
          meta: {
            event_name: 'order_created',
            webhook_id: `wh_invalid_sig_${Date.now()}`,
            custom_data: { orderId: 'ord_nonexistent', userId: 'usr_nonexistent' },
          },
          data: {
            id: '1001',
            type: 'orders',
            attributes: {
              total: 500,
              currency: 'USD',
              status: 'paid',
            },
          },
        };

        // 1. Wrong signature
        const badSigReq = makeLemonWebhookRequest(
          payload,
          crypto.createHmac('sha256', 'wrong_secret').update(JSON.stringify(payload)).digest('hex')
        );
        const badSigRes = await lemonSqueezyWebhookPOST(badSigReq);
        assert.equal(badSigRes.status, 401);
        const badSigBody = await badSigRes.json();
        assert.equal(badSigBody.error, 'INVALID_SIGNATURE');

        // 2. Missing/malformed signature
        const missingSigReq = makeLemonWebhookRequest(payload, '');
        const missingSigRes = await lemonSqueezyWebhookPOST(missingSigReq);
        assert.equal(missingSigRes.status, 401);
      } finally {
        if (origSecret !== undefined) {
          process.env.LEMONSQUEEZY_WEBHOOK_SECRET = origSecret;
        } else {
          delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
        }
      }
    });

    it('activates PAYG order once on valid order_created, ignores duplicate event, and revokes credits on order_refunded', async () => {
      const origSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET = lsSecret;

      try {
        const user = await DataStore.createUserAccount({
          name: 'LS PAYG User',
          email: `ls_payg_${Date.now()}@test.com`,
          password: 'password123',
          plan: 'free',
          aiCredits: 3,
        });

        const order = await DataStore.createOrder({
          userId: user.id,
          userEmail: user.email,
          planId: 'payg',
          billingCycle: 'once',
          baseAmount: 5,
          amount: 5,
          currency: 'USD',
          method: 'lemonsqueezy',
          reference: `ls_ref_payg_${Date.now()}`,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        const webhookEventId = `wh_order_created_${Date.now()}`;
        const orderCreatedPayload = {
          meta: {
            event_name: 'order_created',
            webhook_id: webhookEventId,
            custom_data: {
              orderId: order.id,
              userId: user.id,
            },
          },
          data: {
            id: '2002',
            type: 'orders',
            attributes: {
              total: 500, // $5.00 in cents
              currency: 'USD',
              customer_id: 778899,
              status: 'paid',
            },
          },
        };

        // 1. Valid order_created -> marks order 'paid' once and adds 15 credits (3 -> 18)
        const res1 = await lemonSqueezyWebhookPOST(makeLemonWebhookRequest(orderCreatedPayload));
        assert.equal(res1.status, 200);
        const body1 = await res1.json();
        assert.equal(body1.status, 'paid');
        assert.equal(body1.duplicate, false);

        const paidOrder = await DataStore.findOrderById(order.id);
        assert.equal(paidOrder?.status, 'paid');

        const paygCredits = Number(getPlanCredits('payg'));
        const userAfterPaid = await DataStore.findUserById(user.id);
        assert.equal(userAfterPaid?.aiCredits, 3 + paygCredits);
        assert.equal(userAfterPaid?.lemonCustomerId, '778899');

        // 2. Duplicate event sent again -> returns 200 duplicate: true and does NOT grant credits a second time
        const res2 = await lemonSqueezyWebhookPOST(makeLemonWebhookRequest(orderCreatedPayload));
        assert.equal(res2.status, 200);
        const body2 = await res2.json();
        assert.equal(body2.duplicate, true);

        const userAfterDuplicate = await DataStore.findUserById(user.id);
        assert.equal(
          userAfterDuplicate?.aiCredits,
          3 + paygCredits,
          'Duplicate webhook must not increment credits again'
        );

        // 3. Even if a second distinct webhook_id arrives for the same already-paid order, completeOrder is idempotent
        const secondWebhookForSameOrder = {
          ...orderCreatedPayload,
          meta: {
            ...orderCreatedPayload.meta,
            webhook_id: `wh_order_created_retry_${Date.now()}`,
          },
        };
        const resRetry = await lemonSqueezyWebhookPOST(
          makeLemonWebhookRequest(secondWebhookForSameOrder)
        );
        assert.equal(resRetry.status, 200);
        const bodyRetry = await resRetry.json();
        assert.equal(bodyRetry.duplicate, true);

        const userAfterRetry = await DataStore.findUserById(user.id);
        assert.equal(userAfterRetry?.aiCredits, 3 + paygCredits);

        // 4. order_refunded -> revokes the granted PAYG credits (18 -> 3) and marks order 'refunded'
        const refundPayload = {
          meta: {
            event_name: 'order_refunded',
            webhook_id: `wh_order_refunded_${Date.now()}`,
            custom_data: {
              orderId: order.id,
              userId: user.id,
            },
          },
          data: {
            id: '2002',
            type: 'orders',
            attributes: {
              total: 500,
              currency: 'USD',
              status: 'refunded',
            },
          },
        };

        const refundRes = await lemonSqueezyWebhookPOST(makeLemonWebhookRequest(refundPayload));
        assert.equal(refundRes.status, 200);
        const refundBody = await refundRes.json();
        assert.equal(refundBody.status, 'refunded');

        const refundedOrder = await DataStore.findOrderById(order.id);
        assert.equal(refundedOrder?.status, 'refunded');

        const userAfterRefund = await DataStore.findUserById(user.id);
        assert.equal(
          userAfterRefund?.aiCredits,
          3,
          'Refund must revoke the 15 PAYG credits back to 3'
        );
      } finally {
        if (origSecret !== undefined) {
          process.env.LEMONSQUEEZY_WEBHOOK_SECRET = origSecret;
        } else {
          delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
        }
      }
    });

    it('activates Pro plan on subscription_created, stores lemonCustomerId/lemonSubscriptionId, and revokes Pro plan on order_refunded', async () => {
      const origSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET = lsSecret;

      try {
        const user = await DataStore.createUserAccount({
          name: 'LS Pro Subscriber',
          email: `ls_pro_${Date.now()}@test.com`,
          password: 'password123',
          plan: 'free',
          aiCredits: 3,
        });

        const order = await DataStore.createOrder({
          userId: user.id,
          userEmail: user.email,
          planId: 'pro',
          billingCycle: 'monthly',
          baseAmount: 9,
          amount: 9,
          currency: 'USD',
          method: 'lemonsqueezy',
          reference: `ls_ref_pro_${Date.now()}`,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        const subCreatedPayload = {
          meta: {
            event_name: 'subscription_created',
            webhook_id: `wh_sub_created_${Date.now()}`,
            custom_data: {
              orderId: order.id,
              userId: user.id,
            },
          },
          data: {
            id: 'sub_ls_99001',
            type: 'subscriptions',
            attributes: {
              total: 900, // $9.00 in cents
              currency: 'USD',
              customer_id: 556677,
              status: 'active',
            },
          },
        };

        const subRes = await lemonSqueezyWebhookPOST(makeLemonWebhookRequest(subCreatedPayload));
        assert.equal(subRes.status, 200);

        const userAfterSub = await DataStore.findUserById(user.id);
        assert.equal(userAfterSub?.plan, 'pro');
        assert.equal(userAfterSub?.paymentProvider, 'lemonsqueezy');
        assert.equal(userAfterSub?.lemonCustomerId, '556677');
        assert.equal(userAfterSub?.lemonSubscriptionId, 'sub_ls_99001');

        // Refund the Pro order -> downgrades user back to 'free'
        const proRefundPayload = {
          meta: {
            event_name: 'order_refunded',
            webhook_id: `wh_pro_refund_${Date.now()}`,
            custom_data: {
              orderId: order.id,
              userId: user.id,
            },
          },
          data: {
            id: 'ord_ls_99001',
            type: 'orders',
            attributes: {
              total: 900,
              currency: 'USD',
              status: 'refunded',
            },
          },
        };

        const proRefundRes = await lemonSqueezyWebhookPOST(
          makeLemonWebhookRequest(proRefundPayload)
        );
        assert.equal(proRefundRes.status, 200);

        const userAfterProRefund = await DataStore.findUserById(user.id);
        assert.equal(userAfterProRefund?.plan, 'free');
        assert.equal(userAfterProRefund?.subscriptionStatus, 'canceled');
      } finally {
        if (origSecret !== undefined) {
          process.env.LEMONSQUEEZY_WEBHOOK_SECRET = origSecret;
        } else {
          delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
        }
      }
    });

    it('rejects amount or currency mismatch with HTTP 400 and records rejected status on Order and PaymentEvent', async () => {
      const origSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET = lsSecret;

      try {
        const user = await DataStore.createUserAccount({
          name: 'LS Mismatch User',
          email: `ls_mismatch_${Date.now()}@test.com`,
          password: 'password123',
          plan: 'free',
          aiCredits: 2,
        });

        const order = await DataStore.createOrder({
          userId: user.id,
          userEmail: user.email,
          planId: 'pro',
          billingCycle: 'annual',
          baseAmount: 84,
          amount: 84,
          currency: 'USD',
          method: 'lemonsqueezy',
          reference: `ls_ref_mismatch_${Date.now()}`,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        const mismatchEventId = `wh_mismatch_${Date.now()}`;
        const underpaidPayload = {
          meta: {
            event_name: 'order_created',
            webhook_id: mismatchEventId,
            custom_data: {
              orderId: order.id,
              userId: user.id,
            },
          },
          data: {
            id: '3003',
            type: 'orders',
            attributes: {
              total: 500, // $5.00 instead of $84.00 (8400 cents)
              currency: 'USD',
              status: 'paid',
            },
          },
        };

        const mismatchRes = await lemonSqueezyWebhookPOST(
          makeLemonWebhookRequest(underpaidPayload)
        );
        assert.equal(mismatchRes.status, 400);
        const mismatchBody = await mismatchRes.json();
        assert.equal(mismatchBody.error, 'AMOUNT_OR_CURRENCY_MISMATCH');
        assert.equal(mismatchBody.status, 'rejected');

        const orderAfterMismatch = await DataStore.findOrderById(order.id);
        assert.equal(orderAfterMismatch?.status, 'rejected');

        const recordedEvent = await DataStore.findPaymentEvent(mismatchEventId);
        assert.equal(recordedEvent?.status, 'rejected');

        const userAfterMismatch = await DataStore.findUserById(user.id);
        assert.equal(userAfterMismatch?.plan, 'free');
      } finally {
        if (origSecret !== undefined) {
          process.env.LEMONSQUEEZY_WEBHOOK_SECRET = origSecret;
        } else {
          delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
        }
      }
    });

    it('enforces 503 PROVIDER_NOT_CONFIGURED when keys are missing and returns enabled providers via /api/payments/providers', async () => {
      const prevAllowMock = process.env.ALLOW_MOCK_PAYMENTS;
      const prevLsKey = process.env.LEMONSQUEEZY_API_KEY;
      delete process.env.ALLOW_MOCK_PAYMENTS;
      delete process.env.LEMONSQUEEZY_API_KEY;

      try {
        await assert.rejects(
          async () => {
            await lemonSqueezyProvider.createCheckout(
              {
                id: 'ord_test_503',
                planId: 'pro',
                billingCycle: 'monthly',
                amount: 9,
                currency: 'USD',
              },
              {
                id: 'usr_test_503',
                email: 'test503@example.com',
              }
            );
          },
          (err: any) =>
            err instanceof ProviderNotConfiguredError &&
            err.code === 'PROVIDER_NOT_CONFIGURED' &&
            err.statusCode === 503
        );

        const provRes = await providersGET();
        assert.equal(provRes.status, 200);
        const provData = await provRes.json();
        assert.ok(Array.isArray(provData.enabledProviders));
        assert.ok(!provData.enabledProviders.includes('lemonsqueezy'));
      } finally {
        if (prevAllowMock !== undefined) process.env.ALLOW_MOCK_PAYMENTS = prevAllowMock;
        if (prevLsKey !== undefined) process.env.LEMONSQUEEZY_API_KEY = prevLsKey;
      }
    });
  });

  // =========================================================================
  // 10. Optional Stripe & Paymob PaymentProviders: UI Visibility & Order-Bound Webhook Rules
  // =========================================================================
  describe('10. Optional Stripe & Paymob PaymentProviders: UI Visibility & Order-Bound Webhook Rules', () => {
    it('hides Stripe and Paymob from /api/payments/providers unless their keys exist in env (even in mock mode)', async () => {
      const prevAllowMock = process.env.ALLOW_MOCK_PAYMENTS;
      const prevStripeKey = process.env.STRIPE_SECRET_KEY;
      const prevPaymobApi = process.env.PAYMOB_API_KEY;
      const prevPaymobInt = process.env.PAYMOB_INTEGRATION_ID;
      const prevPaymobIframe = process.env.PAYMOB_IFRAME_ID;

      try {
        process.env.ALLOW_MOCK_PAYMENTS = 'true';
        delete process.env.STRIPE_SECRET_KEY;
        delete process.env.PAYMOB_API_KEY;
        delete process.env.PAYMOB_INTEGRATION_ID;
        delete process.env.PAYMOB_IFRAME_ID;

        // 1. Even with ALLOW_MOCK_PAYMENTS=true, Stripe & Paymob must NOT appear in UI providers without env keys
        const resUnconfigured = await providersGET();
        const dataUnconfigured = await resUnconfigured.json();
        assert.equal(
          dataUnconfigured.enabledProviders.includes('stripe'),
          false,
          'Stripe must not appear in UI providers when STRIPE_SECRET_KEY is absent'
        );
        assert.equal(
          dataUnconfigured.enabledProviders.includes('paymob'),
          false,
          'Paymob must not appear in UI providers when Paymob keys are absent'
        );

        // 2. When Stripe & Paymob env keys are configured, they appear in enabledProviders
        assert.equal(stripeProvider.name, 'stripe');
        assert.equal(paymobProvider.name, 'paymob');

        // Verify both providers throw 503 ProviderNotConfiguredError when keys are missing and mock is disabled
        delete process.env.ALLOW_MOCK_PAYMENTS;
        await assert.rejects(
          async () => {
            await stripeProvider.createCheckout(
              { id: 'ord_s503', planId: 'payg', billingCycle: 'once', amount: 5, currency: 'USD' },
              { id: 'usr_s503', email: 's503@test.com' }
            );
          },
          (err: any) => err instanceof ProviderNotConfiguredError && err.statusCode === 503
        );
        await assert.rejects(
          async () => {
            await paymobProvider.createCheckout(
              { id: 'ord_p503', planId: 'payg', billingCycle: 'once', amount: 150, currency: 'EGP' },
              { id: 'usr_p503', email: 'p503@test.com' }
            );
          },
          (err: any) => err instanceof ProviderNotConfiguredError && err.statusCode === 503
        );

        process.env.STRIPE_SECRET_KEY = 'sk_test_configured_key_123';
        process.env.PAYMOB_API_KEY = 'paymob_api_key_configured_123';
        process.env.PAYMOB_INTEGRATION_ID = '445566';
        process.env.PAYMOB_IFRAME_ID = '889900';

        const resConfigured = await providersGET();
        const dataConfigured = await resConfigured.json();
        assert.equal(dataConfigured.enabledProviders.includes('stripe'), true);
        assert.equal(dataConfigured.enabledProviders.includes('paymob'), true);
        assert.equal(dataConfigured.currencies.includes('USD'), true);
        assert.equal(dataConfigured.currencies.includes('EGP'), true);
      } finally {
        if (prevAllowMock !== undefined) process.env.ALLOW_MOCK_PAYMENTS = prevAllowMock;
        else delete process.env.ALLOW_MOCK_PAYMENTS;
        if (prevStripeKey !== undefined) process.env.STRIPE_SECRET_KEY = prevStripeKey;
        else delete process.env.STRIPE_SECRET_KEY;
        if (prevPaymobApi !== undefined) process.env.PAYMOB_API_KEY = prevPaymobApi;
        else delete process.env.PAYMOB_API_KEY;
        if (prevPaymobInt !== undefined) process.env.PAYMOB_INTEGRATION_ID = prevPaymobInt;
        else delete process.env.PAYMOB_INTEGRATION_ID;
        if (prevPaymobIframe !== undefined) process.env.PAYMOB_IFRAME_ID = prevPaymobIframe;
        else delete process.env.PAYMOB_IFRAME_ID;
      }
    });

    it('enforces mandatory signature, Order-bound activation, and amount/currency verification on Stripe webhooks', async () => {
      const stripeWebhookSecret = 'whsec_test_stripe_provider_secret_2026';
      const origWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      process.env.STRIPE_WEBHOOK_SECRET = stripeWebhookSecret;

      const stripeTestHelper = new Stripe('sk_test_webhook_helper', {
        apiVersion: '2025-02-24.acacia' as any,
      });

      function makeStripeWebhookRequest(eventPayload: Record<string, any>, badSecret?: string) {
        const rawBody = JSON.stringify(eventPayload);
        const sigHeader = stripeTestHelper.webhooks.generateTestHeaderString({
          payload: rawBody,
          secret: badSecret || stripeWebhookSecret,
        });
        return new NextRequest('http://localhost:3000/api/webhooks/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': sigHeader,
          },
          body: rawBody,
        });
      }

      try {
        const user = await DataStore.createUserAccount({
          name: 'Stripe Order Tester',
          email: `stripe_order_${Date.now()}@test.com`,
          password: 'password123',
          plan: 'free',
          aiCredits: 2,
        });

        const order = await DataStore.createOrder({
          userId: user.id,
          userEmail: user.email,
          planId: 'payg',
          billingCycle: 'once',
          baseAmount: 5,
          amount: 5,
          currency: 'USD',
          method: 'stripe',
          reference: `stripe_ref_${Date.now()}`,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        // 1. Invalid signature -> 401 INVALID_SIGNATURE
        const badSigEvent = {
          id: `evt_stripe_bad_sig_${Date.now()}`,
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_bad',
              amount_total: 500,
              currency: 'usd',
              metadata: { orderId: order.id, reference: order.reference, userId: user.id },
            },
          },
        };
        const badSigRes = await paymentWebhookPOST(
          makeStripeWebhookRequest(badSigEvent, 'whsec_wrong_secret')
        );
        assert.equal(badSigRes.status, 401);
        const badSigBody = await badSigRes.json();
        assert.equal(badSigBody.error, 'INVALID_SIGNATURE');

        // 2. Amount mismatch (paid $1.00 = 100 cents instead of $5.00 = 500 cents) -> 400 AMOUNT_OR_CURRENCY_MISMATCH & Order rejected
        const mismatchEventId = `evt_stripe_mismatch_${Date.now()}`;
        const mismatchOrder = await DataStore.createOrder({
          userId: user.id,
          userEmail: user.email,
          planId: 'pro',
          billingCycle: 'monthly',
          baseAmount: 9,
          amount: 9,
          currency: 'USD',
          method: 'stripe',
          reference: `stripe_ref_mismatch_${Date.now()}`,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        const mismatchEvent = {
          id: mismatchEventId,
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_mismatch',
              amount_total: 100, // $1.00 instead of $9.00
              currency: 'usd',
              metadata: {
                orderId: mismatchOrder.id,
                reference: mismatchOrder.reference,
                userId: user.id,
              },
            },
          },
        };
        const mismatchRes = await paymentWebhookPOST(makeStripeWebhookRequest(mismatchEvent));
        assert.equal(mismatchRes.status, 400);
        const mismatchBody = await mismatchRes.json();
        assert.equal(mismatchBody.error, 'AMOUNT_OR_CURRENCY_MISMATCH');

        const checkMismatchOrder = await DataStore.findOrderById(mismatchOrder.id);
        assert.equal(checkMismatchOrder?.status, 'rejected');

        // 3. Valid exact amount ($5.00 = 500 cents) -> 200 paid & grants PAYG credits once
        const validEventId = `evt_stripe_valid_${Date.now()}`;
        const validEvent = {
          id: validEventId,
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_valid_500',
              amount_total: 500,
              currency: 'usd',
              customer: 'cus_stripe_9988',
              metadata: {
                orderId: order.id,
                reference: order.reference,
                userId: user.id,
              },
            },
          },
        };
        const validRes = await paymentWebhookPOST(makeStripeWebhookRequest(validEvent));
        assert.equal(validRes.status, 200);
        const validBody = await validRes.json();
        assert.equal(validBody.status, 'paid');

        const paygCredits = Number(getPlanCredits('payg'));
        const userAfterValid = await DataStore.findUserById(user.id);
        assert.equal(userAfterValid?.aiCredits, 2 + paygCredits);
        assert.equal((userAfterValid as any)?.stripeCustomerId, 'cus_stripe_9988');

        // 4. Duplicate event -> 200 duplicate: true, no extra credits
        const dupRes = await paymentWebhookPOST(makeStripeWebhookRequest(validEvent));
        assert.equal(dupRes.status, 200);
        const dupBody = await dupRes.json();
        assert.equal(dupBody.duplicate, true);
        const userAfterDup = await DataStore.findUserById(user.id);
        assert.equal(userAfterDup?.aiCredits, 2 + paygCredits);

        // 5. Refund via charge.refunded -> revokes PAYG credits and marks Order 'refunded'
        const refundEvent = {
          id: `evt_stripe_refund_${Date.now()}`,
          type: 'charge.refunded',
          data: {
            object: {
              id: 'ch_test_refund_500',
              amount_refunded: 500,
              currency: 'usd',
              metadata: {
                orderId: order.id,
                reference: order.reference,
                userId: user.id,
              },
            },
          },
        };
        const refundRes = await paymentWebhookPOST(makeStripeWebhookRequest(refundEvent));
        assert.equal(refundRes.status, 200);

        const orderAfterRefund = await DataStore.findOrderById(order.id);
        assert.equal(orderAfterRefund?.status, 'refunded');
        const userAfterRefund = await DataStore.findUserById(user.id);
        assert.equal(userAfterRefund?.aiCredits, 2);
      } finally {
        if (origWebhookSecret !== undefined) {
          process.env.STRIPE_WEBHOOK_SECRET = origWebhookSecret;
        } else {
          delete process.env.STRIPE_WEBHOOK_SECRET;
        }
      }
    });
  });

  // =========================================================================
  // 11. Email Verification, Feature Gating, Rate Limiting (3/hr) & Enumeration Protection
  // =========================================================================
  describe('11. Email Verification, Feature Gating, Rate Limiting & Enumeration Protection', () => {
    it('stores SHA-256 verification token hash on register, gates job search / AI / checkout until verified, enforces 3/hr resend rate limit, and prevents enumeration', async () => {
      clearAllRateLimits();
      const testEmail = `verify_user_${Date.now()}@test.com`;

      // 1. Register new user -> sets emailVerified: null, stores 64-char SHA-256 hash, 24h expiry
      const regReq = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.77',
        },
        body: JSON.stringify({
          name: 'Verification Tester',
          email: testEmail,
          password: 'securePassword123',
          language: 'en',
        }),
      });
      const regRes = await registerPOST(regReq);
      assert.equal(regRes.status, 201);
      const regBody = await regRes.json();
      assert.equal(regBody.success, true);
      assert.equal(regBody.requiresVerification, true);
      assert.equal(regBody.user.emailVerified, null);

      const storedUser = await DataStore.findUserByEmail(testEmail);
      assert.ok(storedUser, 'Registered user must exist in DataStore');
      assert.equal(storedUser.emailVerified, null);
      assert.ok(
        typeof storedUser.emailVerifyTokenHash === 'string' &&
          /^[a-f0-9]{64}$/.test(storedUser.emailVerifyTokenHash),
        'emailVerifyTokenHash must be a 64-char SHA-256 hex digest'
      );
      assert.ok(storedUser.emailVerifyExpires, 'emailVerifyExpires must be set');
      const expiryDiffMs =
        new Date(storedUser.emailVerifyExpires as string).getTime() - Date.now();
      assert.ok(
        expiryDiffMs > 23 * 60 * 60 * 1000 && expiryDiffMs <= 24 * 60 * 60 * 1000 + 5000,
        'Verification token expiry must be ~24 hours'
      );

      // 2. Enumeration protection in /api/auth/register & /api/auth/forgot-password
      const dupRegReq = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.77',
        },
        body: JSON.stringify({
          name: 'Another Name',
          email: testEmail,
          password: 'anotherPassword123',
          language: 'en',
        }),
      });
      const dupRegRes = await registerPOST(dupRegReq);
      const dupRegBody = await dupRegRes.json();
      assert.equal(
        dupRegBody.message,
        regBody.message,
        'Register must return identical message for existing vs new email (no enumeration)'
      );
      assert.equal(
        dupRegBody.user,
        undefined,
        'Register must never issue a session user object for an existing email'
      );

      const forgotExistingReq = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.78' },
        body: JSON.stringify({ email: testEmail, language: 'en' }),
      });
      const forgotMissingReq = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.78' },
        body: JSON.stringify({ email: `nonexistent_${Date.now()}@test.com`, language: 'en' }),
      });
      const forgotExistingRes = await forgotPasswordPOST(forgotExistingReq);
      const forgotMissingRes = await forgotPasswordPOST(forgotMissingReq);
      assert.equal(forgotExistingRes.status, 200);
      assert.equal(forgotMissingRes.status, 200);
      const forgotExistingBody = await forgotExistingRes.json();
      const forgotMissingBody = await forgotMissingRes.json();
      assert.equal(
        forgotExistingBody.message,
        forgotMissingBody.message,
        'Forgot-password must return identical message for existing and non-existent emails'
      );

      // 3. Unverified user CAN log in
      const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.79' },
        body: JSON.stringify({ email: testEmail, password: 'securePassword123' }),
      });
      const loginRes = await loginPOST(loginReq);
      assert.equal(loginRes.status, 200);

      const authToken = signToken({
        userId: storedUser.id,
        email: storedUser.email,
        name: storedUser.name,
      });

      // 4. Unverified user is BLOCKED from Free Job Search, AI Generation, and Payment Checkout (403 EMAIL_NOT_VERIFIED)
      const jobSearchReq = new NextRequest('http://localhost:3000/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ query: 'Frontend Engineer', location: 'Cairo' }),
      });
      const jobSearchRes = await jobSearchPOST(jobSearchReq);
      assert.equal(jobSearchRes.status, 403);
      const jobSearchBody = await jobSearchRes.json();
      assert.equal(jobSearchBody.error, 'EMAIL_NOT_VERIFIED');

      const aiCreditCheck = await requireCredits(storedUser.id);
      assert.equal(aiCreditCheck.allowed, false);
      assert.equal(aiCreditCheck.errorResponse?.status, 403);
      const aiErrBody = await aiCreditCheck.errorResponse?.json();
      assert.equal(aiErrBody.error, 'EMAIL_NOT_VERIFIED');

      const checkoutReq = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ planId: 'pro', currency: 'USD', billingCycle: 'monthly' }),
      });
      const checkoutRes = await checkoutPOST(checkoutReq);
      assert.equal(checkoutRes.status, 403);
      const checkoutBody = await checkoutRes.json();
      assert.equal(checkoutBody.error, 'EMAIL_NOT_VERIFIED');

      // 5. Resend verification endpoint enforces 3/hour rate limit
      clearAllRateLimits();
      for (let i = 1; i <= 3; i++) {
        const resendReq = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
            'x-forwarded-for': '203.0.113.80',
          },
          body: JSON.stringify({ email: testEmail, language: 'en' }),
        });
        const resendRes = await resendVerificationPOST(resendReq);
        assert.equal(resendRes.status, 200, `Resend attempt #${i} should succeed (200)`);
      }

      const fourthResendReq = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'x-forwarded-for': '203.0.113.80',
        },
        body: JSON.stringify({ email: testEmail, language: 'en' }),
      });
      const fourthResendRes = await resendVerificationPOST(fourthResendReq);
      assert.equal(fourthResendRes.status, 429, '4th resend in 1 hour must be blocked with 429');
      assert.ok(fourthResendRes.headers.get('Retry-After'), '429 must include Retry-After header');

      // 6. Verify email via /api/auth/verify-email: invalid token -> 400, valid token -> 200 + deletes token + unlocks features
      const knownRawToken = crypto.randomBytes(32).toString('hex');
      const knownTokenHash = crypto.createHash('sha256').update(knownRawToken).digest('hex');
      await DataStore.setEmailVerifyToken(
        storedUser.id,
        knownTokenHash,
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );

      // Invalid token -> 400
      const badVerifyReq = new NextRequest(
        `http://localhost:3000/api/auth/verify-email?token=${'f'.repeat(64)}`,
        { method: 'GET' }
      );
      const badVerifyRes = await verifyEmailGET(badVerifyReq);
      assert.equal(badVerifyRes.status, 400);

      // Valid token via POST -> 200
      const validVerifyReq = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: knownRawToken }),
      });
      const validVerifyRes = await verifyEmailPOST(validVerifyReq);
      assert.equal(validVerifyRes.status, 200);
      const validVerifyBody = await validVerifyRes.json();
      assert.equal(validVerifyBody.success, true);
      assert.ok(validVerifyBody.emailVerified);

      // Re-using the same token after verification -> 400 (token was deleted)
      const reuseVerifyRes = await verifyEmailPOST(
        new NextRequest('http://localhost:3000/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: knownRawToken }),
        })
      );
      assert.equal(reuseVerifyRes.status, 400, 'Used verification token must be rejected');

      const verifiedUser = await DataStore.findUserById(storedUser.id);
      assert.ok(verifiedUser?.emailVerified, 'emailVerified date must be populated');
      assert.equal(
        verifiedUser?.emailVerifyTokenHash ?? null,
        null,
        'emailVerifyTokenHash must be cleared after verification'
      );
      assert.equal(
        verifiedUser?.emailVerifyExpires ?? null,
        null,
        'emailVerifyExpires must be cleared after verification'
      );

      // Verified user now passes requireCredits for AI generation & Job Search
      const verifiedCreditCheck = await requireCredits(storedUser.id);
      assert.equal(verifiedCreditCheck.allowed, true);
      const verifiedJobCreditCheck = await requireCredits(storedUser.id, undefined, {
        feature: 'job_match',
      });
      assert.equal(verifiedJobCreditCheck.allowed, true);
    });
  });

  // =========================================================================
  // 12. Privacy Data Export (GET /api/account/export) & Account Deletion + Billing Anonymization (DELETE /api/account)
  // =========================================================================
  describe('12. Privacy Data Export & Account Deletion with Subscription Cancel + Billing Anonymization', () => {
    it('exports profile + resumes + coverLetters + orders with auth & rate limit, and deletes account while anonymizing orders/payments', async () => {
      clearAllRateLimits();
      const plainPassword = 'myPrivacyPassword99!';
      const hashedPassword = await hashPassword(plainPassword);
      const userEmail = `privacy_${Date.now()}@test.com`;

      const user = await DataStore.createUserAccount({
        name: 'Privacy & GDPR Tester',
        email: userEmail,
        password: hashedPassword,
        plan: 'pro',
        aiCredits: 10,
      });

      // Set active subscription fields on user
      await DataStore.upgradeUserPlan(user.id, {
        plan: 'pro',
        billingCycle: 'monthly',
        planExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        proExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        paymentProvider: 'lemonsqueezy',
        lemonCustomerId: 'cus_ls_777',
        lemonSubscriptionId: 'ls_mock_sub_777',
        subscriptionStatus: 'active',
      });

      // Create a resume, cover letter, analysis, and paid order for this user
      const createdResume = await DataStore.createUserResume(user.id, {
        title: 'Privacy Tester Resume',
        templateId: 'compact',
        theme: {},
        data: { personalInfo: { fullName: 'Privacy Tester', email: userEmail } },
      });

      await DataStore.createUserAnalysis(user.id, {
        resumeFileName: 'privacy.pdf',
        targetRole: 'Backend Engineer',
        overallScore: 91,
      });

      const orderRef = `ord_priv_${Date.now()}`;
      const createdOrder = await DataStore.createOrder({
        userId: user.id,
        userEmail,
        planId: 'pro',
        billingCycle: 'monthly',
        baseAmount: 9,
        amount: 9,
        currency: 'USD',
        method: 'lemonsqueezy',
        reference: orderRef,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        metadata: {
          customerName: 'Privacy & GDPR Tester',
          customerEmail: userEmail,
        },
      });
      await DataStore.completeOrder(createdOrder.id, {
        actor: 'test',
        provider: 'lemonsqueezy',
        customerId: 'cus_ls_777',
        subscriptionId: 'ls_mock_sub_777',
      });

      const token = signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      // 1. Unauthenticated export -> 401
      const unauthExportRes = await exportAccountGET(
        new NextRequest('http://localhost:3000/api/account/export', { method: 'GET' })
      );
      assert.equal(unauthExportRes.status, 401);

      // 2. Authenticated export -> 200 JSON with profile, resumes, coverLetters, orders
      const exportReq = new NextRequest('http://localhost:3000/api/account/export', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-forwarded-for': '198.51.100.50',
        },
      });
      const exportRes = await exportAccountGET(exportReq);
      assert.equal(exportRes.status, 200);
      assert.ok(
        exportRes.headers.get('Content-Disposition')?.includes('jobmatch-data-export-'),
        'Must include attachment Content-Disposition header'
      );
      const exportJson = await exportRes.json();
      assert.equal(exportJson.profile.id, user.id);
      assert.equal(exportJson.profile.email, userEmail);
      assert.equal((exportJson.profile as any).password, undefined, 'Password hash must never be exported');
      assert.equal(Array.isArray(exportJson.resumes), true);
      assert.equal(exportJson.resumes.length, 1);
      assert.equal(exportJson.resumes[0].id, createdResume.id);
      assert.equal(Array.isArray(exportJson.coverLetters), true);
      assert.equal(Array.isArray(exportJson.orders), true);
      assert.equal(exportJson.orders.length, 1);
      assert.equal(exportJson.orders[0].reference, orderRef);

      // 3. Rate limit on /api/account/export (5/hour -> 6th returns 429)
      for (let i = 2; i <= 5; i++) {
        const r = await exportAccountGET(
          new NextRequest('http://localhost:3000/api/account/export', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'x-forwarded-for': '198.51.100.50',
            },
          })
        );
        assert.equal(r.status, 200);
      }
      const sixthExportRes = await exportAccountGET(
        new NextRequest('http://localhost:3000/api/account/export', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-forwarded-for': '198.51.100.50',
          },
        })
      );
      assert.equal(sixthExportRes.status, 429, '6th export within 1 hour must return 429');

      // 4. DELETE /api/account rejects wrong password (401) and wrong confirmText (400)
      const wrongPwRes = await accountDELETE(
        new NextRequest('http://localhost:3000/api/account', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: 'wrongPassword!', confirmText: 'DELETE' }),
        })
      );
      assert.equal(wrongPwRes.status, 401);

      const wrongConfirmTextRes = await accountDELETE(
        new NextRequest('http://localhost:3000/api/account', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: plainPassword, confirmText: 'KEEP' }),
        })
      );
      assert.equal(wrongConfirmTextRes.status, 400);

      // 5. Valid DELETE /api/account -> cancels subscription, deletes resumes/analyses/user, anonymizes orders/payments, revokes session
      const validDeleteRes = await accountDELETE(
        new NextRequest('http://localhost:3000/api/account', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: plainPassword, confirmText: 'DELETE', language: 'en' }),
        })
      );
      assert.equal(validDeleteRes.status, 200);
      const validDeleteBody = await validDeleteRes.json();
      assert.equal(validDeleteBody.success, true);
      assert.equal(validDeleteBody.hadActiveSubscription, true);
      assert.equal(validDeleteBody.subscriptionCanceled, true);
      assert.equal(validDeleteBody.deletedCounts.resumes, 1);
      assert.equal(validDeleteBody.deletedCounts.analyses, 1);
      assert.equal(validDeleteBody.anonymizedCounts.orders, 1);
      assert.ok(validDeleteBody.anonymizedCounts.payments >= 1);

      // User, resumes, and analyses are permanently gone
      const deletedUserLookup = await DataStore.findUserById(user.id);
      assert.equal(deletedUserLookup, null, 'User record must be deleted');
      const remainingResumes = await DataStore.getUserResumes(user.id);
      assert.equal(remainingResumes.length, 0, 'User resumes must be deleted');
      const remainingAnalyses = await DataStore.getUserAnalyses(user.id);
      assert.equal(remainingAnalyses.length, 0, 'User analyses must be deleted');

      // Session JWT is immediately revoked
      assert.equal(verifyToken(token), null, 'Deleted user JWT must be immediately invalidated');

      // Financial order record is preserved for accounting but completely anonymized
      const anonymizedOrder = await DataStore.findOrderById(createdOrder.id);
      assert.ok(anonymizedOrder, 'Order record must be retained for accounting');
      assert.equal(anonymizedOrder.amount, 9);
      assert.equal(anonymizedOrder.currency, 'USD');
      assert.equal(anonymizedOrder.status, 'paid');
      assert.notEqual(anonymizedOrder.userId, user.id, 'Order userId must be anonymized');
      assert.ok(
        anonymizedOrder.userId.startsWith('deleted_user_'),
        'Order userId must use deleted_user_ prefix'
      );
      assert.notEqual(anonymizedOrder.userEmail, userEmail, 'Order userEmail must be anonymized');
      assert.ok(
        anonymizedOrder.userEmail.endsWith('@anonymized.local'),
        'Order userEmail must use @anonymized.local domain'
      );
      assert.equal(
        anonymizedOrder.metadata?.customerEmail,
        undefined,
        'PII must be stripped from order metadata'
      );
      assert.equal(
        anonymizedOrder.metadata?.customerName,
        undefined,
        'PII must be stripped from order metadata'
      );
      assert.equal(anonymizedOrder.metadata?.anonymized, true);
    });
  });

  // =========================================================================
  // 11. AI Resilience (Timeout, max_tokens, 1 Retry, Circuit Breaker), AiUsage, Daily Quotas & Budget Alerts
  // =========================================================================
  describe('11. AI Resilience, Circuit Breaker, AiUsage Logging, Daily Quotas & Admin Cost Endpoint', () => {
    it('enforces 1 retry, max_tokens, timeout, and trips Circuit Breaker after N consecutive failures for 1 minute', async () => {
      resetCircuitBreaker();
      clearAiAlertsForTesting();
      await DataStore.clearAiUsageForTesting();

      const origKey = process.env.OPENAI_API_KEY;
      const origRetries = process.env.AI_MAX_RETRIES;
      const origThreshold = process.env.AI_CIRCUIT_BREAKER_THRESHOLD;
      const origCooldown = process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS;
      const origBudget = process.env.AI_DAILY_BUDGET_USD;
      const origFetch = global.fetch;

      let upstreamFetchCalls = 0;

      try {
        process.env.OPENAI_API_KEY = 'sk-test-circuit-breaker';
        delete process.env.AI_MAX_RETRIES; // verify default is 1 retry
        process.env.AI_CIRCUIT_BREAKER_THRESHOLD = '2'; // trip after 2 consecutive failures
        process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS = '60000'; // 1 minute cooldown
        process.env.AI_DAILY_BUDGET_USD = '50';

        // Default config check: maxRetries = 1, maxTokens > 0, timeoutMs > 0
        const resumeCfg = AIResumeClient.getConfig();
        const coverCfg = AICoverLetterClient.getConfig();
        assert.equal(resumeCfg.maxRetries, 1, 'Default maxRetries must be 1');
        assert.equal(coverCfg.maxRetries, 1, 'Default maxRetries must be 1');
        assert.ok(resumeCfg.maxTokens > 0);
        assert.ok(coverCfg.maxTokens > 0);

        // Mock upstream LLM returning 503 Service Unavailable
        global.fetch = (async () => {
          upstreamFetchCalls++;
          return new Response(JSON.stringify({ error: 'Upstream overloaded' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }) as typeof fetch;

        // Failure #1: 1 initial attempt + 1 retry = 2 fetch calls
        const res1 = await AIResumeClient.generateResume(
          { targetJobTitle: 'Backend Engineer', jobDescription: 'Node.js, TypeScript, PostgreSQL, Redis' },
          { userId: 'usr_cb_1', endpoint: '/api/resume/generate' }
        );
        assert.equal(res1.aiGenerated, false);
        assert.equal(res1.provider, 'built-in-ats-fallback');
        assert.equal(upstreamFetchCalls, 2, 'Must perform 1 initial call + 1 retry = 2 calls');
        assert.equal(getCircuitBreakerState().state, 'CLOSED');
        assert.equal(getCircuitBreakerState().consecutiveFailures, 1);

        // Failure #2: trips circuit breaker (threshold = 2) -> state becomes OPEN for 1 minute
        const res2 = await AICoverLetterClient.generateCoverLetter(
          {
            jobTitle: 'Backend Engineer',
            companyName: 'CloudScale',
            jobDescription: 'Seeking a Senior Backend Engineer with Node.js and distributed systems experience.',
            tone: 'technical',
            language: 'en',
          },
          null,
          { userId: 'usr_cb_1', endpoint: '/api/cover-letter/generate' }
        );
        assert.equal(res2.aiGenerated, false);
        assert.equal(upstreamFetchCalls, 4, 'Second failed request performs 2 more calls (total 4)');

        const cbOpen = getCircuitBreakerState();
        assert.equal(cbOpen.state, 'OPEN', 'Circuit breaker must be OPEN after N consecutive failures');
        assert.equal(cbOpen.consecutiveFailures, 2);
        assert.ok(cbOpen.openUntil && cbOpen.openUntil - Date.now() > 50000, 'Circuit must stay open for ~1 minute');

        // Request #3 while Circuit Breaker is OPEN -> immediately uses fallback with 0 upstream fetch calls!
        const res3 = await AIResumeClient.generateResume(
          { targetJobTitle: 'Backend Engineer', jobDescription: 'Node.js, TypeScript, PostgreSQL' },
          { userId: 'usr_cb_1', endpoint: '/api/resume/generate' }
        );
        assert.equal(res3.aiGenerated, false);
        assert.equal(res3.fallbackReason, 'circuit_breaker_open');
        assert.equal(upstreamFetchCalls, 4, 'Must NOT call upstream provider while circuit breaker is OPEN');
      } finally {
        global.fetch = origFetch;
        resetCircuitBreaker();
        if (origKey !== undefined) process.env.OPENAI_API_KEY = origKey;
        else delete process.env.OPENAI_API_KEY;
        if (origRetries !== undefined) process.env.AI_MAX_RETRIES = origRetries;
        else delete process.env.AI_MAX_RETRIES;
        if (origThreshold !== undefined) process.env.AI_CIRCUIT_BREAKER_THRESHOLD = origThreshold;
        else delete process.env.AI_CIRCUIT_BREAKER_THRESHOLD;
        if (origCooldown !== undefined) process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS = origCooldown;
        else delete process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS;
        if (origBudget !== undefined) process.env.AI_DAILY_BUDGET_USD = origBudget;
        else delete process.env.AI_DAILY_BUDGET_USD;
      }
    });

    it('logs every AI request in AiUsage and enforces per-user daily limits (plans.ts) and AI_DAILY_BUDGET_USD with alerts', async () => {
      resetCircuitBreaker();
      clearAiAlertsForTesting();
      await DataStore.clearAiUsageForTesting();

      const origKey = process.env.OPENAI_API_KEY;
      const origBudget = process.env.AI_DAILY_BUDGET_USD;
      const origFreeLimit = process.env.AI_DAILY_LIMIT_FREE;
      const origProLimit = process.env.AI_DAILY_LIMIT_PRO;
      const origFetch = global.fetch;

      try {
        process.env.OPENAI_API_KEY = 'sk-test-ai-governance';
        process.env.AI_DAILY_BUDGET_USD = '0.005'; // $0.005 daily budget for test
        process.env.AI_DAILY_LIMIT_FREE = '2';     // 2 requests/day for Free user in test
        process.env.AI_DAILY_LIMIT_PRO = '10';     // 10 requests/day for Pro user in test

        assert.equal(getPlanDailyAiLimit('free'), 2);
        assert.equal(getPlanDailyAiLimit('pro'), 10);

        const freeUser = await DataStore.createUserAccount({
          name: 'Free Daily Quota User',
          email: `free_daily_${Date.now()}@test.com`,
          password: 'password123',
          plan: 'free',
          aiCredits: 5,
        });

        let llmCalls = 0;
        global.fetch = (async () => {
          llmCalls++;
          return new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      personalInfo: {
                        fullName: 'Free Daily Quota User',
                        jobTitle: 'Full Stack Developer',
                        summary: 'Experienced Full Stack Developer skilled in React and Node.js.',
                      },
                      experience: [],
                      education: [],
                      skills: ['React', 'Node.js', 'TypeScript'],
                    }),
                  },
                },
              ],
              usage: {
                prompt_tokens: 1000,
                completion_tokens: 1000,
                total_tokens: 2000,
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }) as typeof fetch;

        // Call 1 & Call 2 for Free User -> LLM hit, recorded in AiUsage with tokens & estimated cost
        const hit1 = await AIResumeClient.generateResume(
          { targetJobTitle: 'Full Stack Developer', jobDescription: 'React, Node.js, TypeScript' },
          { userId: freeUser.id, endpoint: '/api/resume/generate' }
        );
        assert.equal(hit1.aiGenerated, true);
        assert.equal(hit1.tokens, 2000);
        assert.ok((hit1.costUsd ?? 0) > 0, 'LLM hit must record positive estimated costUsd');

        const hit2 = await AIResumeClient.generateResume(
          { targetJobTitle: 'Full Stack Developer', jobDescription: 'React, Node.js, TypeScript' },
          { userId: freeUser.id, endpoint: '/api/resume/generate' }
        );
        assert.equal(hit2.aiGenerated, true);
        assert.equal(llmCalls, 2);

        // Call 3 for Free User -> exceeds user's daily limit (2) -> switches to fallback + sends alert!
        const fallbackUserLimit = await AIResumeClient.generateResume(
          { targetJobTitle: 'Full Stack Developer', jobDescription: 'React, Node.js, TypeScript' },
          { userId: freeUser.id, endpoint: '/api/resume/generate' }
        );
        assert.equal(fallbackUserLimit.aiGenerated, false);
        assert.equal(fallbackUserLimit.fallbackReason, 'user_daily_limit_exceeded');
        assert.equal(llmCalls, 2, 'Must not call LLM when user daily limit is exceeded');

        const alertsAfterUserLimit = getRecentAiAlerts();
        assert.ok(
          alertsAfterUserLimit.some(
            (a) => a.type === 'user_daily_limit_exceeded' && a.userId === freeUser.id && a.sentryCaptured
          ),
          'Must dispatch Sentry + Resend alert when user daily limit is exceeded'
        );

        // Now test Global Project Daily Budget (AI_DAILY_BUDGET_USD):
        // Set AI_DAILY_BUDGET_USD below current daily spend -> switches to fallback + dispatches daily_budget_exceeded alert
        process.env.AI_DAILY_BUDGET_USD = '0.0001';
        const proUser = await DataStore.createUserAccount({
          name: 'Pro Daily Budget User',
          email: `pro_budget_${Date.now()}@test.com`,
          password: 'password123',
          plan: 'pro',
          aiCredits: 999,
        });

        const fallbackBudget = await AIResumeClient.generateResume(
          { targetJobTitle: 'Principal Engineer', jobDescription: 'Distributed Systems, Go, Kubernetes' },
          { userId: proUser.id, endpoint: '/api/resume/generate' }
        );
        assert.equal(fallbackBudget.aiGenerated, false);
        assert.equal(fallbackBudget.fallbackReason, 'daily_budget_exceeded');
        assert.equal(llmCalls, 2, 'Must not call LLM when global daily budget is exceeded');

        const alertsAfterBudget = getRecentAiAlerts();
        assert.ok(
          alertsAfterBudget.some((a) => a.type === 'daily_budget_exceeded' && a.sentryCaptured),
          'Must dispatch Sentry + Resend alert when AI_DAILY_BUDGET_USD is exceeded'
        );

        // Verify Admin AI Usage API endpoint (/api/admin/ai-usage) returns today/week per-endpoint costs
        const adminUser = await DataStore.createUserAccount({
          name: 'AI Cost Admin',
          email: `admin_ai_${Date.now()}@test.com`,
          password: 'password123',
          role: 'admin',
        });
        const adminToken = signToken({
          userId: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: 'admin',
        });

        const adminRes = await adminAiUsageGET(
          new NextRequest('http://localhost:3000/api/admin/ai-usage', {
            method: 'GET',
            headers: { Authorization: `Bearer ${adminToken}` },
          })
        );
        assert.equal(adminRes.status, 200);
        const adminBody = await adminRes.json();
        assert.equal(adminBody.success, true);
        assert.equal(adminBody.today.requests, 4);
        assert.equal(adminBody.today.hits, 2);
        assert.equal(adminBody.today.fallbacks, 2);
        assert.ok(adminBody.today.costUsd > 0);
        assert.ok(Array.isArray(adminBody.endpoints));

        const resumeEndpointRow = adminBody.endpoints.find(
          (e: any) => e.endpoint === '/api/resume/generate'
        );
        assert.ok(resumeEndpointRow, 'Admin AI usage breakdown must include /api/resume/generate');
        assert.equal(resumeEndpointRow.todayRequests, 4);
        assert.equal(resumeEndpointRow.todayHits, 2);
        assert.equal(resumeEndpointRow.todayFallbacks, 2);
        assert.ok(resumeEndpointRow.todayCostUsd > 0);
        assert.ok(resumeEndpointRow.weekCostUsd >= resumeEndpointRow.todayCostUsd);
      } finally {
        global.fetch = origFetch;
        resetCircuitBreaker();
        clearAiAlertsForTesting();
        if (origKey !== undefined) process.env.OPENAI_API_KEY = origKey;
        else delete process.env.OPENAI_API_KEY;
        if (origBudget !== undefined) process.env.AI_DAILY_BUDGET_USD = origBudget;
        else delete process.env.AI_DAILY_BUDGET_USD;
        if (origFreeLimit !== undefined) process.env.AI_DAILY_LIMIT_FREE = origFreeLimit;
        else delete process.env.AI_DAILY_LIMIT_FREE;
        if (origProLimit !== undefined) process.env.AI_DAILY_LIMIT_PRO = origProLimit;
        else delete process.env.AI_DAILY_LIMIT_PRO;
      }
    });
  });

  // =========================================================================
  // 14. Legal Terms Acceptance Tracking, Contact API & Cookie Consent Gating
  // =========================================================================
  describe('14. Legal Terms Acceptance Tracking, Contact API & Cookie Consent Gating', () => {
    it('rejects registration when termsAccepted is false, records termsAcceptedAt & termsVersion on user, validates /api/contact, and blocks PostHog before consent', async () => {
      clearAllRateLimits();

      // 1. Rejects registration if termsAccepted === false
      const rejectedRegRes = await registerPOST(
        new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.88' },
          body: JSON.stringify({
            name: 'No Terms User',
            email: `noterms_${Date.now()}@test.com`,
            password: 'password123',
            termsAccepted: false,
          }),
        })
      );
      assert.equal(rejectedRegRes.status, 400);
      const rejectedBody = await rejectedRegRes.json();
      assert.equal(rejectedBody.code, 'TERMS_NOT_ACCEPTED');

      // 2. Records termsAcceptedAt & termsVersion when termsAccepted === true
      const termsEmail = `terms_ok_${Date.now()}@test.com`;
      const acceptedRegRes = await registerPOST(
        new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.89' },
          body: JSON.stringify({
            name: 'Terms Accepted User',
            email: termsEmail,
            password: 'password123',
            termsAccepted: true,
            termsVersion: '2026-10-31',
          }),
        })
      );
      assert.equal(acceptedRegRes.status, 201);
      const acceptedBody = await acceptedRegRes.json();
      assert.equal(acceptedBody.user.termsVersion, '2026-10-31');
      assert.ok(acceptedBody.user.termsAcceptedAt, 'termsAcceptedAt must be returned');

      const storedUser = await DataStore.findUserById(acceptedBody.user.id);
      assert.ok(storedUser);
      assert.equal(storedUser.termsVersion, '2026-10-31');
      assert.ok(storedUser.termsAcceptedAt, 'Stored user must persist termsAcceptedAt');

      const exportedData = await DataStore.exportUserData(acceptedBody.user.id);
      assert.equal(exportedData?.profile.termsVersion, '2026-10-31');
      assert.ok(exportedData?.profile.termsAcceptedAt);

      // 3. Contact API (/api/contact) validates input and generates ticket ID
      const invalidContactRes = await contactPOST(
        new NextRequest('http://localhost:3000/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.90' },
          body: JSON.stringify({
            name: 'A',
            email: 'invalid-email',
            message: 'short',
          }),
        })
      );
      assert.equal(invalidContactRes.status, 400);

      const validContactRes = await contactPOST(
        new NextRequest('http://localhost:3000/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.90' },
          body: JSON.stringify({
            name: 'Sarah Support',
            email: 'sarah.support@test.com',
            topic: 'refund',
            orderReference: 'ORD-2026-TEST',
            message: 'Hello, I would like to inquire about my 14-day refund eligibility.',
          }),
        })
      );
      assert.equal(validContactRes.status, 200);
      const validContactBody = await validContactRes.json();
      assert.equal(validContactBody.success, true);
      assert.ok(validContactBody.ticketId.startsWith('TKT-'));

      // 4. Analytics / PostHog strictly blocked before explicit consent
      clearAnalyticsLog();
      assert.equal(getConsentStatus(), 'pending');
      assert.equal(hasConsent(), false);
      assert.equal(initPostHog(), false, 'PostHog must never initialize before explicit consent');
      const sent = trackEvent('pricing_viewed', { selectedPlan: 'pro', email: 'secret@pii.com' });
      assert.equal(sent, false, 'trackEvent must return false and not send to PostHog before consent');
      const log = getAnalyticsLog();
      assert.equal(log.length, 1);
      assert.equal(log[0].consented, false);
      assert.equal(log[0].properties.email, undefined, 'PII email must be stripped from analytics');
    });
  });

  // =========================================================================
  // 15. Resend Verified Domain Sender, 6-Language Templates & Sentry Retry Queue
  // =========================================================================
  describe('15. Resend Verified Domain Sender, 6-Language Unified Templates & Retry Queue', () => {
    it('enforces project domain sender (rejects Gmail/Yahoo), renders all templates in 6 languages with RTL for Arabic, and logs failures to Sentry + retries without breaking caller', async () => {
      clearEmailRetryQueueForTests();
      const origEmailFrom = process.env.EMAIL_FROM;
      const origResendKey = process.env.RESEND_API_KEY;

      try {
        // 1. Sender domain enforcement: blocks @gmail.com / @yahoo.com / @outlook.com and enforces project domain
        process.env.EMAIL_FROM = 'JobMatch AI <myaccount@gmail.com>';
        const blockedGmailSender = resolveVerifiedSenderAddress();
        assert.equal(
          blockedGmailSender,
          'JobMatch AI <noreply@jobmatch.ai>',
          'Must reject @gmail.com sender and fall back to verified project domain'
        );
        assert.equal(
          resolveVerifiedSenderAddress('test@yahoo.com'),
          'JobMatch AI <noreply@jobmatch.ai>',
          'Must reject explicit @yahoo.com sender'
        );
        assert.equal(
          resolveVerifiedSenderAddress('JobMatch Support <support@jobmatch.ai>'),
          'JobMatch Support <support@jobmatch.ai>',
          'Must allow verified project domain sender'
        );

        // 2. Unified templates across all 6 languages (en, ar, fr, de, es, tr)
        const languages = ['en', 'ar', 'fr', 'de', 'es', 'tr'] as const;
        for (const lang of languages) {
          const expectedDir = lang === 'ar' ? 'dir="rtl"' : 'dir="ltr"';

          const welcomeHtml = getWelcomeEmailHtml({
            name: 'Alex',
            language: lang,
          });
          assert.ok(welcomeHtml.includes(expectedDir), `Welcome template (${lang}) must include ${expectedDir}`);
          assert.ok(welcomeHtml.includes('/dashboard'));

          const verifyHtml = getEmailVerificationHtml({
            name: 'Alex',
            verifyToken: 'tok_verify_xyz',
            language: lang,
          });
          assert.ok(verifyHtml.includes(expectedDir), `Verify template (${lang}) must include ${expectedDir}`);
          assert.ok(verifyHtml.includes('tok_verify_xyz'));

          const resetHtml = getPasswordResetEmailHtml({
            name: 'Alex',
            resetToken: 'tok_reset_rst',
            language: lang,
          });
          assert.ok(resetHtml.includes(expectedDir), `Password reset template (${lang}) must include ${expectedDir}`);
          assert.ok(resetHtml.includes('tok_reset_rst'));

          const receiptHtml = getPaymentReceiptEmailHtml({
            name: 'Alex',
            amount: 9,
            currency: 'USD',
            planId: 'pro',
            transactionId: 'TX-900',
            language: lang,
          });
          assert.ok(receiptHtml.includes(expectedDir), `Receipt template (${lang}) must include ${expectedDir}`);
          assert.ok(receiptHtml.includes('TX-900'));

          const renewedHtml = getSubscriptionRenewedEmailHtml({
            name: 'Alex',
            amount: 9,
            currency: 'USD',
            renewsOrEndsAt: '2026-12-01',
            language: lang,
          });
          assert.ok(renewedHtml.includes(expectedDir), `Subscription renewed (${lang}) must include ${expectedDir}`);

          const cancelledHtml = getSubscriptionCancelledEmailHtml({
            name: 'Alex',
            renewsOrEndsAt: '2026-12-01',
            language: lang,
          });
          assert.ok(cancelledHtml.includes(expectedDir), `Subscription cancelled (${lang}) must include ${expectedDir}`);

          const failedHtml = getSubscriptionFailedEmailHtml({
            name: 'Alex',
            language: lang,
          });
          assert.ok(failedHtml.includes(expectedDir), `Subscription failed (${lang}) must include ${expectedDir}`);

          const deletedHtml = getAccountDeletedEmailHtml({
            name: 'Alex',
            language: lang,
          });
          assert.ok(deletedHtml.includes(expectedDir), `Account deleted (${lang}) must include ${expectedDir}`);

          const deleteConfirmHtml = getAccountDeleteConfirmEmailHtml({
            name: 'Alex',
            confirmToken: '482910',
            language: lang,
          });
          assert.ok(deleteConfirmHtml.includes(expectedDir));
          assert.ok(deleteConfirmHtml.includes('482910'));
        }

        // 3. Sentry logging + simple Retry Queue on send failure (never throws or breaks primary operation)
        clearEmailRetryQueueForTests();
        process.env.EMAIL_FROM = 'JobMatch AI <noreply@jobmatch.ai>';
        process.env.RESEND_API_KEY = 're_test_live_simulation';

        let sendCalls = 0;
        setCustomResendSenderForTests(async () => {
          sendCalls++;
          if (sendCalls === 1) {
            return {
              data: null,
              error: { message: 'Resend 503 temporary upstream timeout' },
            };
          }
          return {
            data: { id: 're_msg_recovered_999' },
            error: null,
          };
        });

        const firstSendResult = await sendEmail({
          to: 'customer@example.com',
          subject: 'Test Resilient Email',
          html: '<p>Hello</p>',
        });

        assert.equal(firstSendResult.success, false, 'First attempt should report failure without throwing');
        assert.equal(firstSendResult.queuedForRetry, true, 'Failed email must be enqueued in retry queue');
        assert.equal(getEmailRetryQueue().length, 1, 'Retry queue must hold 1 failed email');
        assert.ok(
          getEmailFailureLogs().some((f) => f.error.includes('Resend 503') && f.sentryCaptured),
          'Email failure must be captured in Sentry failure logs'
        );

        // Flush retry queue -> second attempt succeeds and clears queue
        const flushStats = await flushEmailRetryQueue(true);
        assert.equal(flushStats.processed, 1);
        assert.equal(flushStats.succeeded, 1);
        assert.equal(getEmailRetryQueue().length, 0, 'Retry queue must be empty after successful retry');
      } finally {
        setCustomResendSenderForTests(null);
        clearEmailRetryQueueForTests();
        if (origEmailFrom !== undefined) process.env.EMAIL_FROM = origEmailFrom;
        else delete process.env.EMAIL_FROM;
        if (origResendKey !== undefined) process.env.RESEND_API_KEY = origResendKey;
        else delete process.env.RESEND_API_KEY;
      }
    });
  });

  // =========================================================================
  // 16. CI Workflow, Hugging Face Secret Guard & Playwright Smoke Test Suite
  // =========================================================================
  describe('16. CI Workflow, Hugging Face Secret Guard & Playwright Smoke Test Suite', () => {
    it('verifies .github/workflows/ci.yml, sync-to-huggingface.yml secret protection, and Playwright smoke test coverage', () => {
      const ciPath = path.join(process.cwd(), '.github', 'workflows', 'ci.yml');
      const hfSyncPath = path.join(process.cwd(), '.github', 'workflows', 'sync-to-huggingface.yml');
      const smokeTestPath = path.join(process.cwd(), 'tests', 'smoke.playwright.mjs');
      const gitignorePath = path.join(process.cwd(), '.gitignore');

      assert.equal(fs.existsSync(ciPath), true, '.github/workflows/ci.yml must exist');
      assert.equal(fs.existsSync(hfSyncPath), true, '.github/workflows/sync-to-huggingface.yml must exist');
      assert.equal(fs.existsSync(smokeTestPath), true, 'tests/smoke.playwright.mjs must exist');

      const ciYaml = fs.readFileSync(ciPath, 'utf-8');
      assert.ok(ciYaml.includes('push:') && ciYaml.includes('pull_request:'), 'CI must run on push and pull_request');
      assert.ok(ciYaml.includes('npm ci'), 'CI must run npm ci');
      assert.ok(ciYaml.includes('tsc --noEmit'), 'CI must run tsc --noEmit');
      assert.ok(ciYaml.includes('npm run lint'), 'CI must run npm run lint');
      assert.ok(ciYaml.includes('npm test'), 'CI must run npm test');
      assert.ok(ciYaml.includes('npm run build'), 'CI must run npm run build');
      assert.ok(ciYaml.includes('JWT_SECRET:'), 'CI must include dummy JWT_SECRET');

      const hfYaml = fs.readFileSync(hfSyncPath, 'utf-8');
      assert.ok(
        hfYaml.includes('FORBIDDEN_FILES') && hfYaml.includes('SECRET_MATCHES'),
        'sync-to-huggingface.yml must audit tracked files for .env and secret keys before pushing'
      );
      assert.ok(
        hfYaml.includes('::add-mask::$HF_TOKEN'),
        'sync-to-huggingface.yml must mask HF_TOKEN in logs'
      );
      assert.equal(
        hfYaml.includes('$TARGET_USER:$HF_TOKEN@huggingface.co'),
        false,
        'sync-to-huggingface.yml must not embed raw HF_TOKEN in the remote URL'
      );

      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
      assert.ok(gitignore.includes('.env*') && gitignore.includes('!.env.example'));
      assert.ok(gitignore.includes('.data/db.json'));

      const smokeCode = fs.readFileSync(smokeTestPath, 'utf-8');
      assert.ok(smokeCode.includes('/register') && smokeCode.includes('/login'));
      assert.ok(smokeCode.includes('/review') && smokeCode.includes('setInputFiles'));
      assert.ok(smokeCode.includes('/pricing'));
    });
  });

  // =========================================================================
  // 17. Sentry (Env/Release Tags, Bot Filtering, Operational Alerts), /api/health, Runbooks & Payment Reconciliation
  // =========================================================================
  describe('17. Sentry Tags/Bot Filter/Alerts, /api/health, Runbooks & Payment Reconciliation', () => {
    it('stamps Sentry environment/release tags, drops bot errors, fires operational alerts (webhook/payment/5xx/AI), serves /api/health without secrets, and reconciles orders', async () => {
      clearOperationalAlertsForTesting();
      const origEnv = process.env.SENTRY_ENVIRONMENT;
      const origRel = process.env.SENTRY_RELEASE;
      const orig5xxThreshold = process.env.SENTRY_5XX_ALERT_THRESHOLD;
      const origStripeKey = process.env.STRIPE_SECRET_KEY;

      try {
        // 1. Sentry environment & release tags + PII scrubbing
        process.env.SENTRY_ENVIRONMENT = 'staging';
        process.env.SENTRY_RELEASE = 'jobmatch-ai@2.4.0';
        assert.equal(getSentryEnvironment(), 'staging');
        assert.equal(getSentryRelease(), 'jobmatch-ai@2.4.0');

        const normalEvent: any = {
          message: 'Unexpected error for customer john.doe@example.com',
          request: {
            headers: {
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0',
              authorization: 'Bearer secret_jwt_token_123',
            },
          },
        };
        const scrubbed = scrubPiiEvent(normalEvent);
        assert.ok(scrubbed, 'Normal user browser event must not be dropped');
        assert.equal(scrubbed.environment, 'staging');
        assert.equal(scrubbed.release, 'jobmatch-ai@2.4.0');
        assert.equal(scrubbed.tags?.environment, 'staging');
        assert.equal(scrubbed.tags?.release, 'jobmatch-ai@2.4.0');
        assert.ok(!scrubbed.message?.includes('john.doe@example.com'), 'PII email must be scrubbed');

        // 2. Bot filtering: Googlebot, Bingbot, UptimeRobot, HeadlessChrome must be ignored (return null)
        assert.equal(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true);
        assert.equal(isBotUserAgent('Mozilla/5.0 (compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)'), true);
        assert.equal(isBotUserAgent('Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/125.0.0.0'), true);
        assert.equal(isBotUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'), false);

        const botEvent: any = {
          message: 'Bot crawl error',
          request: {
            headers: {
              'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            },
          },
        };
        assert.equal(scrubPiiEvent(botEvent), null, 'Bot event must be dropped (return null)');

        // 3. Operational Alerts: webhook_failure, payment_failure, ai_failure, and high_5xx_rate
        reportOperationalAlert({
          category: 'webhook_failure',
          title: 'Invalid Webhook Signature',
          message: 'HMAC verification failed for Lemon Squeezy webhook',
        });
        reportOperationalAlert({
          category: 'payment_failure',
          title: 'Subscription Renewal Failed',
          message: 'Invoice payment failed',
        });
        reportOperationalAlert({
          category: 'ai_failure',
          title: 'AI Circuit Breaker Open',
          message: 'Upstream LLM timed out',
        });

        process.env.SENTRY_5XX_ALERT_THRESHOLD = '3';
        recordServer5xxAndAlert({ endpoint: '/api/resume/generate', statusCode: 500, error: 'DB timeout 1' });
        recordServer5xxAndAlert({ endpoint: '/api/resume/generate', statusCode: 502, error: 'DB timeout 2' });
        const spikeAlert = recordServer5xxAndAlert({
          endpoint: '/api/resume/generate',
          statusCode: 503,
          error: 'DB timeout 3',
        });
        assert.ok(spikeAlert, '3rd 5xx error reaching threshold must emit high_5xx_rate alert');
        assert.equal(spikeAlert?.category, 'high_5xx_rate');

        const allAlerts = getOperationalAlertsForTesting();
        assert.ok(allAlerts.some((a) => a.category === 'webhook_failure'));
        assert.ok(allAlerts.some((a) => a.category === 'payment_failure'));
        assert.ok(allAlerts.some((a) => a.category === 'ai_failure'));
        assert.ok(allAlerts.some((a) => a.category === 'high_5xx_rate'));

        // 4. /api/health endpoint (GET & HEAD for UptimeRobot — DB + provider config without exposing secrets)
        const secretSentinel = 'sk_live_SUPER_SECRET_DO_NOT_LEAK_99999';
        process.env.STRIPE_SECRET_KEY = secretSentinel;

        const healthRes = await healthGET();
        assert.equal(healthRes.status, 200);
        assert.equal(healthRes.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate');
        const healthRaw = await healthRes.text();
        assert.equal(
          healthRaw.includes(secretSentinel),
          false,
          '/api/health must NEVER leak secret keys in response payload'
        );
        const healthJson = JSON.parse(healthRaw);
        assert.equal(healthJson.status, 'ok');
        assert.equal(healthJson.environment, 'staging');
        assert.equal(healthJson.release, 'jobmatch-ai@2.4.0');
        assert.equal(healthJson.database.status, 'up');
        assert.equal(typeof healthJson.providers.payments.configured, 'boolean');
        assert.equal(typeof healthJson.providers.ai.configured, 'boolean');
        assert.equal(typeof healthJson.providers.email.verifiedDomainSender, 'boolean');

        const headRes = await healthHEAD();
        assert.equal(headRes.status, 200);

        // 5. Payment Reconciliation Script (scripts/reconcile-payments.ts)
        const reconUser = await DataStore.createUserAccount({
          name: 'Reconcile Customer',
          email: `reconcile_${Date.now()}@test.com`,
          password: 'password123',
          plan: 'free',
          aiCredits: 3,
        });

        // Order A: awaiting_payment locally, but PAID at provider -> should detect PAID_IN_PROVIDER_NOT_LOCAL and repair with fix=true
        const orderUnactivated = await DataStore.createOrder({
          userId: reconUser.id,
          userEmail: reconUser.email,
          planId: 'pro',
          billingCycle: 'monthly',
          baseAmount: 9,
          amount: 9,
          currency: 'USD',
          method: 'lemonsqueezy',
          reference: `ORD_RECON_UNACT_${Date.now()}`,
          expiresAt: new Date(Date.now() + 3600_000),
        });

        // Order B: paid locally, but amount mismatched at provider -> should detect AMOUNT_OR_CURRENCY_MISMATCH
        const orderMismatch = await DataStore.createOrder({
          userId: reconUser.id,
          userEmail: reconUser.email,
          planId: 'payg',
          billingCycle: 'once',
          baseAmount: 5,
          amount: 5,
          currency: 'USD',
          method: 'lemonsqueezy',
          reference: `ORD_RECON_MISMATCH_${Date.now()}`,
          expiresAt: new Date(Date.now() + 3600_000),
        });

        const dryReport = await reconcilePayments({
          localOrders: [orderUnactivated, orderMismatch],
          providerOrders: [
            {
              provider: 'lemonsqueezy',
              providerOrderId: 'ls_ord_101',
              orderId: orderUnactivated.id,
              orderReference: orderUnactivated.reference,
              userId: reconUser.id,
              userEmail: reconUser.email,
              status: 'paid',
              amountCents: 900,
              currency: 'USD',
              customerId: 'cus_recon_1',
              subscriptionId: 'sub_recon_1',
            },
            {
              provider: 'lemonsqueezy',
              providerOrderId: 'ls_ord_102',
              orderId: orderMismatch.id,
              orderReference: orderMismatch.reference,
              userId: reconUser.id,
              userEmail: reconUser.email,
              status: 'paid',
              amountCents: 100, // Mismatch: $1.00 instead of $5.00
              currency: 'USD',
            },
          ],
          fix: false,
        });

        assert.equal(dryReport.discrepancies.length, 2);
        assert.ok(dryReport.discrepancies.some((d) => d.type === 'PAID_IN_PROVIDER_NOT_LOCAL'));
        assert.ok(dryReport.discrepancies.some((d) => d.type === 'AMOUNT_OR_CURRENCY_MISMATCH'));

        // Now run with fix: true -> activates orderUnactivated and upgrades reconUser to 'pro'
        const fixReport = await reconcilePayments({
          localOrders: [orderUnactivated],
          providerOrders: [
            {
              provider: 'lemonsqueezy',
              providerOrderId: 'ls_ord_101',
              orderId: orderUnactivated.id,
              orderReference: orderUnactivated.reference,
              userId: reconUser.id,
              userEmail: reconUser.email,
              status: 'paid',
              amountCents: 900,
              currency: 'USD',
              customerId: 'cus_recon_1',
              subscriptionId: 'sub_recon_1',
            },
          ],
          fix: true,
        });
        assert.equal(fixReport.repairedCount, 1);
        const updatedOrder = await DataStore.findOrderById(orderUnactivated.id);
        assert.equal(updatedOrder?.status, 'paid', 'reconcilePayments(--fix) must mark order as paid');
        const updatedUser = await DataStore.findUserById(reconUser.id);
        assert.equal(updatedUser?.plan, 'pro', 'reconcilePayments(--fix) must upgrade user plan to pro');

        // 6. Verify docs/RUNBOOK.md and docs/BACKUP.md exist and cover required operational sections
        const runbookPath = path.join(process.cwd(), 'docs', 'RUNBOOK.md');
        const backupPath = path.join(process.cwd(), 'docs', 'BACKUP.md');
        assert.equal(fs.existsSync(runbookPath), true, 'docs/RUNBOOK.md must exist');
        assert.equal(fs.existsSync(backupPath), true, 'docs/BACKUP.md must exist');
        const runbookText = fs.readFileSync(runbookPath, 'utf-8');
        const backupText = fs.readFileSync(backupPath, 'utf-8');
        assert.ok(runbookText.includes('UptimeRobot') && runbookText.includes('admin-review-order.ts'));
        assert.ok(runbookText.includes('reconcile-payments.ts') && runbookText.includes('Rotate'));
        assert.ok(backupText.includes('MongoDB Atlas') && backupText.includes('mongorestore'));
      } finally {
        clearOperationalAlertsForTesting();
        if (origEnv !== undefined) process.env.SENTRY_ENVIRONMENT = origEnv;
        else delete process.env.SENTRY_ENVIRONMENT;
        if (origRel !== undefined) process.env.SENTRY_RELEASE = origRel;
        else delete process.env.SENTRY_RELEASE;
        if (orig5xxThreshold !== undefined) process.env.SENTRY_5XX_ALERT_THRESHOLD = orig5xxThreshold;
        else delete process.env.SENTRY_5XX_ALERT_THRESHOLD;
        if (origStripeKey !== undefined) process.env.STRIPE_SECRET_KEY = origStripeKey;
        else delete process.env.STRIPE_SECRET_KEY;
      }
    });
  });

  // =========================================================================
  // 18. PostHog 12-Event Conversion Funnel (Cookie Consent, Webhook Revenue, Funnel Dashboard)
  // =========================================================================
  describe('18. PostHog 12-Event Conversion Funnel & Webhook Revenue Verification', () => {
    it('gates client events behind cookie consent, tracks all 12 funnel events, enforces webhook-verified payment_succeeded, and documents funnel in docs/ANALYTICS.md', async () => {
      const {
        CANONICAL_FUNNEL_EVENTS,
        POSTHOG_FUNNEL_DASHBOARD_CONFIG,
        setConsentStatus,
        hasConsent,
        clearAnalyticsLog,
        getAnalyticsLog,
        trackLandingView,
        trackSignupStarted,
        trackSignupCompleted,
        trackEmailVerified,
        trackResumeUploaded,
        trackAtsScored,
        trackJobSearchRun,
        trackFreeQuotaExhausted,
        trackPricingViewed,
        trackCheckoutStarted,
        trackPaymentSucceeded,
        trackServerPaymentSucceeded,
        trackSubscriptionCancelled,
        trackServerSubscriptionCancelled,
        computeFunnelSummary,
      } = await import('../lib/analytics');
      const { POST: analyticsEventPOST } = await import('../app/api/analytics/event/route');
      const fs = await import('fs');
      const path = await import('path');

      // Setup mocked window & localStorage for consent tests
      const prevWindow = (global as any).window;
      const prevLocalStorage = (global as any).localStorage;
      const store: Record<string, string> = {};
      (global as any).localStorage = {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => {
          store[k] = String(v);
        },
        removeItem: (k: string) => {
          delete store[k];
        },
      };
      (global as any).window = {
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      };

      try {
        // 1. Verify all 12 canonical event names are registered
        const expectedEvents = [
          'landing_view',
          'signup_started',
          'signup_completed',
          'email_verified',
          'resume_uploaded',
          'ats_scored',
          'job_search_run',
          'free_quota_exhausted',
          'pricing_viewed',
          'checkout_started',
          'payment_succeeded',
          'subscription_cancelled',
        ];
        assert.deepEqual([...CANONICAL_FUNNEL_EVENTS], expectedEvents);

        // 2. Before cookie consent ('denied'), client tracking returns false and consented=false
        clearAnalyticsLog();
        setConsentStatus('denied');
        assert.equal(hasConsent(), false);
        assert.equal(trackLandingView({ locale: 'en', path: '/' }), false);
        assert.equal(trackSignupStarted({ source: 'register_page' }), false);
        const deniedLogs = getAnalyticsLog();
        assert.equal(deniedLogs.length, 2);
        assert.equal(deniedLogs.every((e) => e.consented === false), true);

        // 3. After cookie consent ('granted'), all 12 funnel events are recorded with expected properties
        clearAnalyticsLog();
        setConsentStatus('granted');
        assert.equal(hasConsent(), true);

        assert.equal(trackLandingView({ locale: 'ar', path: '/' }), true);
        assert.equal(trackSignupStarted({ source: 'register_page', method: 'email' }), true);
        assert.equal(trackSignupCompleted('free'), true);
        assert.equal(trackEmailVerified({ method: 'token' }), true);
        assert.equal(trackResumeUploaded({ fileType: 'pdf', source: 'review' }), true);
        assert.equal(trackAtsScored(87.4, 'Strong Match'), true);
        assert.equal(
          trackJobSearchRun({
            country: 'eg',
            remoteOnly: true,
            seniority: 'senior',
            resultsCount: 12,
            cached: false,
          }),
          true
        );
        assert.equal(
          trackFreeQuotaExhausted({ feature: 'job_search', reason: 'job_match_quota_reached' }),
          true
        );
        assert.equal(trackPricingViewed('pro'), true);
        assert.equal(trackCheckoutStarted('pro', 'lemonsqueezy', 'USD'), true);

        // Server webhook events: payment_succeeded & subscription_cancelled
        const webhookPaid = trackServerPaymentSucceeded({
          userId: 'usr_funnel_1',
          plan: 'pro',
          provider: 'lemonsqueezy',
          amount: 9,
          currency: 'USD',
          billingCycle: 'monthly',
          orderReference: 'ORD_FUNNEL_1',
        });
        assert.equal(webhookPaid.event, 'payment_succeeded');
        assert.equal(webhookPaid.properties.amount, 9);
        assert.equal(webhookPaid.properties.plan, 'pro');
        assert.equal(webhookPaid.properties.provider, 'lemonsqueezy');
        assert.equal(webhookPaid.properties.webhookVerified, true);

        const webhookCancel = trackServerSubscriptionCancelled({
          userId: 'usr_funnel_1',
          plan: 'pro',
          provider: 'lemonsqueezy',
          reason: 'subscription_cancelled',
        });
        assert.equal(webhookCancel.event, 'subscription_cancelled');
        assert.equal(webhookCancel.properties.provider, 'lemonsqueezy');

        const logs = getAnalyticsLog();
        const recordedEvents = logs.map((l) => l.event);
        for (const ev of expectedEvents) {
          assert.ok(recordedEvents.includes(ev), `Expected funnel log to contain ${ev}`);
        }

        // Verify ats_scored has rounded score and checkout_started has plan & provider
        const atsEntry = logs.find((l) => l.event === 'ats_scored');
        assert.equal(atsEntry?.properties.score, 87);
        const checkoutEntry = logs.find((l) => l.event === 'checkout_started');
        assert.equal(checkoutEntry?.properties.plan, 'pro');
        assert.equal(checkoutEntry?.properties.provider, 'lemonsqueezy');

        // 4. Verify POST /api/analytics/event rejects unverified payment_succeeded (e.g. spoofed from URL)
        const spoofedPayReq = new NextRequest('http://localhost:3000/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.88' },
          body: JSON.stringify({
            event: 'payment_succeeded',
            properties: { plan: 'pro', amount: 999, source: 'url_query_param' },
          }),
        });
        const spoofedPayRes = await analyticsEventPOST(spoofedPayReq);
        assert.equal(
          spoofedPayRes.status,
          400,
          'POST /api/analytics/event must reject unverified payment_succeeded events'
        );

        // Verify trackPaymentSucceeded rejects invalid/negative amounts
        assert.equal(trackPaymentSucceeded('pro', NaN, 'USD', 'lemonsqueezy'), false);
        assert.equal(trackPaymentSucceeded('pro', -5, 'USD', 'lemonsqueezy'), false);

        // 5. Verify computeFunnelSummary & POSTHOG_FUNNEL_DASHBOARD_CONFIG
        const summary = computeFunnelSummary();
        assert.equal(summary.steps.length, 12);
        assert.equal(summary.overallConversionPct, 100);
        assert.equal(summary.churnCount, 1);
        assert.equal(POSTHOG_FUNNEL_DASHBOARD_CONFIG.steps.length, 11);
        assert.ok(POSTHOG_FUNNEL_DASHBOARD_CONFIG.breakdowns.includes('provider'));
        assert.ok(POSTHOG_FUNNEL_DASHBOARD_CONFIG.breakdowns.includes('plan'));

        // 6. Verify docs/ANALYTICS.md exists and documents all 12 events
        const analyticsDocPath = path.join(process.cwd(), 'docs', 'ANALYTICS.md');
        assert.equal(fs.existsSync(analyticsDocPath), true, 'docs/ANALYTICS.md must exist');
        const analyticsDoc = fs.readFileSync(analyticsDocPath, 'utf-8');
        for (const ev of expectedEvents) {
          assert.ok(
            analyticsDoc.includes(ev),
            `docs/ANALYTICS.md must document event "${ev}"`
          );
        }
      } finally {
        clearAnalyticsLog();
        if (prevWindow !== undefined) (global as any).window = prevWindow;
        else delete (global as any).window;
        if (prevLocalStorage !== undefined) (global as any).localStorage = prevLocalStorage;
        else delete (global as any).localStorage;
      }
    });
  });

  // =========================================================================
  // 19. Post-Registration 4-Step Flow, 3 One-Click ATS Fixes & 6-Locale i18n
  // =========================================================================
  describe('19. Post-Registration 4-Step Flow, 3 One-Click ATS Improvements & 6-Locale i18n', () => {
    it('boosts ATS score with each of the 3 one-click improvements and verifies 6-language translations', async () => {
      const { applyOneClickAtsFix } = await import('../app/lib/atsQuickFixes');
      const en = (await import('../app/lib/translations/en')).default;
      const ar = (await import('../app/lib/translations/ar')).default;
      const fr = (await import('../app/lib/translations/fr')).default;
      const de = (await import('../app/lib/translations/de')).default;
      const es = (await import('../app/lib/translations/es')).default;
      const tr = (await import('../app/lib/translations/tr')).default;

      const starterResume = `Alex Rivera
alex.rivera@example.com | +1 555-234-5678 | Austin, TX

Worked on web applications and backend services for customer portals.
EDUCATION
B.S. in Computer Science, University of Texas (2019 - 2023)`;

      // Fix 1: Inject missing role keywords
      const fix1 = applyOneClickAtsFix(starterResume, 'keywords', {
        targetRole: 'Full Stack Developer',
        missingKeywords: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker'],
      });
      assert.ok(fix1.appliedFixes.includes('keywords'), 'Fix 1 should apply keywords');
      assert.ok(fix1.newScore >= fix1.previousScore, 'Fix 1 should maintain or increase ATS score');
      assert.ok(fix1.updatedText.includes('TypeScript'), 'Fix 1 should inject missing keywords');

      // Fix 2: Align target role headline & summary
      const fix2 = applyOneClickAtsFix(fix1.updatedText, 'summary', {
        targetRole: 'Full Stack Developer',
      });
      assert.ok(fix2.appliedFixes.includes('summary'), 'Fix 2 should apply summary');
      assert.ok(
        fix2.updatedText.includes('PROFESSIONAL SUMMARY') &&
          fix2.updatedText.includes('Full Stack Developer'),
        'Fix 2 should inject target role and summary header'
      );

      // Fix 3: Add quantified metrics & strong action verbs
      const fix3 = applyOneClickAtsFix(fix2.updatedText, 'metrics', {
        targetRole: 'Full Stack Developer',
      });
      assert.ok(fix3.appliedFixes.includes('metrics'), 'Fix 3 should apply metrics');
      assert.ok(fix3.updatedText.includes('38%'), 'Fix 3 should inject quantified percentages');
      assert.ok(
        fix3.newScore > fix1.previousScore,
        `Cumulative 3 fixes should boost score (${fix1.previousScore} -> ${fix3.newScore})`
      );

      // Apply all 3 at once on Arabic resume
      const starterArabicResume = `أحمد محمود
ahmed@example.com | +20 100 123 4567 | القاهرة، مصر
عملت في تطوير تطبيقات الويب والخدمات السحابية.
التعليم
بكالوريوس علوم الحاسب - جامعة القاهرة`;

      const arAll = applyOneClickAtsFix(starterArabicResume, 'all', {
        targetRole: 'مهندس برمجيات',
        isAr: true,
      });
      assert.equal(arAll.appliedFixes.length, 3, 'All 3 quick fixes should apply for Arabic resume');
      assert.ok(arAll.newScore > arAll.previousScore, 'Arabic resume score should increase');

      // Verify all 6 locales contain the required checklist, quick fixes, first-quota, and empty-state keys
      const requiredKeys = [
        'checklist_title',
        'checklist_step1_title',
        'checklist_step1_upload_btn',
        'checklist_step1_scratch_btn',
        'checklist_step2_title',
        'checklist_step3_title',
        'checklist_step4_title',
        'checklist_first_quota_badge',
        'review_quick_fixes_title',
        'review_quick_fix1_title',
        'review_quick_fix2_title',
        'review_quick_fix3_title',
        'review_quick_fix_apply_btn',
        'review_quick_fix_apply_all_btn',
        'review_quick_fix_next_jobs_btn',
        'jobs_first_quota_title',
        'jobs_first_quota_desc',
        'jobs_first_quota_cta',
        'dashboard_upload_cv_direct',
        'dashboard_empty_resumes_hint',
        'dashboard_empty_scans_sample_btn',
        'dashboard_empty_letters_jobs_btn',
      ] as const;

      const locales = { en, ar, fr, de, es, tr };
      for (const [localeCode, dict] of Object.entries(locales)) {
        for (const key of requiredKeys) {
          assert.ok(
            typeof (dict as any)[key] === 'string' && (dict as any)[key].trim().length > 0,
            `Locale "${localeCode}" must define non-empty translation key "${key}"`
          );
        }
      }
    });
  });

  // =========================================================================
  // 20. Pricing Page: Real Limits Table, Local Currency Display, Trust Badges, FAQ & Checkout Errors
  // =========================================================================
  describe('20. Pricing Page: Real Limits Table, Local Currency Display, Trust Badges, FAQ & Checkout Errors', () => {
    it('sources Free/PAYG/Pro limits dynamically from plans.ts, formats local display currency with provider billing notice, and handles 403/429 checkout errors', async () => {
      const {
        getPlanComparisonRows,
        detectUserDisplayCurrency,
        formatDisplayPrice,
        getPlanCredits,
        getPaygCredits,
        getPlanDailyAiLimit,
        RESUME_GENERATION_CREDIT_COST,
        JOB_MATCH_FREE_QUOTA,
        JOB_MATCH_CREDIT_COST,
      } = await import('../lib/plans');
      const { startCheckout } = await import('../lib/checkout-client');
      const en = (await import('../app/lib/translations/en')).default;
      const ar = (await import('../app/lib/translations/ar')).default;
      const fr = (await import('../app/lib/translations/fr')).default;
      const de = (await import('../app/lib/translations/de')).default;
      const es = (await import('../app/lib/translations/es')).default;
      const tr = (await import('../app/lib/translations/tr')).default;

      // 1. Verify Free / PAYG / Pro comparison rows dynamically reflect constants in lib/plans.ts
      const rowsEn = getPlanComparisonRows('en');
      const rowsAr = getPlanComparisonRows('ar');
      assert.equal(rowsEn.length, 7);
      assert.equal(rowsAr.length, 7);

      const creditsRow = rowsEn.find((r) => r.id === 'credits');
      assert.ok(creditsRow?.free.includes(String(getPlanCredits('free'))));
      assert.ok(creditsRow?.payg.includes(String(getPaygCredits())));

      const dailyRow = rowsEn.find((r) => r.id === 'daily_ai_limit');
      assert.ok(dailyRow?.free.includes(String(getPlanDailyAiLimit('free'))));
      assert.ok(dailyRow?.payg.includes(String(getPlanDailyAiLimit('payg'))));
      assert.ok(dailyRow?.pro.includes(String(getPlanDailyAiLimit('pro'))));

      const resumeRow = rowsEn.find((r) => r.id === 'ai_resume');
      assert.ok(resumeRow?.payg.includes(String(RESUME_GENERATION_CREDIT_COST)));

      const jobRow = rowsEn.find((r) => r.id === 'job_match');
      assert.ok(jobRow?.free.includes(String(JOB_MATCH_FREE_QUOTA)));
      assert.ok(jobRow?.payg.includes(String(JOB_MATCH_CREDIT_COST)));

      // 2. Verify local currency detection & display-only conversion vs provider billing currency
      assert.equal(detectUserDisplayCurrency('ar', 'Africa/Cairo'), 'EGP');
      assert.equal(detectUserDisplayCurrency('ar', 'Asia/Riyadh'), 'SAR');
      assert.equal(detectUserDisplayCurrency('ar', 'Asia/Dubai'), 'AED');
      assert.equal(detectUserDisplayCurrency('tr', 'Europe/Istanbul'), 'TRY');
      assert.equal(detectUserDisplayCurrency('de', 'Europe/Berlin'), 'EUR');
      assert.equal(detectUserDisplayCurrency('en', 'Europe/London'), 'GBP');

      const sarFormatted = formatDisplayPrice(9, 350, 'SAR', 'USD', 'ar');
      assert.equal(sarFormatted.isDisplayOnlyConversion, true);
      assert.equal(sarFormatted.providerBillingCurrency, 'USD');
      assert.equal(sarFormatted.providerBillingAmount, 9);
      assert.ok(sarFormatted.formattedDisplay.includes('ر.س'));

      const usdSame = formatDisplayPrice(9, 350, 'USD', 'USD', 'en');
      assert.equal(usdSame.isDisplayOnlyConversion, false);
      assert.equal(usdSame.formattedDisplay, '$9');

      // 3. Verify startCheckout handles EMAIL_NOT_VERIFIED (403) and RATE_LIMITED (429)
      const unverifiedRes = await startCheckout('pro', {
        language: 'ar',
        customFetch: async () =>
          new Response(
            JSON.stringify({ error: 'EMAIL_NOT_VERIFIED', message: 'Verify email first' }),
            { status: 403 }
          ),
      });
      assert.equal(unverifiedRes.success, false);
      assert.equal(unverifiedRes.errorCode, 'EMAIL_NOT_VERIFIED');
      assert.equal(unverifiedRes.canRetry, false);
      assert.ok(unverifiedRes.message?.includes('بريدك الإلكتروني'));

      const rateLimitedRes = await startCheckout('pro', {
        language: 'en',
        customFetch: async () =>
          new Response(
            JSON.stringify({ error: 'RATE_LIMIT_EXCEEDED', message: 'Slow down' }),
            { status: 429 }
          ),
      });
      assert.equal(rateLimitedRes.success, false);
      assert.equal(rateLimitedRes.errorCode, 'RATE_LIMITED');
      assert.equal(rateLimitedRes.canRetry, true);

      // 4. Verify all 6 locales contain the new pricing, FAQ, trust badge & checkout keys
      const pricingKeys = [
        'pricing_display_currency_label',
        'pricing_display_currency_notice',
        'pricing_card_billed_in_provider',
        'pricing_trust_lemonsqueezy_title',
        'pricing_trust_lemonsqueezy_desc',
        'pricing_trust_no_card_storage_title',
        'pricing_trust_no_card_storage_desc',
        'pricing_trust_ssl_title',
        'pricing_trust_ssl_desc',
        'pricing_trust_refund_cancel_title',
        'pricing_trust_refund_cancel_desc',
        'pricing_faq_q_refund',
        'pricing_faq_a_refund',
        'pricing_faq_q_data',
        'pricing_faq_a_data',
        'pricing_faq_q_payment_security',
        'pricing_faq_a_payment_security',
        'pricing_checkout_loading',
        'pricing_err_banner_title',
        'pricing_err_email_not_verified',
        'pricing_err_rate_limited',
        'pricing_verify_email_btn',
      ] as const;

      const locales = { en, ar, fr, de, es, tr };
      for (const [localeCode, dict] of Object.entries(locales)) {
        for (const key of pricingKeys) {
          assert.ok(
            typeof (dict as any)[key] === 'string' && (dict as any)[key].trim().length > 0,
            `Locale "${localeCode}" must define non-empty translation key "${key}"`
          );
        }
      }
    });
  });

  // =========================================================================
  // 14. User Profile, Onboarding Skip, Multilingual Autosuggest & Privacy
  // =========================================================================
  describe('14. User Profile (/api/profile, /api/profile/skip, /api/profile/suggest & Privacy)', () => {
    it('enforces auth, Zod validation (max 30 skills, salary bounds, safe URLs), XSS sanitization, profileCompletion & onboardingCompletedAt', async () => {
      const { GET: profileGET, PUT: profilePUT } = await import('@/app/api/profile/route');
      const { POST: profileSkipPOST } = await import('@/app/api/profile/skip/route');

      // 1. Unauthenticated GET / PUT / SKIP must return 401
      const unauthGetRes = await profileGET(new NextRequest('http://localhost:3000/api/profile'));
      assert.equal(unauthGetRes.status, 401);

      const unauthPutRes = await profilePUT(
        new NextRequest('http://localhost:3000/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', origin: 'http://localhost:3000' },
          body: JSON.stringify({ fullName: 'Test' }),
        })
      );
      assert.equal(unauthPutRes.status, 401);

      const unauthSkipRes = await profileSkipPOST(
        new NextRequest('http://localhost:3000/api/profile/skip', {
          method: 'POST',
          headers: { origin: 'http://localhost:3000' },
        })
      );
      assert.equal(unauthSkipRes.status, 401);

      // 2. Create two users (owner & third-party HR viewer)
      const ownerUser = await DataStore.createUserAccount({
        name: 'Karim Nabil',
        email: `profile_owner_${Date.now()}@test.com`,
        password: 'hashed_password',
        role: 'user',
      });
      const viewerUser = await DataStore.createUserAccount({
        name: 'HR Viewer',
        email: `hr_viewer_${Date.now()}@test.com`,
        password: 'hashed_password',
        role: 'user',
      });

      const ownerToken = signToken({
        userId: ownerUser.id,
        email: ownerUser.email,
        name: ownerUser.name,
      });
      const viewerToken = signToken({
        userId: viewerUser.id,
        email: viewerUser.email,
        name: viewerUser.name,
      });

      // 3. Reject > 30 skills via Zod validation
      const tooManySkills = Array.from({ length: 31 }, (_, i) => `Skill_${i + 1}`);
      const overSkillsRes = await profilePUT(
        new NextRequest('http://localhost:3000/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${ownerToken}`,
          },
          body: JSON.stringify({ skills: tooManySkills }),
        })
      );
      assert.equal(overSkillsRes.status, 400);
      const overSkillsBody = await overSkillsRes.json();
      assert.equal(overSkillsBody.error, 'VALIDATION_ERROR');

      // 4. Reject ownership violation (updating another user's userId)
      const CrossUserRes = await profilePUT(
        new NextRequest('http://localhost:3000/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${ownerToken}`,
          },
          body: JSON.stringify({ userId: viewerUser.id, fullName: 'Hacked' }),
        })
      );
      assert.equal(CrossUserRes.status, 403);

      // 5. Update full profile with HTML/XSS payload to verify sanitization + completion calculation
      const updateRes = await profilePUT(
        new NextRequest('http://localhost:3000/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${ownerToken}`,
          },
          body: JSON.stringify({
            fullName: '  Karim <script>alert(1)</script>Nabil  ',
            targetRole: 'Senior Full Stack Developer <b>React</b>',
            seniority: 'senior',
            yearsOfExperience: 6,
            industries: ['Technology', 'FinTech', 'technology'],
            skills: ['TypeScript', 'React.js', 'Node.js', 'MongoDB'],
            country: 'Egypt',
            city: 'Cairo',
            willingToRelocate: true,
            remotePreference: 'hybrid',
            employmentTypes: ['full-time', 'contract'],
            expectedSalary: {
              min: 2500,
              max: 4000,
              currency: 'usd',
              visible: false,
            },
            languages: ['Arabic', 'English'],
            phone: '+20 100 123 4567 <script>evil()</script>',
            phoneVisible: false,
            links: {
              linkedin: 'linkedin.com/in/karim-nabil',
              github: 'https://github.com/karim-nabil',
              portfolio: 'https://karim.dev',
            },
          }),
        })
      );
      assert.equal(updateRes.status, 200);
      const updateData = await updateRes.json();
      assert.equal(updateData.ok, true);
      const prof = updateData.profile;

      assert.equal(prof.fullName, 'Karim Nabil');
      assert.equal(prof.targetRole, 'Senior Full Stack Developer React');
      assert.equal(prof.headline, 'Senior Full Stack Developer React');
      assert.equal(prof.seniority, 'senior');
      assert.equal(prof.yearsOfExperience, 6);
      assert.deepEqual(prof.industries, ['Technology', 'FinTech']);
      assert.equal(prof.skills.length, 4);
      assert.equal(prof.country, 'Egypt');
      assert.equal(prof.city, 'Cairo');
      assert.equal(prof.willingToRelocate, true);
      assert.equal(prof.remotePreference, 'hybrid');
      assert.deepEqual(prof.employmentTypes, ['full-time', 'contract']);
      assert.equal(prof.expectedSalary.min, 2500);
      assert.equal(prof.expectedSalary.max, 4000);
      assert.equal(prof.expectedSalary.currency, 'USD');
      assert.equal(prof.expectedSalary.visible, false);
      assert.equal(prof.phone, '+20 100 123 4567');
      assert.equal(prof.phoneVisible, false);
      assert.equal(prof.links.linkedin, 'https://linkedin.com/in/karim-nabil');
      assert.equal(prof.profileCompletion, 100);
      assert.ok(prof.onboardingCompletedAt, 'onboardingCompletedAt must be set upon PUT /api/profile');
      assert.equal(prof.isOwner, true);

      // 6. Privacy Enforcement: Third-party viewer (viewerToken) requesting owner's profile
      // Sensitive fields (expectedSalary, phone) MUST be hidden (null) because visible=false / phoneVisible=false
      const thirdPartyRes = await profileGET(
        new NextRequest(`http://localhost:3000/api/profile?userId=${ownerUser.id}`, {
          headers: { Authorization: `Bearer ${viewerToken}` },
        })
      );
      assert.equal(thirdPartyRes.status, 200);
      const thirdPartyBody = await thirdPartyRes.json();
      assert.equal(thirdPartyBody.profile.isOwner, false);
      assert.equal(
        thirdPartyBody.profile.expectedSalary,
        null,
        'expectedSalary must be null for non-owner when visible is false'
      );
      assert.equal(
        thirdPartyBody.profile.phone,
        null,
        'phone must be null for non-owner when phoneVisible is false'
      );
      assert.equal(thirdPartyBody.profile.fullName, 'Karim Nabil');

      // 7. Explicit Consent: Owner enables expectedSalary.visible = true and phoneVisible = true
      await profilePUT(
        new NextRequest('http://localhost:3000/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${ownerToken}`,
          },
          body: JSON.stringify({
            expectedSalary: { min: 2500, max: 4000, currency: 'USD', visible: true },
            phoneVisible: true,
          }),
        })
      );

      const consentedViewRes = await profileGET(
        new NextRequest(`http://localhost:3000/api/profile?userId=${ownerUser.id}`, {
          headers: { Authorization: `Bearer ${viewerToken}` },
        })
      );
      const consentedViewBody = await consentedViewRes.json();
      assert.equal(consentedViewBody.profile.isOwner, false);
      assert.equal(consentedViewBody.profile.expectedSalary?.min, 2500);
      assert.equal(consentedViewBody.profile.expectedSalary?.max, 4000);
      assert.equal(consentedViewBody.profile.phone, '+20 100 123 4567');

      // 8. Onboarding Skip endpoint (/api/profile/skip)
      const skipRes = await profileSkipPOST(
        new NextRequest('http://localhost:3000/api/profile/skip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${viewerToken}`,
          },
          body: JSON.stringify({ reason: 'later' }),
        })
      );
      assert.equal(skipRes.status, 200);
      const skipBody = await skipRes.json();
      assert.equal(skipBody.ok, true);
      assert.equal(skipBody.skipped, true);
      assert.ok(skipBody.profile.onboardingCompletedAt);
      assert.ok(skipBody.profile.onboardingSkippedAt);
    });

    it('provides static multilingual role and skill autosuggest (/api/profile/suggest) with validation & rate limit', async () => {
      const { GET: suggestGET } = await import('@/app/api/profile/suggest/route');

      // 1. Invalid type returns 400
      const badTypeRes = await suggestGET(
        new NextRequest('http://localhost:3000/api/profile/suggest?type=invalid&q=react')
      );
      assert.equal(badTypeRes.status, 400);

      // 2. Role search in English
      const roleEnRes = await suggestGET(
        new NextRequest('http://localhost:3000/api/profile/suggest?type=role&q=frontend&lang=en')
      );
      assert.equal(roleEnRes.status, 200);
      const roleEnBody = await roleEnRes.json();
      assert.equal(roleEnBody.ok, true);
      assert.ok(roleEnBody.suggestions.length >= 1);
      assert.ok(roleEnBody.items.some((item: string) => item.toLowerCase().includes('frontend')));

      // 3. Role search in Arabic
      const roleArRes = await suggestGET(
        new NextRequest(
          `http://localhost:3000/api/profile/suggest?type=role&q=${encodeURIComponent('محاسب')}&lang=ar`
        )
      );
      assert.equal(roleArRes.status, 200);
      const roleArBody = await roleArRes.json();
      assert.equal(roleArBody.ok, true);
      assert.equal(roleArBody.locale, 'ar');
      assert.ok(roleArBody.items.some((item: string) => item.includes('محاسب')));

      // 4. Skill search
      const skillRes = await suggestGET(
        new NextRequest('http://localhost:3000/api/profile/suggest?type=skill&q=type&lang=en')
      );
      assert.equal(skillRes.status, 200);
      const skillBody = await skillRes.json();
      assert.equal(skillBody.ok, true);
      assert.ok(skillBody.items.includes('TypeScript'));
      assert.ok(skillRes.headers.get('X-RateLimit-Limit'));
    });

    it('supports 4-step onboarding draft saves (completeOnboarding: false -> true), CV profile extraction, and 6-locale onboarding/settings i18n keys', async () => {
      const { PUT: profilePUT } = await import('@/app/api/profile/route');
      const { extractProfileFromResume, extractProfileFromText } = await import('@/lib/jobs/extractor');
      const en = (await import('@/app/lib/translations/en')).default;
      const ar = (await import('@/app/lib/translations/ar')).default;
      const fr = (await import('@/app/lib/translations/fr')).default;
      const de = (await import('@/app/lib/translations/de')).default;
      const es = (await import('@/app/lib/translations/es')).default;
      const tr = (await import('@/app/lib/translations/tr')).default;

      // 1. Verify draft save keeps onboardingCompletedAt null until step 4 completion
      const wizardUser = await DataStore.createUserAccount({
        name: 'Nour Hassan',
        email: `wizard_${Date.now()}@test.com`,
        password: 'hashed_password',
        role: 'user',
      });
      const wizardToken = signToken({
        userId: wizardUser.id,
        email: wizardUser.email,
        name: wizardUser.name,
      });

      const step1DraftRes = await profilePUT(
        new NextRequest('http://localhost:3000/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${wizardToken}`,
          },
          body: JSON.stringify({
            fullName: 'Nour Hassan',
            country: 'Egypt',
            city: 'Alexandria',
            completeOnboarding: false,
          }),
        })
      );
      assert.equal(step1DraftRes.status, 200);
      const step1DraftBody = await step1DraftRes.json();
      assert.equal(
        step1DraftBody.profile.onboardingCompletedAt,
        null,
        'Draft step save must keep onboardingCompletedAt null'
      );

      // Final step 4 save marks onboardingCompletedAt
      const step4FinalRes = await profilePUT(
        new NextRequest('http://localhost:3000/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${wizardToken}`,
          },
          body: JSON.stringify({
            targetRole: 'Product Manager',
            seniority: 'mid',
            yearsOfExperience: 4,
            skills: ['Product Strategy', 'Agile', 'SQL'],
            completeOnboarding: true,
          }),
        })
      );
      assert.equal(step4FinalRes.status, 200);
      const step4FinalBody = await step4FinalRes.json();
      assert.ok(
        step4FinalBody.profile.onboardingCompletedAt,
        'Final wizard step must set onboardingCompletedAt'
      );

      // 2. Verify extractProfileFromResume / extractProfileFromText populates onboarding review fields
      const extracted = extractProfileFromText(
        'Nour Hassan\nSenior Frontend Engineer with 5 years of experience in Cairo, Egypt.\nSkills: React, TypeScript, Next.js, Tailwind CSS.\nLanguages: Arabic, English'
      );
      assert.equal(extracted.fullName, 'Nour Hassan');
      assert.ok(extracted.targetRole?.toLowerCase().includes('frontend'));
      assert.equal(extracted.yearsOfExperience, 5);
      assert.equal(extracted.city, 'Cairo');
      assert.equal(extracted.countryName, 'Egypt');
      assert.ok(extracted.topSkills.includes('React'));
      assert.ok(typeof extractProfileFromResume === 'function');

      // 3. Verify all 6 locales have the onboarding & /settings/profile translation keys
      const onboardingKeys = [
        'onboarding_step_of',
        'onboarding_step1_title',
        'onboarding_step2_title',
        'onboarding_step3_title',
        'onboarding_step4_title',
        'onboarding_cv_autofill_title',
        'onboarding_success_title',
        'onboarding_cta_find_jobs',
        'onboarding_cta_build_resume',
        'settings_profile_nav_label',
      ];
      for (const [loc, dict] of Object.entries({ en, ar, fr, de, es, tr })) {
        for (const k of onboardingKeys) {
          assert.ok(
            typeof (dict as any)[k] === 'string' && (dict as any)[k].trim().length > 0,
            `Locale ${loc} must define ${k}`
          );
        }
      }
    });
  });

  // =========================================================================
  // 37. Full Job Search Engine: Fuzzy Dedupe, Filters, Cursor Pagination, Rate Limit, Saved Jobs & Alerts
  // =========================================================================
  describe('37. Full Job Search Engine: fuzzy dedupe, filters, cursor pagination, rate limit, saved jobs & alerts', () => {
    it('deduplicates fuzzy job listings across sources, applies all filters/sorting, paginates with cursor, and enforces rate limits & free vs match quota', async () => {
      const {
        deduplicateJobs,
        filterAndSortJobs,
        paginateJobsWithCursor,
      } = await import('@/lib/jobs/matcher');
      const { generateSmartLinks } = await import('@/lib/jobs/smart-links');
      const { POST: savedJobsPOST, GET: savedJobsGET, DELETE: savedJobsDELETE } = await import(
        '@/app/api/jobs/saved/route'
      );
      const {
        POST: savedSearchesPOST,
        GET: savedSearchesGET,
        DELETE: savedSearchesDELETE,
      } = await import('@/app/api/jobs/saved-searches/route');
      const { POST: jobClickPOST } = await import('@/app/api/jobs/click/route');
      const { GET: cronJobAlertsGET } = await import('@/app/api/cron/job-alerts/route');
      const { POST: unsubscribePOST } = await import(
        '@/app/api/jobs/alerts/unsubscribe/route'
      );

      // 1. Fuzzy Deduplication across sources (title + company + location)
      const duplicateCrossSourceJobs: Job[] = [
        {
          id: 'rem_1',
          title: 'Sr. Frontend Developer (Remote)',
          company: 'Acme Technologies Inc.',
          location: 'Cairo, Egypt',
          remote: true,
          description: 'Short description.',
          url: 'https://remotive.com/jobs/101?utm_source=feed',
          source: 'Remotive',
          jobType: 'Full-time',
        },
        {
          id: 'arb_1',
          title: 'Senior Front-End Developer',
          company: 'Acme Technologies LLC',
          location: 'Cairo',
          remote: true,
          description:
            'Detailed description of the Senior Frontend Developer role building React & TypeScript web apps.',
          url: 'https://arbeitnow.com/jobs/202',
          source: 'Arbeitnow',
          salary: '$70,000 - $90,000',
          postedDate: new Date().toISOString().split('T')[0],
          tags: ['React', 'TypeScript'],
        },
        {
          id: 'muse_1',
          title: 'Backend Python Intern',
          company: 'BetaData GmbH',
          location: 'Berlin, Germany',
          remote: false,
          description: 'Internship working with Python and SQL.',
          url: 'https://themuse.com/jobs/303',
          source: 'The Muse',
          jobType: 'Internship',
          salary: '$25,000 - $35,000',
          postedDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
        },
      ];

      const deduped = deduplicateJobs(duplicateCrossSourceJobs);
      assert.equal(deduped.length, 2, 'Fuzzy duplicate across Remotive and Arbeitnow must merge into 1');
      assert.equal(
        deduped[0].salary,
        '$70,000 - $90,000',
        'Merged primary job must inherit missing salary from duplicate'
      );
      assert.ok(
        deduped[0].description.length > 40,
        'Merged primary job must inherit richer description from duplicate'
      );

      // 2. Filters: employmentType, datePosted, seniority, minSalary, source, remote
      const onlyInternships = filterAndSortJobs(deduped, {
        query: 'Python',
        employmentType: 'internship',
      });
      assert.equal(onlyInternships.length, 1);
      assert.equal(onlyInternships[0].id, 'muse_1');

      const only24h = filterAndSortJobs(deduped, {
        query: 'Developer',
        datePosted: '24h',
      });
      assert.equal(only24h.length, 1);
      assert.equal(only24h[0].id, 'rem_1');

      const onlyHighSalary = filterAndSortJobs(deduped, {
        query: 'Developer',
        minSalary: 60000,
      });
      assert.equal(onlyHighSalary.length, 1);
      assert.equal(onlyHighSalary[0].id, 'rem_1');

      const onlySourceMuse = filterAndSortJobs(deduped, {
        query: '',
        source: 'The Muse',
      });
      assert.equal(onlySourceMuse.length, 1);
      assert.equal(onlySourceMuse[0].source, 'The Muse');

      // 3. Cursor Pagination
      const fiveJobs: Job[] = Array.from({ length: 5 }, (_, idx) => ({
        id: `page_job_${idx + 1}`,
        title: `Software Engineer ${idx + 1}`,
        company: `Company ${idx + 1}`,
        location: 'Cairo, Egypt',
        remote: true,
        description: 'Engineering role',
        url: `https://example.com/jobs/${idx + 1}`,
        source: 'Remotive',
      }));

      const page1 = paginateJobsWithCursor(fiveJobs, null, 2);
      assert.equal(page1.items.length, 2);
      assert.equal(page1.items[0].id, 'page_job_1');
      assert.equal(page1.hasMore, true);
      assert.ok(page1.nextCursor);

      const page2 = paginateJobsWithCursor(fiveJobs, page1.nextCursor, 2);
      assert.equal(page2.items.length, 2);
      assert.equal(page2.items[0].id, 'page_job_3');
      assert.equal(page2.hasMore, true);

      const page3 = paginateJobsWithCursor(fiveJobs, page2.nextCursor, 2);
      assert.equal(page3.items.length, 1);
      assert.equal(page3.items[0].id, 'page_job_5');
      assert.equal(page3.hasMore, false);
      assert.equal(page3.nextCursor, null);

      // 4. Smart Deep-Links verification (10 platforms, public search URLs)
      const links = generateSmartLinks({
        query: 'Frontend Developer',
        location: 'Cairo',
        remote: true,
      });
      assert.equal(links.length, 10);
      assert.ok(links.some((l) => l.id === 'linkedin' && l.url.includes('linkedin.com/jobs/search')));
      assert.ok(links.some((l) => l.id === 'wuzzuf' && l.url.includes('wuzzuf.net/search/jobs')));
      assert.ok(links.some((l) => l.id === 'bayt' && l.url.includes('bayt.com')));

      // 5. Free CV-less search (includeMatch: false) does NOT deduct quota/credits, while includeMatch: true does
      await clearAllRateLimits();
      const searchUser = await DataStore.createUserAccount({
        name: 'Free Search User',
        email: `free_job_engine_${Date.now()}@test.com`,
        password: 'password123',
        plan: 'free',
        aiCredits: 0,
        emailVerified: new Date().toISOString(),
      });
      const userToken = signToken({
        userId: searchUser.id,
        email: searchUser.email,
        name: searchUser.name,
      });

      const cachedKeyQuery = `engine_test_query_${Date.now()}`;
      await setCachedJobResults(
        { query: cachedKeyQuery, location: 'Cairo', remote: true, country: 'eg' },
        {
          jobs: fiveJobs,
          totalFound: 5,
          attributions: [],
          sourcesQueried: ['Remotive'],
        }
      );

      const freeSearchRes = await jobSearchPOST(
        new NextRequest('http://localhost:3000/api/jobs/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            query: cachedKeyQuery,
            location: 'Cairo',
            remote: true,
            country: 'eg',
            includeMatch: false,
            limit: 2,
          }),
        })
      );
      assert.equal(freeSearchRes.status, 200);
      const freeSearchData = await freeSearchRes.json();
      assert.equal(freeSearchData.includeMatch, false);
      assert.equal(freeSearchData.jobs.length, 2);
      assert.equal(freeSearchData.jobs[0].matchScore, undefined, 'Free CV-less search must omit matchScore');
      assert.equal(freeSearchData.hasMore, true);
      assert.ok(freeSearchData.nextCursor);
      assert.equal(freeSearchData.quota.freeUsed, 0, 'Free CV-less search must not consume jobMatchFreeUsed');

      // 6. Save Job, Saved Searches, Job Alerts Cron & One-Click Unsubscribe, and Click Logging
      const saveJobRes = await savedJobsPOST(
        new NextRequest('http://localhost:3000/api/jobs/saved', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({ job: fiveJobs[0] }),
        })
      );
      assert.equal(saveJobRes.status, 200);

      const listSavedRes = await savedJobsGET(
        new NextRequest('http://localhost:3000/api/jobs/saved', {
          method: 'GET',
          headers: { Authorization: `Bearer ${userToken}` },
        })
      );
      const listSavedData = await listSavedRes.json();
      assert.equal(listSavedData.savedJobs.length, 1);
      assert.equal(listSavedData.savedJobs[0].jobId, fiveJobs[0].id);

      const delSavedRes = await savedJobsDELETE(
        new NextRequest(`http://localhost:3000/api/jobs/saved?jobId=${fiveJobs[0].id}`, {
          method: 'DELETE',
          headers: {
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${userToken}`,
          },
        })
      );
      assert.equal(delSavedRes.status, 200);

      // Saved search with daily alert
      const saveSearchRes = await savedSearchesPOST(
        new NextRequest('http://localhost:3000/api/jobs/saved-searches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            query: cachedKeyQuery,
            location: 'Cairo',
            country: 'eg',
            remote: true,
            alertFrequency: 'daily',
          }),
        })
      );
      assert.equal(saveSearchRes.status, 200);
      const savedSearchBody = await saveSearchRes.json();
      const unsubToken = savedSearchBody.savedSearch.unsubscribeToken;
      assert.ok(unsubToken);

      // Trigger Cron endpoint to send due alert
      const cronRes = await cronJobAlertsGET(
        new NextRequest('http://localhost:3000/api/cron/job-alerts?frequency=daily', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET || 'local_test_cron_secret_token'}`,
          },
        })
      );
      assert.equal(cronRes.status, 200);
      const cronData = await cronRes.json();
      assert.ok(cronData.processed >= 1);

      // Unsubscribe using the one-click token
      const unsubRes = await unsubscribePOST(
        new NextRequest(`http://localhost:3000/api/jobs/alerts/unsubscribe?token=${unsubToken}`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
        })
      );
      assert.equal(unsubRes.status, 200);
      const unsubData = await unsubRes.json();
      assert.equal(unsubData.unsubscribed, true);

      // Record outbound Apply click
      const clickRes = await jobClickPOST(
        new NextRequest('http://localhost:3000/api/jobs/click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            jobId: fiveJobs[0].id,
            title: fiveJobs[0].title,
            company: fiveJobs[0].company,
            source: fiveJobs[0].source,
            url: fiveJobs[0].url,
          }),
        })
      );
      assert.equal(clickRes.status, 200);

      // Clean up saved search
      const listSearchesRes = await savedSearchesGET(
        new NextRequest('http://localhost:3000/api/jobs/saved-searches', {
          method: 'GET',
          headers: { Authorization: `Bearer ${userToken}` },
        })
      );
      const listSearchesData = await listSearchesRes.json();
      assert.equal(listSearchesData.savedSearches[0].alertEnabled, false);

      await savedSearchesDELETE(
        new NextRequest(
          `http://localhost:3000/api/jobs/saved-searches?id=${savedSearchBody.savedSearch.id}`,
          {
            method: 'DELETE',
            headers: {
              origin: 'http://localhost:3000',
              Authorization: `Bearer ${userToken}`,
            },
          }
        )
      );
    });
  });

  // =========================================================================
  // 21. Employer / HR Recruitment Models, Organization, EmployerJob, Application, HrCreditLedger & Unique Constraints
  // =========================================================================
  describe('21. Employer / HR Recruitment Models, Organization, EmployerJob, Application, HrCreditLedger & Unique Constraints', () => {
    it('supports User accountType (candidate | employer | both), Organization model with members & separate hrCredits, and Mongoose schema indexes', async () => {
      // Verify Mongoose schema indexes are registered properly
      const appIndexes = Application.schema.indexes();
      const hasUniqueJobCandidateIdx = appIndexes.some(
        ([fields, opts]: any) =>
          fields.jobId === 1 && fields.candidateId === 1 && opts?.unique === true
      );
      assert.equal(
        hasUniqueJobCandidateIdx,
        true,
        'Application schema must have unique(jobId, candidateId) index'
      );

      const jobIndexes = EmployerJob.schema.indexes();
      const hasOrgStatusIdx = jobIndexes.some(
        ([fields]: any) => fields.orgId === 1 && fields.status === 1
      );
      assert.equal(hasOrgStatusIdx, true, 'EmployerJob schema must index orgId + status');

      const ledgerIndexes = HrCreditLedger.schema.indexes();
      const hasOrgCreatedAtIdx = ledgerIndexes.some(
        ([fields]: any) => fields.orgId === 1 && fields.createdAt === -1
      );
      assert.equal(hasOrgCreatedAtIdx, true, 'HrCreditLedger schema must index orgId + createdAt');

      // Create a candidate user who also becomes an employer ('both')
      const ownerUser = await DataStore.createUserAccount({
        name: 'Nour Employer & Candidate',
        email: `nour_hr_${Date.now()}@test.com`,
        password: 'password123',
        accountType: 'candidate',
      });
      assert.equal(ownerUser.accountType, 'candidate');
      assert.equal(hasAccountRole(ownerUser, 'candidate'), true);
      assert.equal(hasAccountRole(ownerUser, 'employer'), false);

      const recruiterUser = await DataStore.createUserAccount({
        name: 'Recruiter Teammate',
        email: `recruiter_${Date.now()}@test.com`,
        password: 'password123',
        accountType: 'employer',
      });
      assert.equal(recruiterUser.accountType, 'employer');
      assert.equal(hasAccountRole(recruiterUser, 'employer'), true);

      // Creating an Organization automatically enables 'employer' on ownerUser -> becomes 'both'
      const org = await DataStore.createOrganization(ownerUser.id, {
        name: 'Jade Tech Solutions',
        website: 'https://jadetech.example.com',
        logo: 'https://jadetech.example.com/logo.png',
        industry: 'Software Development',
        size: '51-200',
        country: 'EG',
        initialHrCredits: 5,
      });

      assert.equal(org.name, 'Jade Tech Solutions');
      assert.equal(org.verified, false, 'New organizations must default to verified: false');
      assert.equal(org.ownerId, ownerUser.id);
      assert.equal(org.hrCredits, 5);
      assert.equal(org.creditBalance, 5);
      assert.equal(org.members.length, 1);
      assert.equal(org.members[0].userId, ownerUser.id);
      assert.equal(org.members[0].role, 'owner');

      const updatedOwner = await DataStore.findUserById(ownerUser.id);
      assert.equal(
        updatedOwner?.accountType,
        'both',
        'Candidate who creates an organization should hold both candidate and employer roles'
      );
      assert.equal(hasAccountRole(updatedOwner, 'candidate'), true);
      assert.equal(hasAccountRole(updatedOwner, 'employer'), true);

      // Add recruiter member to organization
      const orgWithRecruiter = await DataStore.addOrganizationMember(
        org.id,
        ownerUser.id,
        recruiterUser.id,
        'recruiter'
      );
      assert.equal(orgWithRecruiter?.members.length, 2);
      assert.equal(await DataStore.isOrganizationMember(org.id, recruiterUser.id), true);
      assert.equal(
        await DataStore.isOrganizationMember(org.id, recruiterUser.id, 'owner'),
        false
      );
    });

    it('sanitizes EmployerJob markdown descriptions, enforces Application unique(jobId, candidateId), preserves immutable resumeSnapshot, and hides HR notes from candidates', async () => {
      const hrOwner = await DataStore.createUserAccount({
        name: 'HR Director',
        email: `hr_dir_${Date.now()}@test.com`,
        password: 'password123',
        accountType: 'employer',
      });
      const candidate = await DataStore.createUserAccount({
        name: 'Candidate Applicant',
        email: `applicant_${Date.now()}@test.com`,
        password: 'password123',
        accountType: 'candidate',
      });
      const outsider = await DataStore.createUserAccount({
        name: 'Outsider User',
        email: `outsider_${Date.now()}@test.com`,
        password: 'password123',
      });

      const org = await DataStore.createOrganization(hrOwner.id, {
        name: 'Amber Cloud Corp',
        industry: 'Cloud Infrastructure',
        size: '201-500',
        country: 'AE',
        initialHrCredits: 4,
      });

      // Create EmployerJob with malicious XSS in markdown description
      const job = await DataStore.createEmployerJob(org.id, hrOwner.id, {
        title: 'Senior Full-Stack TypeScript Engineer',
        description:
          '## Role Overview\nWe need a **TypeScript** engineer.\n<script>alert("xss")</script>\n<iframe src="https://evil.com"></iframe>\n[Click Here](javascript:alert(1))\n- Build scalable APIs',
        requirements: ['5+ years TypeScript', 'Next.js & Node.js'],
        skills: ['TypeScript', 'React', 'Node.js', 'MongoDB'],
        location: 'Dubai',
        remote: true,
        employmentType: 'full-time',
        seniority: 'senior',
        salary: { min: 4000, max: 6500, currency: 'USD', visible: true },
        screeningQuestions: ['How many years of TypeScript experience do you have?'],
        status: 'published',
      });

      assert.equal(job.applyMode, 'internal');
      assert.equal(job.status, 'published');
      assert.ok(job.publishedAt);
      assert.ok(job.slug.includes('senior-full-stack-typescript-engineer'));
      assert.ok(!job.description.includes('<script>'), 'Script tags must be stripped');
      assert.ok(!job.description.includes('<iframe'), 'Iframe tags must be stripped');
      assert.ok(!job.description.includes('javascript:'), 'javascript: URIs must be neutralized');
      assert.ok(job.description.includes('## Role Overview'), 'Safe Markdown must be preserved');

      // Candidate submits application with a resume object
      const mutableResumeObj = {
        personalInfo: { fullName: 'Candidate Applicant', jobTitle: 'Full-Stack Developer' },
        skills: ['TypeScript', 'React', 'Node.js'],
      };

      const application = await DataStore.createApplication({
        jobId: job.id,
        candidateId: candidate.id,
        resumeSnapshot: mutableResumeObj,
        coverLetter: 'I am excited to apply for this Senior Engineer role.<script>evil()</script>',
        answers: [
          {
            question: 'How many years of TypeScript experience do you have?',
            answer: '6 years in production.',
          },
        ],
        consent: {
          version: '1.0',
          shareSalary: true,
          sharePhone: false,
        },
      });

      assert.equal(application.jobId, job.id);
      assert.equal(application.candidateId, candidate.id);
      assert.equal(application.status, 'new');
      assert.ok(!application.coverLetter.includes('<script>'));
      assert.equal(application.consent.version, '1.0');
      assert.ok(application.consent.sharedAt);

      // Mutate original resume object after applying — snapshot in DB must remain unchanged!
      mutableResumeObj.personalInfo.fullName = 'MUTATED AFTER APPLICATION';
      mutableResumeObj.skills.push('HackedSkill');

      const checkJobAfterApply = await DataStore.getEmployerJobById(job.id);
      assert.equal(checkJobAfterApply?.applicantsCount, 1, 'applicantsCount must increment to 1');

      // Duplicate application by same candidate to same job MUST fail with DUPLICATE_APPLICATION
      await assert.rejects(
        async () => {
          await DataStore.createApplication({
            jobId: job.id,
            candidateId: candidate.id,
            resumeSnapshot: mutableResumeObj,
            consent: { version: '1.0' },
          });
        },
        (err: any) => err?.message === 'DUPLICATE_APPLICATION',
        'Duplicate application to the same job by the same candidate must be rejected'
      );

      // HR updates status to 'shortlisted' and adds confidential HR-only notes
      const updatedByHr = await DataStore.updateApplicationStatusAndNotes(
        application.id,
        org.id,
        hrOwner.id,
        {
          status: 'shortlisted',
          notes: 'CONFIDENTIAL HR NOTE: Strong system design, schedule panel interview.',
        }
      );
      assert.equal(updatedByHr?.status, 'shortlisted');
      assert.equal(
        updatedByHr?.notes,
        'CONFIDENTIAL HR NOTE: Strong system design, schedule panel interview.'
      );

      // When candidate views their own application, `notes` MUST be stripped and `resumeSnapshot` must be immutable
      const candidateView = await DataStore.getApplicationById(application.id, candidate.id);
      assert.ok(candidateView);
      assert.equal(candidateView?.status, 'shortlisted');
      assert.equal(
        candidateView?.resumeSnapshot.personalInfo.fullName,
        'Candidate Applicant',
        'resumeSnapshot must remain immutable after candidate edits their CV'
      );
      assert.equal(
        'notes' in (candidateView as any),
        false,
        'HR notes must NEVER be exposed to the candidate'
      );

      const candidateList = await DataStore.listCandidateApplications(candidate.id);
      assert.equal(candidateList.length, 1);
      assert.equal('notes' in (candidateList[0] as any), false);

      // Unrelated outsider cannot view application
      const outsiderView = await DataStore.getApplicationById(application.id, outsider.id);
      assert.equal(outsiderView, null);

      // HR runs AI analysis on application (atomically deducts 1 HR credit and records ledger entry)
      const analysisRes = await DataStore.analyzeApplicationWithHrCredits(
        application.id,
        org.id,
        hrOwner.id,
        {
          score: 91,
          matchedSkills: ['TypeScript', 'React', 'Node.js'],
          missingSkills: ['MongoDB'],
          summary: 'Strong match with 6 years of TypeScript experience.',
          model: 'gemini-2.5-flash',
          creditsUsed: 1,
        }
      );
      assert.equal(analysisRes.success, true);
      assert.equal(analysisRes.balanceAfter, 3);
      assert.equal(analysisRes.application?.analysis?.score, 91);
      assert.deepEqual(analysisRes.application?.analysis?.matchedSkills, [
        'TypeScript',
        'React',
        'Node.js',
      ]);
      assert.equal(analysisRes.application?.analysis?.creditsUsed, 1);
    });

    it('records all HR credit additions/deductions in HrCreditLedger and enforces atomic deduction under concurrency', async () => {
      const owner = await DataStore.createUserAccount({
        name: 'Atomic Ledger Owner',
        email: `ledger_${Date.now()}@test.com`,
        password: 'password123',
      });

      const org = await DataStore.createOrganization(owner.id, {
        name: 'Atomic Credits Org',
        initialHrCredits: 2,
      });

      // Add 3 HR credits -> balance becomes 5
      const addRes = await DataStore.addHrCredits(
        org.id,
        3,
        'credit_purchase',
        'order_hr_101',
        owner.id
      );
      assert.equal(addRes.success, true);
      assert.equal(addRes.balanceAfter, 5);
      assert.equal(addRes.ledgerEntry.delta, 3);

      // Fire 4 concurrent deductions of 2 credits each (total 8 requested, but only 5 available)
      // Exactly 2 deductions (4 credits total) should succeed, and 2 must fail with INSUFFICIENT_HR_CREDITS!
      const concurrentResults = await Promise.all([
        DataStore.deductHrCredits(org.id, 2, 'candidate_ai_analysis', 'app_c1', owner.id),
        DataStore.deductHrCredits(org.id, 2, 'candidate_ai_analysis', 'app_c2', owner.id),
        DataStore.deductHrCredits(org.id, 2, 'candidate_ai_analysis', 'app_c3', owner.id),
        DataStore.deductHrCredits(org.id, 2, 'candidate_ai_analysis', 'app_c4', owner.id),
      ]);

      const succeeded = concurrentResults.filter((r) => r.success);
      const failed = concurrentResults.filter((r) => !r.success);

      assert.equal(succeeded.length, 2, 'Only 2 deductions of 2 credits can succeed from balance 5');
      assert.equal(failed.length, 2, 'Remaining 2 deductions must fail atomically');
      for (const f of failed) {
        assert.equal(f.error, 'INSUFFICIENT_HR_CREDITS');
      }

      const orgAfter = await DataStore.getOrganizationById(org.id);
      assert.equal(orgAfter?.hrCredits, 1, 'Final HR credit balance must be 5 - 4 = 1 (never negative)');
      assert.equal(orgAfter?.creditBalance, 1);

      const ledger = await DataStore.getHrCreditLedger(org.id);
      // 1 initial_grant (+2) + 1 credit_purchase (+3) + 2 deductions (-2, -2) = 4 ledger entries
      assert.equal(ledger.length, 4);
      const netSum = ledger.reduce((acc, item) => acc + item.delta, 0);
      assert.equal(netSum, 1, 'Sum of HrCreditLedger deltas must equal current org.hrCredits');
    });
  });

  // =========================================================================
  // 22. Employer Dashboard, Job Publishing, Domain Verification, Content Moderation, Applicants CSV/Email & IDOR Protection
  // =========================================================================
  describe('22. Employer Dashboard, Job Publishing, Domain Verification, Content Moderation, Applicants CSV/Email & IDOR Protection', () => {
    it('verifies company domain emails (rejecting Gmail/Yahoo), enforces pending status & daily limit for unverified orgs, and deducts 1 credit atomically on publish (402 when insufficient)', async () => {
      await clearAllRateLimits();

      const ownerA = await DataStore.createUserAccount({
        name: 'Employer Owner A',
        email: `emp_owner_a_${Date.now()}@test.com`,
        password: 'password123',
      });
      const tokenA = signToken({ userId: ownerA.id, email: ownerA.email, name: ownerA.name });

      // 1. Create Organization via POST /api/employer/overview (starts with 2 HR credits, verified: false)
      const createOrgRes = await employerOverviewPOST(
        new NextRequest('http://localhost:3000/api/employer/overview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${tokenA}`,
          },
          body: JSON.stringify({
            name: 'Unverified Startup LLC',
            website: 'https://startup-llc.io',
            industry: 'SaaS',
            size: '11-50',
            country: 'EG',
          }),
        })
      );
      assert.equal(createOrgRes.status, 201);
      const createOrgData = await createOrgRes.json();
      const orgId = createOrgData.organization.id;
      assert.equal(createOrgData.organization.verified, false);
      assert.equal(createOrgData.organization.hrCredits, 2);

      // 2. Reject consumer Gmail/Yahoo email during domain verification
      const gmailVerifyRes = await verifyOrgPOST(
        new NextRequest(`http://localhost:3000/api/employer/organizations/${orgId}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${tokenA}`,
          },
          body: JSON.stringify({
            action: 'request',
            workEmail: 'founder@gmail.com',
          }),
        }),
        { params: Promise.resolve({ orgId }) }
      );
      assert.equal(gmailVerifyRes.status, 400);
      const gmailVerifyData = await gmailVerifyRes.json();
      assert.equal(gmailVerifyData.error, 'CONSUMER_EMAIL_DOMAIN_NOT_ALLOWED');

      // 3. Reject > 5 screening questions on job creation
      const tooManyQuestionsRes = await employerJobsPOST(
        new NextRequest('http://localhost:3000/api/employer/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${tokenA}`,
          },
          body: JSON.stringify({
            orgId,
            title: 'Backend Engineer',
            description: 'Build distributed services in Node.js and TypeScript.',
            screeningQuestions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'],
          }),
        })
      );
      assert.equal(tooManyQuestionsRes.status, 400, 'Must reject more than 5 screening questions');

      // 4. Unverified organization publishing a clean job -> enters status='pending' and deducts 1 HR credit (2 -> 1)
      const pubJob1Res = await employerJobsPOST(
        new NextRequest('http://localhost:3000/api/employer/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${tokenA}`,
          },
          body: JSON.stringify({
            orgId,
            title: 'Product Designer',
            description: 'Design intuitive user experiences for our SaaS suite.',
            skills: ['Figma', 'UI/UX', 'Design Systems'],
            screeningQuestions: ['Share your portfolio link', 'Years of SaaS experience?'],
            publishNow: true,
          }),
        })
      );
      assert.equal(pubJob1Res.status, 201);
      const pubJob1Data = await pubJob1Res.json();
      assert.equal(
        pubJob1Data.job.status,
        'pending',
        'Unverified organization jobs must enter pending status for admin review'
      );
      assert.equal(pubJob1Data.balanceAfter, 1);

      // 5. Publish 2nd job (uses last remaining credit: 1 -> 0)
      const pubJob2Res = await employerJobsPOST(
        new NextRequest('http://localhost:3000/api/employer/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${tokenA}`,
          },
          body: JSON.stringify({
            orgId,
            title: 'QA Automation Engineer',
            description: 'Write end-to-end Playwright and integration tests.',
            publishNow: true,
          }),
        })
      );
      assert.equal(pubJob2Res.status, 201);
      const pubJob2Data = await pubJob2Res.json();
      assert.equal(pubJob2Data.balanceAfter, 0);

      // 6. Verify corporate domain email (`hr@startup-llc.io`) so daily unverified limit is lifted,
      // then attempt to publish 3rd job with 0 credits -> returns 402 INSUFFICIENT_HR_CREDITS + saves draft!
      let capturedCode = '';
      setCustomResendSenderForTests(async (payload) => {
        const match = payload.html.match(/\b(\d{6})\b/);
        if (match) capturedCode = match[1];
        return { data: { id: 'verify_email_1' }, error: null };
      });

      try {
        const reqVerifyRes = await verifyOrgPOST(
          new NextRequest(`http://localhost:3000/api/employer/organizations/${orgId}/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              origin: 'http://localhost:3000',
              Authorization: `Bearer ${tokenA}`,
            },
            body: JSON.stringify({
              action: 'request',
              workEmail: 'hr@startup-llc.io',
            }),
          }),
          { params: Promise.resolve({ orgId }) }
        );
        assert.equal(reqVerifyRes.status, 200);
        assert.equal(capturedCode.length, 6);

        const confirmVerifyRes = await verifyOrgPOST(
          new NextRequest(`http://localhost:3000/api/employer/organizations/${orgId}/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              origin: 'http://localhost:3000',
              Authorization: `Bearer ${tokenA}`,
            },
            body: JSON.stringify({
              action: 'confirm',
              code: capturedCode,
            }),
          }),
          { params: Promise.resolve({ orgId }) }
        );
        assert.equal(confirmVerifyRes.status, 200);
        const confirmData = await confirmVerifyRes.json();
        assert.equal(confirmData.organization.verified, true);
      } finally {
        setCustomResendSenderForTests(null);
      }

      // Now org is verified, but has 0 HR credits -> publishing returns 402 + purchaseUrl while saving draft!
      const noCreditRes = await employerJobsPOST(
        new NextRequest('http://localhost:3000/api/employer/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${tokenA}`,
          },
          body: JSON.stringify({
            orgId,
            title: 'DevOps Engineer',
            description: 'Manage Kubernetes clusters and CI/CD pipelines.',
            publishNow: true,
          }),
        })
      );
      assert.equal(noCreditRes.status, 402);
      const noCreditData = await noCreditRes.json();
      assert.equal(noCreditData.error, 'INSUFFICIENT_HR_CREDITS');
      assert.equal(noCreditData.purchaseUrl, '/employer/billing');
      assert.equal(noCreditData.job.status, 'draft', 'Draft must be preserved when credits are insufficient');
    });

    it('blocks scam/payment-requesting job posts, handles user job reports, and supports Admin moderation review', async () => {
      await clearAllRateLimits();

      const employer = await DataStore.createUserAccount({
        name: 'Moderation Test Employer',
        email: `mod_emp_${Date.now()}@test.com`,
        password: 'password123',
      });
      const empToken = signToken({ userId: employer.id, email: employer.email, name: employer.name });

      const adminUser = await DataStore.createUserAccount({
        name: 'Platform Admin',
        email: `admin_mod_${Date.now()}@test.com`,
        password: 'password123',
        role: 'admin',
      });
      const adminToken = signToken({
        userId: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: 'admin',
      });

      const org = await DataStore.createOrganization(employer.id, {
        name: 'Verified Corp',
        initialHrCredits: 5,
      });
      await DataStore.adminVerifyOrganization(org.id, true);

      // 1. Job asking applicant for payment fee -> blocked with 400 CONTENT_POLICY_VIOLATION (and credit NOT deducted)
      const scamJobRes = await employerJobsPOST(
        new NextRequest('http://localhost:3000/api/employer/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${empToken}`,
          },
          body: JSON.stringify({
            orgId: org.id,
            title: 'Data Entry Clerk',
            description: 'Candidates must pay a registration fee of $50 before onboarding.',
            publishNow: true,
          }),
        })
      );
      assert.equal(scamJobRes.status, 400);
      const scamData = await scamJobRes.json();
      assert.equal(scamData.error, 'CONTENT_POLICY_VIOLATION');
      assert.ok(scamData.flags.includes('PAYMENT_FROM_APPLICANT'));

      const orgAfterBlocked = await DataStore.getOrganizationById(org.id);
      assert.equal(
        orgAfterBlocked?.hrCredits,
        5,
        'HR credits must not be deducted when content policy blocks publishing'
      );

      // 2. Job with suspicious shortened link -> flagged & held in status='pending' for Admin review
      const suspiciousLinkJobRes = await employerJobsPOST(
        new NextRequest('http://localhost:3000/api/employer/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${empToken}`,
          },
          body: JSON.stringify({
            orgId: org.id,
            title: 'Marketing Specialist',
            description: 'Great marketing role. Apply also via https://bit.ly/suspicious123 for fast track.',
            publishNow: true,
          }),
        })
      );
      assert.equal(suspiciousLinkJobRes.status, 201);
      const suspiciousJobData = await suspiciousLinkJobRes.json();
      assert.equal(suspiciousJobData.job.status, 'pending');
      assert.ok(suspiciousJobData.moderationFlags.includes('SUSPICIOUS_LINK'));

      // 3. User reports a job via POST /api/jobs/report
      const reportRes = await jobReportPOST(
        new NextRequest('http://localhost:3000/api/jobs/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${empToken}`,
          },
          body: JSON.stringify({
            jobId: suspiciousJobData.job.id,
            jobTitle: suspiciousJobData.job.title,
            company: org.name,
            reason: 'suspicious_links',
            details: 'Contains a shortened bit.ly link.',
          }),
        })
      );
      assert.equal(reportRes.status, 201);
      const reportData = await reportRes.json();
      assert.equal(reportData.report.status, 'open');

      // 4. Admin fetches moderation queue and approves job + resolves report
      const adminQueueRes = await adminModerationGET(
        new NextRequest('http://localhost:3000/api/admin/moderation', {
          method: 'GET',
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      );
      assert.equal(adminQueueRes.status, 200);
      const adminQueueData = await adminQueueRes.json();
      assert.ok(
        adminQueueData.pendingJobs.some((j: any) => j.id === suspiciousJobData.job.id)
      );
      assert.ok(adminQueueData.reports.some((r: any) => r.id === reportData.report.id));

      const approveRes = await adminModerationPOST(
        new NextRequest('http://localhost:3000/api/admin/moderation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            targetType: 'job',
            jobId: suspiciousJobData.job.id,
            action: 'approve',
          }),
        })
      );
      assert.equal(approveRes.status, 200);
      const approveData = await approveRes.json();
      assert.equal(approveData.job.status, 'published');
    });

    it('filters/sorts job applicants, exports CSV, sends candidate email via Resend without leaking HR email unless opted in, and blocks all IDOR attacks with 403', async () => {
      await clearAllRateLimits();

      // Create Org A (legitimate owner) and Org B (attacker trying IDOR)
      const hrUserA = await DataStore.createUserAccount({
        name: 'HR Manager Org A',
        email: `hr_secret_a_${Date.now()}@org-a.com`,
        password: 'password123',
      });
      const tokenA = signToken({ userId: hrUserA.id, email: hrUserA.email, name: hrUserA.name });

      const hrUserB = await DataStore.createUserAccount({
        name: 'Attacker HR Org B',
        email: `hr_attacker_b_${Date.now()}@org-b.com`,
        password: 'password123',
      });
      const tokenB = signToken({ userId: hrUserB.id, email: hrUserB.email, name: hrUserB.name });

      const candidate1 = await DataStore.createUserAccount({
        name: 'Sara Candidate',
        email: `sara_cand_${Date.now()}@example.com`,
        password: 'password123',
      });
      const cand1Token = signToken({
        userId: candidate1.id,
        email: candidate1.email,
        name: candidate1.name,
      });

      const candidate2 = await DataStore.createUserAccount({
        name: 'Karim Candidate',
        email: `karim_cand_${Date.now()}@example.com`,
        password: 'password123',
      });

      const orgA = await DataStore.createOrganization(hrUserA.id, {
        name: 'Org A Enterprise',
        initialHrCredits: 5,
      });
      await DataStore.adminVerifyOrganization(orgA.id, true);

      const orgB = await DataStore.createOrganization(hrUserB.id, {
        name: 'Org B Competitor',
        initialHrCredits: 5,
      });

      const jobA = await DataStore.createEmployerJob(orgA.id, hrUserA.id, {
        title: 'Lead Cloud Architect',
        description: 'Architect scalable cloud systems on AWS and Kubernetes.',
        skills: ['AWS', 'Kubernetes', 'Terraform', 'Go'],
        status: 'published',
      });

      // Candidate 1 (matches 4/4 skills = 100%) and Candidate 2 (matches 1/4 skills = 25%) apply to Job A
      const app1 = await DataStore.createApplication({
        jobId: jobA.id,
        candidateId: candidate1.id,
        resumeSnapshot: {
          personalInfo: {
            fullName: 'Sara Candidate',
            email: candidate1.email,
            jobTitle: 'Cloud Architect',
          },
          skills: ['AWS', 'Kubernetes', 'Terraform', 'Go'],
        },
        answers: [{ question: 'AWS experience?', answer: '7 years' }],
        consent: { version: '1.0', sharePhone: false },
      });

      await DataStore.createApplication({
        jobId: jobA.id,
        candidateId: candidate2.id,
        resumeSnapshot: {
          personalInfo: {
            fullName: 'Karim Candidate',
            email: candidate2.email,
            jobTitle: 'Junior Dev',
          },
          skills: ['AWS'],
        },
        consent: { version: '1.0', sharePhone: false },
      });

      // 1. HR of Org A lists applicants sorted by score DESC -> Sara (100%) comes before Karim (25%)
      const listRes = await jobApplicantsGET(
        new NextRequest(
          `http://localhost:3000/api/employer/jobs/${jobA.id}/applicants?sortBy=score&sortOrder=desc`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${tokenA}` },
          }
        ),
        { params: Promise.resolve({ jobId: jobA.id }) }
      );
      assert.equal(listRes.status, 200);
      const listData = await listRes.json();
      assert.equal(listData.applicants.length, 2);
      assert.equal(listData.applicants[0].candidateName, 'Sara Candidate');
      assert.equal(listData.applicants[0].computedScore, 100);
      assert.equal(listData.applicants[1].candidateName, 'Karim Candidate');
      assert.equal(listData.applicants[1].computedScore, 25);

      // 2. Export CSV (`?format=csv`)
      const csvRes = await jobApplicantsGET(
        new NextRequest(
          `http://localhost:3000/api/employer/jobs/${jobA.id}/applicants?format=csv`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${tokenA}` },
          }
        ),
        { params: Promise.resolve({ jobId: jobA.id }) }
      );
      assert.equal(csvRes.status, 200);
      assert.ok(csvRes.headers.get('content-type')?.includes('text/csv'));
      const csvText = await csvRes.text();
      assert.ok(csvText.includes('Sara Candidate'));
      assert.ok(csvText.includes('Karim Candidate'));

      // 3. Send templated email to Candidate 1 WITHOUT revealing HR email (default revealHrEmail: false)
      let sentPayloads: Array<{ from: string; to: string | string[]; subject: string; html: string }> = [];
      setCustomResendSenderForTests(async (payload) => {
        sentPayloads.push(payload);
        return { data: { id: `msg_${sentPayloads.length}` }, error: null };
      });

      try {
        const emailHiddenRes = await applicationEmailPOST(
          new NextRequest(
            `http://localhost:3000/api/employer/applications/${app1.id}/email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                origin: 'http://localhost:3000',
                Authorization: `Bearer ${tokenA}`,
              },
              body: JSON.stringify({
                template: 'interview',
                customMessage: 'Are you available Tuesday at 2 PM UTC?',
                revealHrEmail: false,
              }),
            }
          ),
          { params: Promise.resolve({ applicationId: app1.id }) }
        );
        assert.equal(emailHiddenRes.status, 200);
        assert.equal(sentPayloads.length, 1);
        assert.equal(
          sentPayloads[0].html.includes(hrUserA.email),
          false,
          'HR email address MUST NOT be revealed when revealHrEmail is false'
        );
        assert.equal(
          sentPayloads[0].from.includes(hrUserA.email),
          false,
          'Sender header must use platform noreply address, not HR personal email'
        );

        // Now send with revealHrEmail: true -> HR email IS included in the body
        const emailRevealedRes = await applicationEmailPOST(
          new NextRequest(
            `http://localhost:3000/api/employer/applications/${app1.id}/email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                origin: 'http://localhost:3000',
                Authorization: `Bearer ${tokenA}`,
              },
              body: JSON.stringify({
                template: 'interview',
                revealHrEmail: true,
              }),
            }
          ),
          { params: Promise.resolve({ applicationId: app1.id }) }
        );
        assert.equal(emailRevealedRes.status, 200);
        assert.equal(sentPayloads.length, 2);
        assert.equal(
          sentPayloads[1].html.includes(hrUserA.email),
          true,
          'HR email address should be included when revealHrEmail is explicitly true'
        );
      } finally {
        setCustomResendSenderForTests(null);
      }

      // 4. IDOR SECURITY TESTS:
      // 4a. Org B member trying to view Org A's overview -> 403
      const idorOverviewRes = await employerOverviewGET(
        new NextRequest(`http://localhost:3000/api/employer/overview?orgId=${orgA.id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${tokenB}` },
        })
      );
      assert.equal(idorOverviewRes.status, 403);

      // 4b. Org B member trying to read or edit Org A's job -> 403
      const idorJobGetRes = await employerJobDetailGET(
        new NextRequest(`http://localhost:3000/api/employer/jobs/${jobA.id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${tokenB}` },
        }),
        { params: Promise.resolve({ jobId: jobA.id }) }
      );
      assert.equal(idorJobGetRes.status, 403);

      const idorJobPutRes = await employerJobDetailPUT(
        new NextRequest(`http://localhost:3000/api/employer/jobs/${jobA.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${tokenB}`,
          },
          body: JSON.stringify({ title: 'Hacked Title by Org B' }),
        }),
        { params: Promise.resolve({ jobId: jobA.id }) }
      );
      assert.equal(idorJobPutRes.status, 403);

      // 4c. Org B member trying to list/export applicants of Org A's job -> 403
      const idorApplicantsRes = await jobApplicantsGET(
        new NextRequest(`http://localhost:3000/api/employer/jobs/${jobA.id}/applicants`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${tokenB}` },
        }),
        { params: Promise.resolve({ jobId: jobA.id }) }
      );
      assert.equal(idorApplicantsRes.status, 403);

      // 4d. Org B member trying to PATCH status/notes or email Org A's applicant -> 403
      const idorPatchAppRes = await applicationPATCH(
        new NextRequest(`http://localhost:3000/api/employer/applications/${app1.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${tokenB}`,
          },
          body: JSON.stringify({ status: 'rejected', notes: 'IDOR injection' }),
        }),
        { params: Promise.resolve({ applicationId: app1.id }) }
      );
      assert.equal(idorPatchAppRes.status, 403);

      const idorEmailAppRes = await applicationEmailPOST(
        new NextRequest(`http://localhost:3000/api/employer/applications/${app1.id}/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${tokenB}`,
          },
          body: JSON.stringify({ template: 'rejected' }),
        }),
        { params: Promise.resolve({ applicationId: app1.id }) }
      );
      assert.equal(idorEmailAppRes.status, 403);

      // 4e. Candidate trying to PATCH their own application status to 'hired' -> 403
      const candSelfPatchRes = await applicationPATCH(
        new NextRequest(`http://localhost:3000/api/employer/applications/${app1.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${cand1Token}`,
          },
          body: JSON.stringify({ status: 'hired' }),
        }),
        { params: Promise.resolve({ applicationId: app1.id }) }
      );
      assert.equal(candSelfPatchRes.status, 403);
    });
  });

  // =========================================================================
  // 23. Direct Job Page (/jobs/hire/[slug]), Apply Flow, Candidate Applications & 'Direct' Search Badge
  // =========================================================================
  describe('23. Public Hire Job Page, Apply Flow, File Validation, Withdraw & Direct Jobs Search', () => {
    it('validates uploaded resume files (size, extension, MIME, executable/script rejection, PDF/DOCX magic bytes)', async () => {
      const { validateUploadedResumeFile } = await import('../lib/hr/applyValidation');

      // 1. Empty file -> EMPTY_FILE
      assert.equal(
        validateUploadedResumeFile({ name: 'cv.pdf', size: 0, type: 'application/pdf' }).error,
        'EMPTY_FILE'
      );

      // 2. Oversized file (> 5MB) -> FILE_TOO_LARGE
      assert.equal(
        validateUploadedResumeFile({
          name: 'cv.pdf',
          size: 6 * 1024 * 1024,
          type: 'application/pdf',
        }).error,
        'FILE_TOO_LARGE'
      );

      // 3. Unsupported extension (.exe) -> UNSUPPORTED_FILE_TYPE
      assert.equal(
        validateUploadedResumeFile({
          name: 'malware.exe',
          size: 1024,
          type: 'application/octet-stream',
        }).error,
        'UNSUPPORTED_FILE_TYPE'
      );

      // 4. Executable MZ magic bytes disguised as .txt -> MALICIOUS_FILE_CONTENT
      const mzBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03]);
      assert.equal(
        validateUploadedResumeFile({
          name: 'resume.txt',
          size: mzBytes.byteLength,
          type: 'text/plain',
          bytes: mzBytes,
        }).error,
        'MALICIOUS_FILE_CONTENT'
      );

      // 5. Script tag disguised inside .txt -> MALICIOUS_FILE_CONTENT
      const scriptBytes = new TextEncoder().encode('Hello <script>alert(1)</script>');
      assert.equal(
        validateUploadedResumeFile({
          name: 'resume.txt',
          size: scriptBytes.byteLength,
          type: 'text/plain',
          bytes: scriptBytes,
        }).error,
        'MALICIOUS_FILE_CONTENT'
      );

      // 6. Invalid PDF signature -> INVALID_FILE_SIGNATURE
      const fakePdfBytes = new TextEncoder().encode('NOT_A_PDF_HEADER_12345');
      assert.equal(
        validateUploadedResumeFile({
          name: 'resume.pdf',
          size: fakePdfBytes.byteLength,
          type: 'application/pdf',
          bytes: fakePdfBytes,
        }).error,
        'INVALID_FILE_SIGNATURE'
      );

      // 7. Valid PDF with %PDF- header -> valid: true
      const validPdfBytes = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<<>>\nendobj');
      const validPdfResult = validateUploadedResumeFile({
        name: 'my-resume.pdf',
        size: validPdfBytes.byteLength,
        type: 'application/pdf',
        bytes: validPdfBytes,
      });
      assert.equal(validPdfResult.valid, true);
      assert.equal(validPdfResult.extension, '.pdf');
    });

    it('serves /api/jobs/hire/[slug] with JobPosting JSON-LD, enforces explicit consent & duplicate prevention on Apply, lists/withdraws Candidate Applications without HR notes, and surfaces Direct jobs in /jobs', async () => {
      await clearAllRateLimits();
      const { GET: hireJobGET } = await import('../app/api/jobs/hire/[slug]/route');
      const { POST: hireJobApplyPOST } = await import('../app/api/jobs/hire/[slug]/apply/route');
      const { GET: candidateAppsGET } = await import('../app/api/applications/route');
      const { DELETE: candidateAppDELETE } = await import(
        '../app/api/applications/[applicationId]/route'
      );
      const { PATCH: employerAppPATCH } = await import(
        '../app/api/employer/applications/[applicationId]/route'
      );

      // 1. Create Employer Organization & Published Job
      const hrOwner = await DataStore.createUserAccount({
        name: 'Direct Hire HR',
        email: `direct_hr_${Date.now()}@company-direct.io`,
        password: 'password123',
        accountType: 'employer',
      });
      const hrToken = signToken({
        userId: hrOwner.id,
        email: hrOwner.email,
        name: hrOwner.name,
        role: 'user',
      });

      const org = await DataStore.createOrganization(hrOwner.id, {
        name: 'DirectTech Solutions',
        website: 'https://company-direct.io',
        country: 'Egypt',
        industry: 'Software',
        size: '51-200',
        initialHrCredits: 5,
      });
      await DataStore.adminVerifyOrganization(org.id, true);

      const publishedJob = await DataStore.createEmployerJob(org.id, hrOwner.id, {
        title: 'Senior Full Stack TypeScript Engineer',
        description:
          'Join DirectTech Solutions to build scalable Next.js and Node.js applications with TypeScript and MongoDB.',
        requirements: ['5+ years TypeScript', 'Next.js App Router experience'],
        skills: ['TypeScript', 'Next.js', 'Node.js', 'MongoDB'],
        location: 'Cairo, Egypt',
        remote: true,
        employmentType: 'full-time',
        seniority: 'senior',
        salary: { min: 3000, max: 4500, currency: 'USD', visible: true },
        screeningQuestions: ['How many years of production TypeScript experience do you have?'],
        status: 'published',
      });

      // 2. GET /api/jobs/hire/[slug] returns job details + Schema.org JobPosting JSON-LD
      const getJobRes: any = await hireJobGET(
        new NextRequest(`http://localhost:3000/api/jobs/hire/${publishedJob.slug}`, {
          method: 'GET',
        }),
        { params: Promise.resolve({ slug: publishedJob.slug }) }
      );
      assert.equal(getJobRes.status, 200);
      const getJobData = await getJobRes.json();
      assert.equal(getJobData.ok, true);
      assert.equal(getJobData.job.title, 'Senior Full Stack TypeScript Engineer');
      assert.equal(getJobData.organization.name, 'DirectTech Solutions');
      assert.equal(getJobData.jsonLd['@type'], 'JobPosting');
      assert.equal(getJobData.jsonLd.jobLocationType, 'TELECOMMUTE');
      assert.equal(getJobData.jsonLd.directApply, true);

      // 3. Published internal job appears in Direct Jobs search with source === 'Direct'
      const directJobs = await DataStore.searchPublishedEmployerJobsAsDirectJobs({
        query: 'TypeScript',
        remote: true,
      });
      const foundDirect = directJobs.find((j) => j.id === publishedJob.id);
      assert.ok(foundDirect, 'Expected published EmployerJob to appear in Direct jobs search');
      assert.equal(foundDirect!.source, 'Direct');
      assert.equal(foundDirect!.url, `/jobs/hire/${publishedJob.slug}`);

      // 4. Create Candidate user
      const candidate = await DataStore.createUserAccount({
        name: 'Salma Candidate',
        email: `salma_cand_${Date.now()}@example.com`,
        password: 'password123',
      });

      const candToken = signToken({
        userId: candidate.id,
        email: candidate.email,
        name: candidate.name,
        role: 'user',
      });

      // 5. Apply WITHOUT explicit consent -> 400 CONSENT_REQUIRED
      const noConsentRes: any = await hireJobApplyPOST(
        new NextRequest(`http://localhost:3000/api/jobs/hire/${publishedJob.slug}/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${candToken}`,
          },
          body: JSON.stringify({
            resumeSnapshot: {
              fullName: 'Salma Hassan',
              email: candidate.email,
              headline: 'Senior TypeScript Developer',
              skills: ['TypeScript', 'Next.js', 'Node.js', 'React'],
            },
            consentAccepted: false,
            answers: [{ questionId: 'q_0', question: 'How many years?', answer: '6 years' }],
          }),
        }),
        { params: Promise.resolve({ slug: publishedJob.slug }) }
      );
      assert.equal(noConsentRes.status, 400);
      const noConsentData = await noConsentRes.json();
      assert.equal(noConsentData.error, 'CONSENT_REQUIRED');

      // 6. Apply WITH explicit consent -> 201 Created
      const validApplyRes: any = await hireJobApplyPOST(
        new NextRequest(`http://localhost:3000/api/jobs/hire/${publishedJob.slug}/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${candToken}`,
          },
          body: JSON.stringify({
            resumeSnapshot: {
              fullName: 'Salma Hassan',
              email: candidate.email,
              headline: 'Senior TypeScript Developer',
              summary: 'Full stack developer experienced in TypeScript, Next.js, and Node.js.',
              skills: ['TypeScript', 'Next.js', 'Node.js', 'React'],
            },
            coverLetter: 'I would love to join DirectTech Solutions as a Senior TS Engineer.',
            answers: [
              {
                questionId: 'q_0',
                question: 'How many years of production TypeScript experience do you have?',
                answer: '6 years in production',
              },
            ],
            consentAccepted: true,
            sharePhone: false,
            shareSalary: false,
          }),
        }),
        { params: Promise.resolve({ slug: publishedJob.slug }) }
      );
      assert.equal(validApplyRes.status, 201);
      const validApplyData = await validApplyRes.json();
      assert.equal(validApplyData.ok, true);
      const createdAppId = validApplyData.application.id;

      // 7. Duplicate application to the same job -> 409 DUPLICATE_APPLICATION
      const dupApplyRes: any = await hireJobApplyPOST(
        new NextRequest(`http://localhost:3000/api/jobs/hire/${publishedJob.slug}/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${candToken}`,
          },
          body: JSON.stringify({
            resumeSnapshot: {
              fullName: 'Salma Hassan',
              email: candidate.email,
              skills: ['TypeScript', 'Next.js'],
            },
            answers: [
              {
                questionId: 'q_0',
                question: 'How many years of production TypeScript experience do you have?',
                answer: '6 years in production',
              },
            ],
            consentAccepted: true,
          }),
        }),
        { params: Promise.resolve({ slug: publishedJob.slug }) }
      );
      assert.equal(dupApplyRes.status, 409);
      const dupApplyData = await dupApplyRes.json();
      assert.equal(dupApplyData.error, 'DUPLICATE_APPLICATION');

      // 8. HR adds private notes and updates status to 'shortlisted'
      const hrPatchRes: any = await employerAppPATCH(
        new NextRequest(`http://localhost:3000/api/employer/applications/${createdAppId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${hrToken}`,
          },
          body: JSON.stringify({
            status: 'shortlisted',
            notes: 'CONFIDENTIAL_HR_NOTE_DO_NOT_LEAK_TO_CANDIDATE',
          }),
        }),
        { params: Promise.resolve({ applicationId: createdAppId }) }
      );
      assert.equal(hrPatchRes.status, 200);

      // 9. Candidate fetches GET /api/applications -> sees 'shortlisted' status but NEVER sees HR notes
      const myAppsRes: any = await candidateAppsGET(
        new NextRequest('http://localhost:3000/api/applications', {
          method: 'GET',
          headers: { Authorization: `Bearer ${candToken}` },
        })
      );
      assert.equal(myAppsRes.status, 200);
      const myAppsData = await myAppsRes.json();
      assert.equal(myAppsData.ok, true);
      const myAppItem = myAppsData.applications.find((a: any) => a.id === createdAppId);
      assert.ok(myAppItem);
      assert.equal(myAppItem.status, 'shortlisted');
      assert.equal('notes' in myAppItem, false);
      assert.equal(
        JSON.stringify(myAppsData).includes('CONFIDENTIAL_HR_NOTE_DO_NOT_LEAK_TO_CANDIDATE'),
        false
      );

      // 10. Another user cannot withdraw Salma's application -> 403 FORBIDDEN
      const otherCand = await DataStore.createUserAccount({
        name: 'Other Candidate',
        email: `other_cand_${Date.now()}@example.com`,
        password: 'password123',
      });
      const otherCandToken = signToken({
        userId: otherCand.id,
        email: otherCand.email,
        name: otherCand.name,
        role: 'user',
      });

      const idorDeleteRes: any = await candidateAppDELETE(
        new NextRequest(`http://localhost:3000/api/applications/${createdAppId}`, {
          method: 'DELETE',
          headers: {
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${otherCandToken}`,
          },
        }),
        { params: Promise.resolve({ applicationId: createdAppId }) }
      );
      assert.equal(idorDeleteRes.status, 403);

      // 11. Salma withdraws her application and deletes her shared data -> 200 OK & applicantsCount decrements
      const withdrawRes: any = await candidateAppDELETE(
        new NextRequest(`http://localhost:3000/api/applications/${createdAppId}`, {
          method: 'DELETE',
          headers: {
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${candToken}`,
          },
        }),
        { params: Promise.resolve({ applicationId: createdAppId }) }
      );
      assert.equal(withdrawRes.status, 200);
      const deletedLookup = await DataStore.getApplicationById(createdAppId, candidate.id);
      assert.equal(deletedLookup, null);
      const updatedJobAfterWithdraw = await DataStore.getEmployerJobById(publishedJob.id);
      assert.equal(updatedJobAfterWithdraw?.applicantsCount, 0);
    });
  });

  // =========================================================================
  // 24. Applicant AI Analysis, Fairness Redaction, Atomic Credit Deduction & Refund
  // =========================================================================
  describe('24. Applicant AI Analysis, Fairness Redaction, Atomic Credit Deduction & Refund', () => {
    it('redacts Name, Gender, Age, Photo, Nationality, Marital Status, and Religion before AI prompt & scoring', async () => {
      const {
        redactCandidateForFairness,
        analyzeApplicantAgainstJob,
        setCustomApplicantAiRunnerForTests,
      } = await import('../lib/employer/analyzeApplicant');

      const snapshotWithDemographics: Record<string, unknown> = {
        fullName: 'Ahmed Al-Mansouri',
        email: 'ahmed.mansouri@personalmail.com',
        phone: '+201099887766',
        gender: 'Male',
        age: 32,
        dateOfBirth: '1994-05-12',
        photo: 'https://cdn.example.com/photos/ahmed-profile.jpg',
        avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
        nationality: 'Egyptian',
        maritalStatus: 'Married',
        religion: 'Muslim',
        headline: 'Senior Backend TypeScript & Node.js Engineer',
        yearsOfExperience: 7,
        skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
        summary:
          'My name is Ahmed Al-Mansouri. Gender: Male. Age: 32 years old. DOB: 12/05/1994. Nationality: Egyptian. Marital Status: Married. Religion: Islam. الجنس: ذكر. العمر: 32 سنة. الجنسية: مصري. الحالة الاجتماعية: متزوج. الديانة: مسلم. Built distributed microservices in TypeScript and Node.js handling 50k req/s.',
      };

      const redaction = redactCandidateForFairness(
        snapshotWithDemographics,
        'Ahmed Al-Mansouri'
      );

      // Verify all 7 sensitive demographic categories are recorded as redacted
      for (const cat of [
        'name',
        'gender',
        'age',
        'photo',
        'nationality',
        'maritalStatus',
        'religion',
      ] as const) {
        assert.ok(
          redaction.redactedCategories.includes(cat),
          `Expected category ${cat} to be marked as redacted`
        );
      }

      // Verify none of the demographic values exist in redactedText
      const forbiddenTokens = [
        'Ahmed',
        'Mansouri',
        'ahmed.mansouri@personalmail.com',
        '+201099887766',
        '1994-05-12',
        '12/05/1994',
        '32 years old',
        '32 سنة',
        'ahmed-profile.jpg',
        'data:image/png',
        'Gender: Male',
        'Nationality: Egyptian',
        'Marital Status: Married',
        'Religion: Islam',
        'الجنس: ذكر',
        'الجنسية: مصري',
        'الحالة الاجتماعية: متزوج',
        'الديانة: مسلم',
      ];
      for (const token of forbiddenTokens) {
        assert.equal(
          redaction.redactedText.includes(token),
          false,
          `Redacted text must NOT contain sensitive token: "${token}"`
        );
      }

      // Capture the prompt sent to AI runner and verify no demographic leakage
      let capturedPrompt = '';
      setCustomApplicantAiRunnerForTests(async (input) => {
        capturedPrompt = input.prompt;
        return {
          strengths: ['Strong TypeScript & Node.js production experience (7 years)'],
          gaps: ['Missing Kubernetes certification'],
          interviewQuestions: [
            'How did you design your Redis caching layer for 50k req/s?',
          ],
          score: 86,
          explanation:
            'Evaluated strictly on technical skills (TypeScript, Node.js, PostgreSQL) and 7 years of backend engineering experience.',
          model: 'gemini-2.5-flash-test',
          promptTokens: 320,
          completionTokens: 140,
        };
      });

      try {
        const mockJob: any = {
          id: 'job_fairness_1',
          orgId: 'org_fairness_1',
          title: 'Senior Backend TypeScript Engineer',
          description:
            'Design and scale Node.js and TypeScript microservices using PostgreSQL, Redis, and Docker.',
          requirements: ['5+ years backend engineering', 'TypeScript and Node.js'],
          skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
          remote: true,
          employmentType: 'full-time',
          seniority: 'senior',
          applyMode: 'internal',
          status: 'published',
          applicantsCount: 1,
          slug: 'senior-backend-ts',
          screeningQuestions: [],
          flaggedKeywords: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const mockApp: any = {
          id: 'app_fairness_1',
          jobId: mockJob.id,
          orgId: mockJob.orgId,
          candidateId: 'cand_fairness_1',
          resumeSnapshot: snapshotWithDemographics,
          coverLetter:
            'Hello, I am Ahmed Al-Mansouri (32 years old, Married, Egyptian). I have 7 years of Node.js experience.',
          answers: [
            {
              question: 'Describe your scaling experience.',
              answer: 'Scaled TypeScript services to 50k RPS.',
            },
          ],
          consent: { sharedAt: new Date().toISOString(), version: 'v1.0-direct-apply' },
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const outcome = await analyzeApplicantAgainstJob({
          application: mockApp,
          job: mockJob,
          candidateName: 'Ahmed Al-Mansouri',
        });

        assert.ok(capturedPrompt.length > 50);
        for (const token of forbiddenTokens) {
          assert.equal(
            capturedPrompt.includes(token),
            false,
            `AI prompt must NOT contain sensitive demographic token: "${token}"`
          );
        }
        assert.ok(outcome.analysis.score > 0 && outcome.analysis.score <= 100);
        assert.ok(outcome.analysis.matchedSkills.includes('TypeScript'));
        assert.ok(outcome.analysis.strengths && outcome.analysis.strengths.length > 0);
        assert.ok(outcome.analysis.gaps && outcome.analysis.gaps.length > 0);
        assert.ok(
          outcome.analysis.interviewQuestions &&
            outcome.analysis.interviewQuestions.length > 0
        );
        assert.ok(outcome.analysis.scoreBreakdown);
        assert.ok(outcome.analysis.jobDescriptionHash);
      } finally {
        setCustomApplicantAiRunnerForTests(null);
      }
    });

    it('deducts HR credits atomically, caches by jobDescriptionHash, refunds on AI failure, and enforces IDOR protection', async () => {
      const { DataStore } = await import('../app/lib/datastore');
      const { setCustomApplicantAiRunnerForTests } = await import(
        '../lib/employer/analyzeApplicant'
      );
      const { POST: analyzeJobPOST } = await import(
        '../app/api/employer/jobs/[jobId]/analyze/route'
      );
      const { PATCH: employerAppPATCH } = await import(
        '../app/api/employer/applications/[applicationId]/route'
      );

      // 1. Setup Employer Org (with 5 HR credits) & a Rival Employer Org
      const hrOwner = await DataStore.createUserAccount({
        name: 'Analyze HR Owner',
        email: `hr_analyze_${Date.now()}@techcorp-ai.io`,
        password: 'password123',
      });
      const hrToken = signToken({
        userId: hrOwner.id,
        email: hrOwner.email,
        name: hrOwner.name,
        role: 'user',
      });

      const org = await DataStore.createOrganization(hrOwner.id, {
        name: 'TechCorp AI Hiring',
        website: 'https://techcorp-ai.io',
        country: 'EG',
        initialHrCredits: 5,
      });

      const rivalUser = await DataStore.createUserAccount({
        name: 'Rival HR',
        email: `rival_hr_${Date.now()}@rivalcorp.io`,
        password: 'password123',
      });
      const rivalToken = signToken({
        userId: rivalUser.id,
        email: rivalUser.email,
        name: rivalUser.name,
        role: 'user',
      });
      await DataStore.createOrganization(rivalUser.id, {
        name: 'Rival Corp',
        country: 'AE',
        initialHrCredits: 10,
      });

      // Create job & 2 applications
      const job = await DataStore.createEmployerJob(org.id, hrOwner.id, {
        title: 'Full Stack TypeScript Engineer',
        description:
          'Build modern web applications with TypeScript, React, Next.js, and Node.js.',
        requirements: ['3+ years TypeScript', 'React & Next.js'],
        skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Tailwind CSS'],
        remote: true,
        employmentType: 'full-time',
        seniority: 'mid',
        status: 'published',
      });

      const app1 = await DataStore.createApplication({
        jobId: job.id,
        candidateId: 'cand_analyze_1',
        resumeSnapshot: {
          fullName: 'Candidate One',
          headline: 'Senior React & TypeScript Developer',
          yearsOfExperience: 5,
          skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Tailwind CSS'],
          summary: '5 years building Next.js and TypeScript web applications.',
        },
        consent: { sharedAt: new Date().toISOString(), version: 'v1.0' },
      });

      const app2 = await DataStore.createApplication({
        jobId: job.id,
        candidateId: 'cand_analyze_2',
        resumeSnapshot: {
          fullName: 'Candidate Two',
          headline: 'Junior Frontend Developer',
          yearsOfExperience: 1,
          skills: ['React', 'Tailwind CSS'],
          summary: '1 year building UI components in React.',
        },
        consent: { sharedAt: new Date().toISOString(), version: 'v1.0' },
      });

      // 2. IDOR check: Rival HR cannot trigger analysis on org's job -> 403 FORBIDDEN
      const idorRes: any = await analyzeJobPOST(
        new NextRequest(`http://localhost:3000/api/employer/jobs/${job.id}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${rivalToken}`,
          },
          body: JSON.stringify({
            action: 'analyze_batch',
            applicationIds: [app1.id],
          }),
        }),
        { params: Promise.resolve({ jobId: job.id }) }
      );
      assert.equal(idorRes.status, 403);

      // 3. Batch analyze both applicants -> deducts 2 credits (5 -> 3)
      const batchRes1: any = await analyzeJobPOST(
        new NextRequest(`http://localhost:3000/api/employer/jobs/${job.id}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${hrToken}`,
          },
          body: JSON.stringify({
            action: 'analyze_batch',
            applicationIds: [app1.id, app2.id],
            onlyNew: false,
            force: false,
          }),
        }),
        { params: Promise.resolve({ jobId: job.id }) }
      );
      assert.equal(batchRes1.status, 200);
      const batchData1 = await batchRes1.json();
      assert.equal(batchData1.ok, true);
      assert.equal(batchData1.analyzedCount, 2);
      assert.equal(batchData1.cachedCount, 0);
      assert.equal(batchData1.creditsCharged, 2);
      assert.equal(batchData1.balanceAfter, 3);

      // 4. Re-running analysis without JD change -> cachedCount = 2, creditsCharged = 0!
      const batchResCached: any = await analyzeJobPOST(
        new NextRequest(`http://localhost:3000/api/employer/jobs/${job.id}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${hrToken}`,
          },
          body: JSON.stringify({
            action: 'analyze_batch',
            applicationIds: [app1.id, app2.id],
            onlyNew: false,
            force: false,
          }),
        }),
        { params: Promise.resolve({ jobId: job.id }) }
      );
      assert.equal(batchResCached.status, 200);
      const cachedData = await batchResCached.json();
      assert.equal(cachedData.cachedCount, 2);
      assert.equal(cachedData.analyzedCount, 0);
      assert.equal(cachedData.creditsCharged, 0);
      assert.equal(cachedData.balanceAfter, 3);

      // 5. Simulate AI failure on a new 3rd applicant -> verify atomic credit deduction is AUTOMATICALLY REFUNDED
      const app3 = await DataStore.createApplication({
        jobId: job.id,
        candidateId: 'cand_analyze_3',
        resumeSnapshot: {
          fullName: 'Candidate Three',
          skills: ['TypeScript', 'Node.js'],
          summary: 'Backend developer.',
        },
        consent: { sharedAt: new Date().toISOString(), version: 'v1.0' },
      });

      setCustomApplicantAiRunnerForTests(async () => {
        throw new Error('SIMULATED_AI_PROVIDER_OUTAGE');
      });

      try {
        const failRes: any = await analyzeJobPOST(
          new NextRequest(`http://localhost:3000/api/employer/jobs/${job.id}/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              origin: 'http://localhost:3000',
              Authorization: `Bearer ${hrToken}`,
            },
            body: JSON.stringify({
              action: 'analyze_batch',
              applicationIds: [app3.id],
              onlyNew: false,
              force: true,
            }),
          }),
          { params: Promise.resolve({ jobId: job.id }) }
        );
        assert.equal(failRes.status, 200);
        const failData = await failRes.json();
        assert.equal(failData.analyzedCount, 0);
        assert.equal(failData.refundedCredits, 1, 'Must refund 1 credit when AI fails');
        assert.equal(failData.creditsCharged, 0, 'Net credits charged must be 0 on failure');
        assert.equal(
          failData.balanceAfter,
          3,
          'Organization HR credit balance must be restored to 3 after refund'
        );

        const ledger = await DataStore.getHrCreditLedger(org.id, 20);
        const refundEntry = ledger.find(
          (entry: any) =>
            entry.reason === 'candidate_ai_analysis_refund' && entry.refId === app3.id
        );
        assert.ok(refundEntry, 'HrCreditLedger must record candidate_ai_analysis_refund');
        assert.equal(refundEntry?.delta, 1);
      } finally {
        setCustomApplicantAiRunnerForTests(null);
      }

      // 6. Update job description -> hash changes -> re-analyzing app1 now runs fresh analysis and charges 1 credit (3 -> 2)
      await DataStore.updateEmployerJob(job.id, org.id, hrOwner.id, {
        description:
          'Updated Job Description: Must also architect GraphQL federation and distributed event-driven systems.',
        skills: ['TypeScript', 'React', 'Next.js', 'GraphQL', 'Kafka'],
      });

      const reanalyzeAfterJdChange: any = await analyzeJobPOST(
        new NextRequest(`http://localhost:3000/api/employer/jobs/${job.id}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${hrToken}`,
          },
          body: JSON.stringify({
            action: 'analyze_batch',
            applicationIds: [app1.id],
            onlyNew: false,
            force: false,
          }),
        }),
        { params: Promise.resolve({ jobId: job.id }) }
      );
      const reanalyzeData = await reanalyzeAfterJdChange.json();
      assert.equal(reanalyzeData.analyzedCount, 1);
      assert.equal(reanalyzeData.cachedCount, 0);
      assert.equal(reanalyzeData.creditsCharged, 1);
      assert.equal(reanalyzeData.balanceAfter, 2);

      // 7. Manual Ranking & Top-10 Comparison Report (costs 2 credits: 2 -> 0)
      const rankPatchRes: any = await employerAppPATCH(
        new NextRequest(`http://localhost:3000/api/employer/applications/${app2.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${hrToken}`,
          },
          body: JSON.stringify({ manualRank: 1 }),
        }),
        { params: Promise.resolve({ applicationId: app2.id }) }
      );
      assert.equal(rankPatchRes.status, 200);

      const top10Res: any = await analyzeJobPOST(
        new NextRequest(`http://localhost:3000/api/employer/jobs/${job.id}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            origin: 'http://localhost:3000',
            Authorization: `Bearer ${hrToken}`,
          },
          body: JSON.stringify({ action: 'compare_top10' }),
        }),
        { params: Promise.resolve({ jobId: job.id }) }
      );
      assert.equal(top10Res.status, 200);
      const top10Data = await top10Res.json();
      assert.equal(top10Data.ok, true);
      assert.equal(top10Data.report.creditsUsed, 2);
      assert.equal(top10Data.balanceAfter, 0);
      assert.ok(top10Data.report);
      assert.equal(top10Data.report.candidates[0].applicationId, app2.id);
    });
  });

  // =========================================================================
  // 25. Employer Billing, 50/200/1000 HR Credit Packs, Webhook-Only Activation,
  //     Monthly Spend Cap / Low-Balance Alerts & Provider Refund Negative Balance
  // =========================================================================
  describe('25. Employer Billing, 50/200/1000 HR Credit Packs, Webhook-Only Activation, Spend Cap & Refund Negative Balance', () => {
    it('creates 50/200/1000 HR pack checkouts without instant activation, activates credits strictly via idempotent Lemon Squeezy webhook with amount/currency verification, enforces monthly spend cap & low-balance alerts, and allows provider refunds to drive balance negative (blocking usage until settled)', async () => {
      const {
        GET: billingGET,
        PUT: billingPUT,
        POST: billingPOST,
      } = await import('@/app/api/employer/billing/route');
      const { POST: jobsPOST } = await import('@/app/api/employer/jobs/route');

      const prevSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
      const prevAllowMock = process.env.ALLOW_MOCK_PAYMENTS;
      const prevVar50 = process.env.LEMONSQUEEZY_VARIANT_HR_50;
      const prevVar200 = process.env.LEMONSQUEEZY_VARIANT_HR_200;
      const prevVar1000 = process.env.LEMONSQUEEZY_VARIANT_HR_1000;

      const testWebhookSecret = 'ls_hr_pack_webhook_secret_2026';
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET = testWebhookSecret;
      process.env.ALLOW_MOCK_PAYMENTS = 'true';
      process.env.LEMONSQUEEZY_VARIANT_HR_50 = 'var_hr_50';
      process.env.LEMONSQUEEZY_VARIANT_HR_200 = 'var_hr_200';
      process.env.LEMONSQUEEZY_VARIANT_HR_1000 = 'var_hr_1000';

      try {
        clearAllRateLimits();

        // 1. Create Employer user + Organization (and a second user for IDOR checks)
        const billingOwner = await DataStore.createUserAccount({
          name: 'Billing Owner',
          email: `billing_owner_${Date.now()}@company-hr.io`,
          password: 'hashed_password',
          role: 'user',
          accountType: 'employer',
        });

        const outsiderUser = await DataStore.createUserAccount({
          name: 'Outsider User',
          email: `outsider_billing_${Date.now()}@other.io`,
          password: 'hashed_password',
          role: 'user',
          accountType: 'employer',
        });

        const ownerToken = signToken({
          userId: billingOwner.id,
          email: billingOwner.email,
          name: billingOwner.name,
        });
        const outsiderToken = signToken({
          userId: outsiderUser.id,
          email: outsiderUser.email,
          name: outsiderUser.name,
        });

        const org = await DataStore.createOrganization(billingOwner.id, {
          name: 'Apex Hiring Corp',
          website: 'https://company-hr.io',
          industry: 'Software',
          size: '51-200',
          country: 'UAE',
        });
        // Deduct initial 2 starter credits so we start from 0 for clean pack math
        if (org.hrCredits > 0) {
          await DataStore.deductHrCredits(
            org.id,
            org.hrCredits,
            'job_post_publish',
            'init_zero_reset',
            billingOwner.id
          );
        }
        const orgZero = await DataStore.getOrganizationById(org.id);
        assert.equal(orgZero?.hrCredits, 0, 'Organization starts at 0 HR credits for pack test');

        // 2. IDOR Protection: Outsider cannot GET, PUT, or POST for this organization
        const idorGet = await billingGET(
          new NextRequest(`http://localhost:3000/api/employer/billing?orgId=${org.id}`, {
            headers: { Authorization: `Bearer ${outsiderToken}` },
          })
        );
        assert.equal(idorGet.status, 403);

        const idorPut = await billingPUT(
          new NextRequest('http://localhost:3000/api/employer/billing', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              origin: 'http://localhost:3000',
              Authorization: `Bearer ${outsiderToken}`,
            },
            body: JSON.stringify({ orgId: org.id, monthlySpendCap: 100 }),
          })
        );
        assert.equal(idorPut.status, 403);

        const idorPost = await billingPOST(
          new NextRequest('http://localhost:3000/api/employer/billing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              origin: 'http://localhost:3000',
              Authorization: `Bearer ${outsiderToken}`,
            },
            body: JSON.stringify({ orgId: org.id, packId: 'hr_pack_50' }),
          })
        );
        assert.equal(idorPost.status, 403);

        // 3. Initiate checkout for hr_pack_50 ($29 USD = 50 credits)
        // Even with ALLOW_MOCK_PAYMENTS=true, HR packs MUST NOT auto-activate during checkout creation!
        const checkout50Res = await billingPOST(
          new NextRequest('http://localhost:3000/api/employer/billing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              origin: 'http://localhost:3000',
              Authorization: `Bearer ${ownerToken}`,
            },
            body: JSON.stringify({ orgId: org.id, packId: 'hr_pack_50' }),
          })
        );
        assert.equal(checkout50Res.status, 200);
        const checkout50Data = await checkout50Res.json();
        assert.equal(checkout50Data.ok, true);
        assert.equal(checkout50Data.packId, 'hr_pack_50');
        assert.equal(checkout50Data.credits, 50);
        assert.equal(checkout50Data.amountUsd, 29);
        assert.ok(checkout50Data.orderReference);

        const orgAfterCheckout = await DataStore.getOrganizationById(org.id);
        assert.equal(
          orgAfterCheckout?.hrCredits,
          0,
          'HR credits MUST NOT be activated on checkout creation — webhook activation only!'
        );

        // 4. Send Lemon Squeezy webhook with MISMATCHED amount (500 cents instead of 2900 cents) -> must reject 400
        const mismatchPayload = JSON.stringify({
          meta: {
            event_name: 'order_created',
            custom_data: {
              order_reference: checkout50Data.orderReference,
              user_id: billingOwner.id,
              plan_id: 'hr_pack_50',
              org_id: org.id,
            },
          },
          data: {
            id: `ls_hr_mismatch_${Date.now()}`,
            attributes: {
              status: 'paid',
              total: 500, // Wrong! Expected 2900 ($29.00)
              currency: 'USD',
              user_email: billingOwner.email,
            },
          },
        });
        const mismatchSig = crypto
          .createHmac('sha256', testWebhookSecret)
          .update(mismatchPayload)
          .digest('hex');

        const mismatchRes = await lemonSqueezyWebhookPOST(
          new NextRequest('http://localhost:3000/api/webhooks/lemonsqueezy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Signature': mismatchSig,
            },
            body: mismatchPayload,
          })
        );
        assert.equal(mismatchRes.status, 400);
        const mismatchData = await mismatchRes.json();
        assert.equal(mismatchData.error, 'AMOUNT_OR_CURRENCY_MISMATCH');

        // 5. Initiate checkout for hr_pack_200 ($99 USD = 200 credits) and activate via valid signed webhook
        const checkout200Res = await billingPOST(
          new NextRequest('http://localhost:3000/api/employer/billing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              origin: 'http://localhost:3000',
              Authorization: `Bearer ${ownerToken}`,
            },
            body: JSON.stringify({ orgId: org.id, packId: 'hr_pack_200' }),
          })
        );
        assert.equal(checkout200Res.status, 200);
        const checkout200Data = await checkout200Res.json();
        assert.equal(checkout200Data.credits, 200);
        assert.equal(checkout200Data.amountUsd, 99);

        const lsOrder200Id = `ls_hr_order_200_${Date.now()}`;
        const valid200Payload = JSON.stringify({
          meta: {
            event_name: 'order_created',
            custom_data: {
              order_reference: checkout200Data.orderReference,
              user_id: billingOwner.id,
              plan_id: 'hr_pack_200',
              org_id: org.id,
            },
          },
          data: {
            id: lsOrder200Id,
            attributes: {
              status: 'paid',
              total: 9900, // Exact match: $99.00 = 9900 cents
              currency: 'USD',
              user_email: billingOwner.email,
            },
          },
        });
        const valid200Sig = crypto
          .createHmac('sha256', testWebhookSecret)
          .update(valid200Payload)
          .digest('hex');

        const webhookActivateRes = await lemonSqueezyWebhookPOST(
          new NextRequest('http://localhost:3000/api/webhooks/lemonsqueezy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Signature': valid200Sig,
            },
            body: valid200Payload,
          })
        );
        assert.equal(webhookActivateRes.status, 200);
        const webhookActivateData = await webhookActivateRes.json();
        assert.equal(webhookActivateData.status, 'paid');
        assert.equal(webhookActivateData.duplicate, false);

        const orgAfterWebhook = await DataStore.getOrganizationById(org.id);
        assert.equal(
          orgAfterWebhook?.hrCredits,
          200,
          'Webhook must activate exactly 200 HR credits on the organization'
        );

        // 6. Idempotency: Re-sending the exact same webhook must not double-credit
        const dupRes = await lemonSqueezyWebhookPOST(
          new NextRequest('http://localhost:3000/api/webhooks/lemonsqueezy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Signature': valid200Sig,
            },
            body: valid200Payload,
          })
        );
        assert.equal(dupRes.status, 200);
        const dupData = await dupRes.json();
        assert.equal(dupData.duplicate, true);
        const orgAfterDup = await DataStore.getOrganizationById(org.id);
        assert.equal(orgAfterDup?.hrCredits, 200, 'Duplicate webhook must not add extra credits');

        // 7. Spend 160 credits (leaving 40 credits), then process a provider refund (`order_refunded`) for the 200-credit pack!
        //    Balance must drop by 200: 40 - 200 = -160 (Negative balance!)
        const spend160 = await DataStore.deductHrCredits(
          org.id,
          160,
          'candidate_ai_analysis',
          'bulk_analysis_160',
          billingOwner.id
        );
        assert.equal(spend160.success, true);
        assert.equal(spend160.balanceAfter, 40);

        const refund200Payload = JSON.stringify({
          meta: {
            event_name: 'order_refunded',
            custom_data: {
              order_reference: checkout200Data.orderReference,
              user_id: billingOwner.id,
              plan_id: 'hr_pack_200',
              org_id: org.id,
            },
          },
          data: {
            id: lsOrder200Id,
            attributes: {
              status: 'refunded',
              total: 9900,
              currency: 'USD',
              user_email: billingOwner.email,
            },
          },
        });
        const refund200Sig = crypto
          .createHmac('sha256', testWebhookSecret)
          .update(refund200Payload)
          .digest('hex');

        const refundWebhookRes = await lemonSqueezyWebhookPOST(
          new NextRequest('http://localhost:3000/api/webhooks/lemonsqueezy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Signature': refund200Sig,
            },
            body: refund200Payload,
          })
        );
        assert.equal(refundWebhookRes.status, 200);
        const refundWebhookData = await refundWebhookRes.json();
        assert.equal(refundWebhookData.status, 'refunded');

        const orgAfterRefund = await DataStore.getOrganizationById(org.id);
        assert.equal(
          orgAfterRefund?.hrCredits,
          -160,
          'Provider refund of 200-credit pack after spending 160 credits must result in -160 negative balance'
        );

        // 8. Verify negative balance (-160) strictly blocks HR credit usage (deductHrCredits & publishing jobs)
        const blockedDeduct = await DataStore.deductHrCredits(
          org.id,
          1,
          'job_post_publish',
          'job_blocked_test',
          billingOwner.id
        );
        assert.equal(blockedDeduct.success, false);
        assert.equal(blockedDeduct.error, 'INSUFFICIENT_HR_CREDITS');
        assert.equal(blockedDeduct.balanceAfter, -160);

        const blockedPublishRes = await jobsPOST(
          new NextRequest('http://localhost:3000/api/employer/jobs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              origin: 'http://localhost:3000',
              Authorization: `Bearer ${ownerToken}`,
            },
            body: JSON.stringify({
              orgId: org.id,
              title: 'Blocked Senior Backend Role',
              description: 'Testing negative balance blocking job publish until settled.',
              location: 'Dubai',
              publishNow: true,
            }),
          })
        );
        assert.equal(blockedPublishRes.status, 402);
        const blockedPublishData = await blockedPublishRes.json();
        assert.equal(blockedPublishData.error, 'INSUFFICIENT_HR_CREDITS');
        assert.equal(blockedPublishData.purchaseUrl, '/employer/billing');

        // Verify GET /api/employer/billing reports negativeBalanceBlocked = true and ledger contains the -200 refund
        const billingStateNegRes = await billingGET(
          new NextRequest(`http://localhost:3000/api/employer/billing?orgId=${org.id}`, {
            headers: { Authorization: `Bearer ${ownerToken}` },
          })
        );
        assert.equal(billingStateNegRes.status, 200);
        const billingStateNeg = await billingStateNegRes.json();
        assert.equal(billingStateNeg.negativeBalanceBlocked, true);
        assert.equal(billingStateNeg.organization.hrCredits, -160);
        assert.ok(
          billingStateNeg.ledger.some(
            (entry: any) => entry.reason === 'refund' && entry.delta === -200 && entry.balanceAfter === -160
          ),
          'Ledger must record -200 refund with balanceAfter -160'
        );

        // 9. Settle the negative balance by purchasing & webhook-activating another hr_pack_200 (-160 + 200 = +40)
        const settleOrder = await DataStore.createOrder({
          userId: billingOwner.id,
          userEmail: billingOwner.email,
          planId: 'hr_pack_200',
          billingCycle: 'once',
          baseAmount: 99,
          amount: 99,
          currency: 'USD',
          method: 'lemonsqueezy',
          reference: `ORD_SETTLE_${Date.now()}`,
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
          metadata: { orgId: org.id },
        });
        await DataStore.completeOrder(settleOrder.id, {
          provider: 'lemonsqueezy',
        });

        const orgSettled = await DataStore.getOrganizationById(org.id);
        assert.equal(orgSettled?.hrCredits, 40, 'Balance should be settled to +40 (-160 + 200)');

        // 10. Monthly Spend Cap & Low-Balance Alert Settings
        // Current monthlySpent is 162 (2 reset + 160 from step 7). Set monthlySpendCap to 167 and lowBalanceThreshold to 38.
        const settingsRes = await billingPUT(
          new NextRequest('http://localhost:3000/api/employer/billing', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              origin: 'http://localhost:3000',
              Authorization: `Bearer ${ownerToken}`,
            },
            body: JSON.stringify({
              orgId: org.id,
              monthlySpendCap: 167,
              lowBalanceThreshold: 38,
              lowBalanceAlertEnabled: true,
            }),
          })
        );
        assert.equal(settingsRes.status, 200);
        const settingsData = await settingsRes.json();
        assert.equal(settingsData.organization.monthlySpendCap, 167);
        assert.equal(settingsData.organization.lowBalanceThreshold, 38);

        // Deduct 3 credits -> monthlySpent becomes 165 (<= 167 cap), balance becomes 37 (<= 38 threshold -> triggers lowBalanceAlertTriggered!)
        const deductWithLowAlert = await DataStore.deductHrCredits(
          org.id,
          3,
          'candidate_ai_analysis',
          'app_low_alert_test',
          billingOwner.id
        );
        assert.equal(deductWithLowAlert.success, true);
        assert.equal(deductWithLowAlert.balanceAfter, 37);
        assert.equal(
          deductWithLowAlert.lowBalanceAlertTriggered,
          true,
          'Deducting down to 37 (<= threshold 38) must trigger low-balance alert'
        );

        // Attempt to deduct 5 more credits -> 165 + 5 = 170 > 167 monthlySpendCap -> blocked with MONTHLY_SPEND_CAP_EXCEEDED!
        const capExceededRes = await DataStore.deductHrCredits(
          org.id,
          5,
          'candidate_ai_analysis',
          'app_cap_exceeded_test',
          billingOwner.id
        );
        assert.equal(capExceededRes.success, false);
        assert.equal(capExceededRes.error, 'MONTHLY_SPEND_CAP_EXCEEDED');
        assert.equal(capExceededRes.balanceAfter, 37, 'Balance must remain 37 when monthly spend cap blocks deduction');
      } finally {
        if (prevSecret !== undefined) process.env.LEMONSQUEEZY_WEBHOOK_SECRET = prevSecret;
        else delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
        if (prevAllowMock !== undefined) process.env.ALLOW_MOCK_PAYMENTS = prevAllowMock;
        else delete process.env.ALLOW_MOCK_PAYMENTS;
        if (prevVar50 !== undefined) process.env.LEMONSQUEEZY_VARIANT_HR_50 = prevVar50;
        else delete process.env.LEMONSQUEEZY_VARIANT_HR_50;
        if (prevVar200 !== undefined) process.env.LEMONSQUEEZY_VARIANT_HR_200 = prevVar200;
        else delete process.env.LEMONSQUEEZY_VARIANT_HR_200;
        if (prevVar1000 !== undefined) process.env.LEMONSQUEEZY_VARIANT_HR_1000 = prevVar1000;
        else delete process.env.LEMONSQUEEZY_VARIANT_HR_1000;
      }
    });
  });

});

function oversizedReqBody(str: string): string {
  return str;
}

