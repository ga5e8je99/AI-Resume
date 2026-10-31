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
import { signToken } from '@/app/lib/auth';
import { POST as extractProfilePOST } from '@/app/api/jobs/extract-profile/route';
import {
  buildCacheKey,
  stripUserMatchDataFromJob,
  setCachedJobResults,
  getCachedJobResults,
} from '@/lib/jobs/cache';
import { scoreJob, rankJobs } from '@/lib/jobs/matcher';
import { Job } from '@/lib/jobs/types';
import { POST as binanceWebhookPOST } from '@/app/api/webhooks/binance-pay/route';
import { applyRateLimit, clearAllRateLimits } from '@/lib/rate-limit';
import { POST as extractKeywordsPOST } from '@/app/api/cover-letter/extract-keywords/route';
import { POST as generateResumePOST } from '@/app/api/resume/generate/route';

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
        baseAmount: 4.99,
        amount: 4.99,
        currency: 'USDT',
        method: 'binance_pay',
        network: 'binance',
        reference: `ref_idem_${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const uniqueTxid = `0x${crypto.randomBytes(32).toString('hex')}`;

      // Concurrent completion calls on the same order
      const [res1, res2, res3] = await Promise.all([
        DataStore.completeOrder(order.id, { txid: uniqueTxid, actor: 'test' }),
        DataStore.completeOrder(order.id, { txid: uniqueTxid, actor: 'test' }),
        DataStore.completeOrder(order.id, { txid: uniqueTxid, actor: 'test' }),
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
      const res4 = await DataStore.completeOrder(order.id, { txid: uniqueTxid, actor: 'test' });
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
  // 3. txid uniqueness
  // =========================================================================
  describe('3. txid uniqueness & format validation', () => {
    it('prevents reusing the same TXID across different orders and validates BEP20/TRC20 formats', async () => {
      const user = await DataStore.createUserAccount({
        name: 'TXID Uniqueness Tester',
        email: `txid_${Date.now()}@test.com`,
        password: 'password123',
        plan: 'free',
        aiCredits: 1,
      });

      const orderA = await DataStore.createOrder({
        userId: user.id,
        userEmail: user.email,
        planId: 'pro',
        billingCycle: 'monthly',
        baseAmount: 8.99,
        amount: 8.99,
        currency: 'USDT',
        method: 'manual_crypto',
        network: 'BEP20',
        reference: `ref_txid_a_${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const orderB = await DataStore.createOrder({
        userId: user.id,
        userEmail: user.email,
        planId: 'pro',
        billingCycle: 'monthly',
        baseAmount: 8.99,
        amount: 8.99,
        currency: 'USDT',
        method: 'manual_crypto',
        network: 'BEP20',
        reference: `ref_txid_b_${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const sharedBep20Txid = `0x${crypto.randomBytes(32).toString('hex')}`;

      // Complete Order A with sharedBep20Txid
      const completeA = await DataStore.completeOrder(orderA.id, {
        txid: sharedBep20Txid,
        actor: 'test',
      });
      assert.equal(completeA.success, true);

      // Attempt to claim or complete Order B with the same TXID (even uppercase/padded)
      const claimB = await DataStore.claimOrderTxid(orderB.id, `  ${sharedBep20Txid.toUpperCase()}  `);
      assert.equal(claimB.success, false);
      assert.equal(claimB.error, 'TXID_ALREADY_USED');

      const completeB = await DataStore.completeOrder(orderB.id, {
        txid: sharedBep20Txid.toUpperCase(),
        actor: 'test',
      });
      assert.equal(completeB.success, false);
      assert.equal(completeB.error, 'TXID_ALREADY_USED');

      // Verify Order B remains unpaid
      const checkOrderB = await DataStore.findOrderById(orderB.id);
      assert.notEqual(checkOrderB?.status, 'paid');

      // Verify findOrderByTxid format validation
      const foundValid = await DataStore.findOrderByTxid(sharedBep20Txid, 'BEP20');
      assert.equal(foundValid?.id, orderA.id);

      const wrongNetworkLookup = await DataStore.findOrderByTxid(sharedBep20Txid, 'TRC20');
      assert.equal(wrongNetworkLookup, null, 'BEP20 0x-prefixed TXID must not match TRC20 format check');

      const malformedLookup = await DataStore.findOrderByTxid('not-a-valid-hex-txid');
      assert.equal(malformedLookup, null, 'Malformed TXID must return null');
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
  // 7. Binance webhook amount mismatch
  // =========================================================================
  describe('7. Binance Pay webhook amount & currency mismatch rejection', () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    function createSignedBinanceWebhookRequest(bodyObj: Record<string, any>): NextRequest {
      const rawBody = JSON.stringify(bodyObj);
      const timestamp = String(Date.now());
      const nonce = crypto.randomBytes(16).toString('hex');
      const payloadToSign = `${timestamp}\n${nonce}\n${rawBody}\n`;

      const signer = crypto.createSign('RSA-SHA256');
      signer.update(payloadToSign);
      signer.end();
      const signature = signer.sign(privateKey, 'base64');

      return new NextRequest('http://localhost:3000/api/webhooks/binance-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'binancepay-timestamp': timestamp,
          'binancepay-nonce': nonce,
          'binancepay-certificate-sn': 'test_cert_sn_2026',
          'binancepay-signature': signature,
        },
        body: rawBody,
      });
    }

    it('rejects underpaid and currency-mismatched Binance Pay webhooks with HTTP 400 and leaves order unpaid', async () => {
      const origPubKey = process.env.BINANCE_PAY_PUBLIC_KEY;
      process.env.BINANCE_PAY_PUBLIC_KEY = publicKey;

      try {
        const user = await DataStore.createUserAccount({
          name: 'Binance Webhook Tester',
          email: `binance_wh_${Date.now()}@test.com`,
          password: 'password123',
          plan: 'free',
          aiCredits: 1,
        });

        const reference = `jm_bpay_${Date.now()}`;
        const order = await DataStore.createOrder({
          userId: user.id,
          userEmail: user.email,
          planId: 'pro',
          billingCycle: 'monthly',
          baseAmount: 8.99,
          amount: 8.99,
          currency: 'USDT',
          method: 'binance_pay',
          network: 'binance',
          reference,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        // 1. Underpaid webhook (paid 4.50 USDT instead of expected 8.99 USDT) -> HTTP 400 AMOUNT_UNDERPAID
        const underpaidReq = createSignedBinanceWebhookRequest({
          bizType: 'PAY',
          bizStatus: 'PAY_SUCCESS',
          data: JSON.stringify({
            merchantTradeNo: reference,
            totalFee: '4.50',
            currency: 'USDT',
            transactionId: `bpay_tx_under_${Date.now()}`,
          }),
        });

        const underpaidRes = await binanceWebhookPOST(underpaidReq);
        assert.equal(underpaidRes.status, 400);
        const underpaidBody = await underpaidRes.json();
        assert.equal(underpaidBody.returnCode, 'FAIL');
        assert.equal(underpaidBody.returnMessage, 'AMOUNT_UNDERPAID');

        // Verify order was NOT marked paid
        const orderAfterUnderpaid = await DataStore.findOrderById(order.id);
        assert.notEqual(orderAfterUnderpaid?.status, 'paid');

        // 2. Currency mismatch webhook (paid 8.99 EUR instead of USDT) -> HTTP 400 CURRENCY_MISMATCH
        const wrongCurrencyReq = createSignedBinanceWebhookRequest({
          bizType: 'PAY',
          bizStatus: 'PAY_SUCCESS',
          data: JSON.stringify({
            merchantTradeNo: reference,
            totalFee: '8.99',
            currency: 'EUR',
            transactionId: `bpay_tx_curr_${Date.now()}`,
          }),
        });

        const wrongCurrencyRes = await binanceWebhookPOST(wrongCurrencyReq);
        assert.equal(wrongCurrencyRes.status, 400);
        const wrongCurrencyBody = await wrongCurrencyRes.json();
        assert.equal(wrongCurrencyBody.returnCode, 'FAIL');
        assert.equal(wrongCurrencyBody.returnMessage, 'CURRENCY_MISMATCH');

        // 3. Valid exact amount (8.99 USDT) -> HTTP 200 SUCCESS and order becomes 'paid'
        const validReq = createSignedBinanceWebhookRequest({
          bizType: 'PAY',
          bizStatus: 'PAY_SUCCESS',
          data: JSON.stringify({
            merchantTradeNo: reference,
            totalFee: '8.99',
            currency: 'USDT',
            transactionId: `0x${crypto.randomBytes(32).toString('hex')}`,
          }),
        });

        const validRes = await binanceWebhookPOST(validReq);
        assert.equal(validRes.status, 200);
        const validBody = await validRes.json();
        assert.equal(validBody.returnCode, 'SUCCESS');

        const orderAfterValid = await DataStore.findOrderById(order.id);
        assert.equal(orderAfterValid?.status, 'paid');
      } finally {
        if (origPubKey !== undefined) {
          process.env.BINANCE_PAY_PUBLIC_KEY = origPubKey;
        } else {
          delete process.env.BINANCE_PAY_PUBLIC_KEY;
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
  });
});

function oversizedReqBody(str: string): string {
  return str;
}

