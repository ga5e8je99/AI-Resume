import { PLANS, getPlanById, formatPrice } from '../lib/plans';

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
  assert(proPlan!.pricing.EGP.monthly === 150, 'Pro EGP monthly is 150 EGP/month');
  assert(proPlan!.pricing.USD.annualMonthly === 7, 'Pro USD annual monthly equivalent is $7/month');
  assert(proPlan!.pricing.USD.annualTotal === 84, 'Pro USD annual total is $84/year');
  assert(proPlan!.pricing.USD.savingsPercentage === 22, 'Pro USD annual saves 22%');
  assert(proPlan!.pricing.EGP.annualMonthly === 116, 'Pro EGP annual monthly equivalent is 116 EGP/month');
  assert(proPlan!.pricing.EGP.annualTotal === 1400, 'Pro EGP annual total is 1400 EGP/year');
  assert(proPlan!.pricing.EGP.savingsPercentage === 22, 'Pro EGP annual saves 22%');
  assert(proPlan!.features.some(f => f.text.en.includes('watermark')), 'Pro includes watermark-free Word + PDF');
  assert(proPlan!.features.some(f => f.text.en.includes('Priority')), 'Pro includes priority support');

  // Test 4: Pay-As-You-Go Details
  console.log('\n▶ [Test 4] Pay-As-You-Go specifications');
  assert(paygPlan!.credits === 15, 'PAYG provides 15 credits');
  assert(paygPlan!.pricing.USD.oneTime === 3, 'PAYG is $3 for 15 credits');
  assert(paygPlan!.pricing.EGP.oneTime === 90, 'PAYG is 90 EGP for 15 credits');
  assert(paygPlan!.features.some(f => f.text.en.includes('expire')), 'PAYG highlights credits never expire');

  // Test 5: Currency Formatting
  console.log('\n▶ [Test 5] Currency formatting');
  assert(formatPrice(9, 'USD', 'en') === '$9', 'USD formatting: $9');
  assert(formatPrice(150, 'EGP', 'en') === '150 EGP', 'EGP formatting EN: 150 EGP');
  assert(formatPrice(150, 'EGP', 'ar') === '150 ج.م', 'EGP formatting AR: 150 ج.م');

  console.log('\n============================================================');
  console.log('>>> ALL PRICING CONFIG CHECKS PASSED! <<<');
  console.log('============================================================');
}

runPricingTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
