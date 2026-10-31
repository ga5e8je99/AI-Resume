import type { IUser, UserPlan } from '@/app/models/User';

export const PRO_EXPIRY_WARNING_DAYS = 3;

export interface UserEntitlements {
  isPro: boolean;
  creditsLeft: number;
  unlimited: boolean;
  proExpiresAt?: string | null;
  daysRemaining?: number | null;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
}

export interface MinimalUserForEntitlements {
  plan?: string | null;
  aiCredits?: number | null;
  planExpiresAt?: Date | string | null;
  proExpiresAt?: Date | string | null;
  paymentProvider?: string | null;
  [key: string]: any;
}

/**
 * Calculates user subscription entitlements and remaining AI generation credits.
 *
 * Rules:
 * - 'pro' or 'enterprise' plans grant unlimited AI generations and isPro = true.
 * - An expired plan (proExpiresAt / planExpiresAt is set and <= Date.now()) is downgraded to 'free'.
 * - Flags `isExpiringSoon = true` when a Pro subscription expires within 3 days.
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
      proExpiresAt: null,
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
    };
  }

  const rawPlan = (user.plan || 'free').toLowerCase();
  const rawCredits = typeof user.aiCredits === 'number' ? user.aiCredits : 3;

  // Check if plan has expired (supports both proExpiresAt and planExpiresAt)
  const rawExpiry = user.proExpiresAt ?? user.planExpiresAt ?? null;
  let isExpired = false;
  let proExpiresAtIso: string | null = null;
  let daysRemaining: number | null = null;

  if (rawExpiry) {
    const expiryDate = new Date(rawExpiry);
    if (!isNaN(expiryDate.getTime())) {
      proExpiresAtIso = expiryDate.toISOString();
      const diffMs = expiryDate.getTime() - Date.now();
      if (diffMs <= 0) {
        isExpired = true;
        daysRemaining = 0;
      } else {
        daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      }
    }
  }

  // If expired, downgrade to 'free'
  const effectivePlan: UserPlan = isExpired ? 'free' : (rawPlan as UserPlan);

  // Pro or Enterprise active plan provides unlimited AI generations
  const isPro = effectivePlan === 'pro' || effectivePlan === 'enterprise';
  const unlimited = isPro;

  // Warn 3 days before expiration
  const isExpiringSoon =
    isPro &&
    !isExpired &&
    daysRemaining !== null &&
    daysRemaining <= PRO_EXPIRY_WARNING_DAYS;

  // Pro/Enterprise users get Infinity creditsLeft; free users get their remaining numeric balance
  const creditsLeft = unlimited ? Infinity : Math.max(0, rawCredits);

  return {
    isPro,
    creditsLeft,
    unlimited,
    proExpiresAt: proExpiresAtIso,
    daysRemaining,
    isExpiringSoon,
    isExpired,
  };
}

export default getUserEntitlements;
