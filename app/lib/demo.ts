import { AuthTokenPayload, isDemoUser } from './auth';

export const DEMO_USER_CONFIG = {
  id: 'usr_demo_jobmatch_guest',
  email: 'demo@jobmatch.ai',
  name: 'Alex Rivera (Demo)',
  role: 'user' as const,
  isDemo: true,
};

/**
 * Asserts that a user is NOT a demo account.
 * Returns { allowed: false, error } if user is a demo account.
 */
export function assertNonDemoUser(
  user: AuthTokenPayload | { email?: string; isDemo?: boolean } | null | undefined
): { allowed: boolean; error?: string } {
  if (isDemoUser(user)) {
    return {
      allowed: false,
      error: 'Demo accounts are in view-only exploration mode and cannot modify account credentials or consume paid quotas.',
    };
  }
  return { allowed: true };
}

/**
 * Returns false if the user is a demo account, meaning they cannot change email/password or delete account.
 */
export function canModifyAccount(
  user: AuthTokenPayload | { email?: string; isDemo?: boolean } | null | undefined
): boolean {
  return !isDemoUser(user);
}

/**
 * Asserts that an account operation (password change, email update, account deletion) is permitted.
 */
export function assertCanModifyAccount(
  user: AuthTokenPayload | { email?: string; isDemo?: boolean } | null | undefined
): { allowed: boolean; error?: string } {
  if (isDemoUser(user)) {
    return {
      allowed: false,
      error: 'Demo accounts cannot change email/password or delete the account.',
    };
  }
  return { allowed: true };
}

/**
 * Returns false if the user is a demo account, meaning they cannot consume paid credits/quotas.
 */
export function canConsumeCredits(
  user: AuthTokenPayload | { email?: string; isDemo?: boolean } | null | undefined
): boolean {
  return !isDemoUser(user);
}

/**
 * Asserts that paid credit consumption is permitted (rejects demo accounts).
 */
export function assertCanConsumeCredits(
  user: AuthTokenPayload | { email?: string; isDemo?: boolean } | null | undefined
): { allowed: boolean; error?: string } {
  if (isDemoUser(user)) {
    return {
      allowed: false,
      error: 'Demo accounts cannot consume paid credits or subscription quotas.',
    };
  }
  return { allowed: true };
}

export { isDemoUser };

