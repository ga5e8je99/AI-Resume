import type { PartialProfileForCompletion } from './schema';
import type { UserProfileData } from './types';

export function calculateProfileCompletion(
  profile: Partial<UserProfileData> | PartialProfileForCompletion
): number {
  let score = 0;

  // 1. Full name (10%)
  if (typeof profile.fullName === 'string' && profile.fullName.trim().length >= 2) {
    score += 10;
  }

  // 2. Headline / Target Role (15%)
  const roleText = (profile.targetRole || profile.headline || '').trim();
  if (roleText.length >= 2) {
    score += 15;
  }

  // 3. Seniority (10%)
  if (profile.seniority) {
    score += 10;
  }

  // 4. Years of experience (10%)
  if (
    typeof profile.yearsOfExperience === 'number' &&
    Number.isFinite(profile.yearsOfExperience) &&
    profile.yearsOfExperience >= 0
  ) {
    score += 10;
  }

  // 5. Skills (15%: 10% for 1-2 skills, 15% for >= 3 skills)
  const skillsCount = Array.isArray(profile.skills)
    ? profile.skills.filter((s) => typeof s === 'string' && s.trim().length > 0).length
    : 0;
  if (skillsCount >= 3) {
    score += 15;
  } else if (skillsCount >= 1) {
    score += 10;
  }

  // 6. Industries (10%)
  const industriesCount = Array.isArray(profile.industries)
    ? profile.industries.filter((i) => typeof i === 'string' && i.trim().length > 0).length
    : 0;
  if (industriesCount >= 1) {
    score += 10;
  }

  // 7. Location: country or city (10%: 5% each)
  if (typeof profile.country === 'string' && profile.country.trim().length > 0) {
    score += 5;
  }
  if (typeof profile.city === 'string' && profile.city.trim().length > 0) {
    score += 5;
  }

  // 8. Work preferences: employmentTypes & remotePreference (10%)
  const empCount = Array.isArray(profile.employmentTypes) ? profile.employmentTypes.length : 0;
  if (empCount >= 1) {
    score += 5;
  }
  if (profile.remotePreference) {
    score += 5;
  }

  // 9. Languages (5%)
  const langCount = Array.isArray(profile.languages)
    ? profile.languages.filter((l) => typeof l === 'string' && l.trim().length > 0).length
    : 0;
  if (langCount >= 1) {
    score += 5;
  }

  // 10. Links / Contact / Salary details (5%)
  const hasLinks = Boolean(
    profile.links &&
      ((typeof profile.links.linkedin === 'string' && profile.links.linkedin.trim()) ||
        (typeof profile.links.github === 'string' && profile.links.github.trim()) ||
        (typeof profile.links.portfolio === 'string' && profile.links.portfolio.trim()))
  );
  const hasPhone = typeof profile.phone === 'string' && profile.phone.trim().length > 0;
  const hasSalary = Boolean(
    profile.expectedSalary &&
      (typeof profile.expectedSalary.min === 'number' ||
        typeof profile.expectedSalary.max === 'number')
  );
  if (hasLinks || hasPhone || hasSalary) {
    score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

