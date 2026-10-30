import type { IUser, UserPlan } from '@/app/models/User';

export interface UserEntitlements {
  isPro: boolean;
  creditsLeft: number;
  unlimited: boolean;
}

export interface MinimalUserForEntitlements {
  plan?: string | null;
  aiCredits?: number | null;
  planExpiresAt?: Date | string | null;
  [key: string]: any;
}

/**
 * Calculates user subscription entitlements and remaining AI generation credits.
 * 
 * Rules:
 * - 'pro' or 'enterprise' plans grant unlimited AI generations and isPro = true.
 * - An expired plan (planExpiresAt is set and <= Date.now()) is downgraded to 'free'.
 * - 'free' plan users have limited numeric credits (defaulting to 3, clamped at 0).
 */
export function getUserEntitlements(
  user?: MinimalUserForEntitlements | IUser | null
): UserEntitlements {
  if (!user) {
    return {
      isPro: false,
      creditsLeft: 0,
      unlimited: false,
    };
  }

  const rawPlan = (user.plan || 'free').toLowerCase();
  const rawCredits = typeof user.aiCredits === 'number' ? user.aiCredits : 3;

  // Check if plan has expired
  let isExpired = false;
  if (user.planExpiresAt) {
    const expiryDate = new Date(user.planExpiresAt);
    if (!isNaN(expiryDate.getTime()) && expiryDate.getTime() <= Date.now()) {
      isExpired = true;
    }
  }

  // If expired, downgrade to 'free'
  const effectivePlan: UserPlan = isExpired ? 'free' : (rawPlan as UserPlan);

  // Pro or Enterprise active plan provides unlimited AI generations
  const isPro = effectivePlan === 'pro' || effectivePlan === 'enterprise';
  const unlimited = isPro;

  // Pro/Enterprise users get Infinity creditsLeft; free users get their remaining numeric balance
  const creditsLeft = unlimited ? Infinity : Math.max(0, rawCredits);

  return {
    isPro,
    creditsLeft,
    unlimited,
  };
}

export default getUserEntitlements;
