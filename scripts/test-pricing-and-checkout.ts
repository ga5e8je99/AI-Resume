import { PLANS, getPlanById, formatPrice } from '../lib/plans';
import { startCheckout, toInternalPath } from '../lib/checkout-client';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✔ ${msg}`);
}

async function runPricingTests() {
  console.log('============================================================');
  console.log('>>> RUNNING PRICING CONFIG & CHECKOUT TEST SUITE <<<');
  console.log('============================================================\n');

  // Test 1: Verify all 3 plans are defined
  console.log('▶ [Test 1] Plan catalog completeness');
  assert(PLANS.length === 3, 'Exactly 3 plans configured (Free, Pro, PAYG)');
  const freePlan = getPlanById('free');
  const proPlan = getPlanById('pro');
  const paygPlan = getPlanById('payg');
  assert(!!freePlan, 'Free plan exists');
  assert(!!proPlan, 'Pro plan exists');
  assert(!!paygPlan, 'Pay-As-You-Go plan exists');

  // Test 2: Free Plan Details
  console.log('\n▶ [Test 2] Free Plan specifications');
  assert(freePlan!.credits === 3, 'Free plan provides 3 initial credits');
  assert(freePlan!.pricing.USD.monthly === 0, 'Free plan is $0');
  assert(freePlan!.features.some(f => f.text.en.includes('ATS scan')), 'Free plan includes free ATS scan');
  assert(freePlan!.features.some(f => f.text.en.includes('templates')), 'Free plan includes basic templates');

  // Test 3: Pro Plan Details
  console.log('\n▶ [Test 3] Pro Plan pricing and savings');
  assert(proPlan!.popular === true, 'Pro plan marked as Most Popular');
  assert(proPlan!.credits === 'unlimited', 'Pro plan gives unlimited AI generations');
  assert(proPlan!.pricing.USD.monthly === 9, 'Pro USD monthly is $9/month');
  assert(proPlan!.pricing.EGP.monthly === 350, 'Pro EGP monthly is 350 EGP/month');
  assert(proPlan!.pricing.USD.annualMonthly === 7, 'Pro USD annual monthly equivalent is $7/month');
  assert(proPlan!.pricing.USD.annualTotal === 84, 'Pro USD annual total is $84/year');
  assert(proPlan!.pricing.USD.savingsPercentage === 22, 'Pro USD annual saves 22%');
  assert(proPlan!.pricing.EGP.annualMonthly === 275, 'Pro EGP annual monthly equivalent is 275 EGP/month');
  assert(proPlan!.pricing.EGP.annualTotal === 3300, 'Pro EGP annual total is 3300 EGP/year');
  assert(proPlan!.pricing.EGP.savingsPercentage === 22, 'Pro EGP annual saves 22%');
  assert(proPlan!.features.some(f => f.text.en.includes('Word (.docx)') && f.text.en.includes('PDF')), 'Pro includes Word + PDF exports');
  assert(proPlan!.features.some(f => f.text.en.includes('Priority')), 'Pro includes priority support');

  // Test 4: Pay-As-You-Go Details
  console.log('\n▶ [Test 4] Pay-As-You-Go specifications');
  assert(paygPlan!.credits === 15, 'PAYG provides 15 credits');
  assert(paygPlan!.pricing.USD.oneTime === 5, 'PAYG is $5 for 15 credits');
  assert(paygPlan!.pricing.EGP.oneTime === 199, 'PAYG is 199 EGP for 15 credits');
  assert(paygPlan!.features.some(f => f.text.en.includes('expire')), 'PAYG highlights credits never expire');

  // Test 5: Currency Formatting
  console.log('\n▶ [Test 5] Currency formatting');
  assert(formatPrice(9, 'USD', 'en') === '$9', 'USD formatting: $9');
  assert(formatPrice(299, 'EGP', 'en') === '299 EGP', 'EGP formatting EN: 299 EGP');
  assert(formatPrice(299, 'EGP', 'ar') === '299 ج.م', 'EGP formatting AR: 299 ج.م');

  // Test 6: Checkout Client Error Differentiation (No "coming soon")
  console.log('\n▶ [Test 6] Checkout client error differentiation');
  const res503 = await startCheckout('pro', {
    language: 'ar',
    customFetch: (async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: 'PROVIDER_NOT_CONFIGURED' }),
    })) as any,
  });
  assert(res503.errorCode === 'PROVIDER_NOT_CONFIGURED', '503 maps to PROVIDER_NOT_CONFIGURED');
  assert(
    res503.message === 'الطريقة دي مش متاحة حالياً، جرّب طريقة تانية',
    '503 returns Arabic unavailable provider message'
  );
  assert((res503 as any).comingSoon === undefined, 'Never sets comingSoon flag');

  const resNet = await startCheckout('pro', {
    language: 'ar',
    customFetch: (async () => {
      throw new Error('Failed to fetch');
    }) as any,
  });
  assert(resNet.errorCode === 'NETWORK_ERROR', 'Fetch rejection maps to NETWORK_ERROR');
  assert(resNet.canRetry === true, 'NETWORK_ERROR enables retry');
  assert(resNet.message === 'مشكلة في الاتصال، حاول تاني', 'NETWORK_ERROR returns Arabic message');

  let navigatedPath = '';
  const res401 = await startCheckout('pro', {
    language: 'ar',
    onNavigate: (p) => {
      navigatedPath = p;
    },
    customFetch: (async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: 'UNAUTHORIZED' }),
    })) as any,
  });
  assert(res401.errorCode === 'UNAUTHENTICATED', '401 maps to UNAUTHENTICATED');
  assert(navigatedPath === '/login?redirect=%2Fpricing', '401 navigates to login with return URL to /pricing');

  const res500 = await startCheckout('pro', {
    language: 'ar',
    customFetch: (async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'CHECKOUT_ERROR' }),
    })) as any,
  });
  assert(res500.errorCode === 'CHECKOUT_FAILED', '500 maps to CHECKOUT_FAILED');
  assert(!res500.message?.toLowerCase().includes('coming soon'), 'Never hides error under coming soon');

  assert(toInternalPath('/payment/crypto?reference=ORD-1') === '/payment/crypto?reference=ORD-1', 'Detects relative internal path');
  assert(toInternalPath('https://checkout.stripe.com/c/pay/cs_123') === null, 'Detects external Stripe URL');

  console.log('\n============================================================');
  console.log('>>> ALL PRICING CONFIG & CHECKOUT CLIENT CHECKS PASSED! <<<');
  console.log('============================================================');
}

runPricingTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
