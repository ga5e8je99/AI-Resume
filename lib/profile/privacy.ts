import type { RedactedUserProfile, UserProfileData } from './types';

/**
 * Enforces strict field-level privacy on a user profile:
 * - Sensitive fields (`expectedSalary`, `phone`) are NEVER exposed to any viewer
 *   other than the profile owner (`viewerUserId === profile.userId`), unless the
 *   owner has given explicit opt-in consent (`expectedSalary.visible === true`
 *   for salary, `phoneVisible === true` for phone).
 */
export function formatProfileForViewer(
  profile: UserProfileData,
  viewerUserId?: string | null
): RedactedUserProfile {
  const isOwner = Boolean(
    viewerUserId &&
      profile.userId &&
      String(viewerUserId).trim() === String(profile.userId).trim()
  );

  if (isOwner) {
    return {
      ...profile,
      expectedSalary: {
        min: profile.expectedSalary?.min ?? null,
        max: profile.expectedSalary?.max ?? null,
        currency: profile.expectedSalary?.currency || 'USD',
        visible: Boolean(profile.expectedSalary?.visible),
      },
      phone: profile.phone || '',
      phoneVisible: Boolean(profile.phoneVisible),
      isOwner: true,
    };
  }

  const salaryConsent = Boolean(profile.expectedSalary?.visible === true);
  const phoneConsent = Boolean(profile.phoneVisible === true);

  return {
    userId: profile.userId,
    fullName: profile.fullName,
    headline: profile.headline,
    targetRole: profile.targetRole,
    seniority: profile.seniority,
    yearsOfExperience: profile.yearsOfExperience,
    industries: profile.industries,
    skills: profile.skills,
    country: profile.country,
    city: profile.city,
    willingToRelocate: profile.willingToRelocate,
    remotePreference: profile.remotePreference,
    employmentTypes: profile.employmentTypes,
    expectedSalary: salaryConsent
      ? {
          min: profile.expectedSalary?.min ?? null,
          max: profile.expectedSalary?.max ?? null,
          currency: profile.expectedSalary?.currency || 'USD',
          visible: true,
        }
      : null,
    languages: profile.languages,
    phone: phoneConsent && profile.phone ? profile.phone : null,
    links: profile.links,
    avatar: profile.avatar,
    profileCompletion: profile.profileCompletion,
    onboardingCompletedAt: profile.onboardingCompletedAt,
    onboardingSkippedAt: profile.onboardingSkippedAt ?? null,
    isOwner: false,
  };
}

