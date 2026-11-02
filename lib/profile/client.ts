'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RedactedUserProfile } from './types';
import type { ProfileUpdateInput } from './schema';

let cachedProfile: RedactedUserProfile | null = null;
let cachedUserId: string | null = null;

export function clearCachedUserProfile() {
  cachedProfile = null;
  cachedUserId = null;
}

export function setCachedUserProfile(profile: RedactedUserProfile | null) {
  cachedProfile = profile;
  cachedUserId = profile?.userId || null;
}

export async function fetchUserProfileClient(
  forceRefresh = false,
  expectedUserId?: string | null
): Promise<RedactedUserProfile | null> {
  if (
    !forceRefresh &&
    cachedProfile &&
    (!expectedUserId || cachedUserId === expectedUserId)
  ) {
    return cachedProfile;
  }

  try {
    const res = await fetch('/api/profile', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.ok && data?.profile) {
      cachedProfile = data.profile as RedactedUserProfile;
      cachedUserId = cachedProfile.userId;
      return cachedProfile;
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateUserProfileClient(
  payload: ProfileUpdateInput
): Promise<{ ok: boolean; profile?: RedactedUserProfile; error?: string }> {
  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return {
        ok: false,
        error: data?.message || data?.error || 'Failed to save profile',
      };
    }
    if (data.profile) {
      cachedProfile = data.profile as RedactedUserProfile;
      cachedUserId = cachedProfile.userId;
    }
    return { ok: true, profile: data.profile };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

export async function skipUserOnboardingClient(): Promise<{
  ok: boolean;
  profile?: RedactedUserProfile;
  error?: string;
}> {
  try {
    const res = await fetch('/api/profile/skip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'user_skipped' }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return {
        ok: false,
        error: data?.message || data?.error || 'Failed to skip onboarding',
      };
    }
    if (data.profile) {
      cachedProfile = data.profile as RedactedUserProfile;
      cachedUserId = cachedProfile.userId;
    }
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('jobmatch_onboarding_skipped', '1');
      } catch {
        // Ignore sessionStorage restrictions
      }
    }
    return { ok: true, profile: data.profile };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

export function resolveCountryCodeFromProfile(country?: string, city?: string): string {
  const combined = `${country || ''} ${city || ''}`.toLowerCase();
  if (/egypt|مصر|cairo|القاهرة|alexandria|الإسكندرية|giza|الجيزة/.test(combined)) return 'eg';
  if (/saudi|السعودية|riyadh|الرياض|jeddah|جدة|dammam/.test(combined)) return 'sa';
  if (/uae|الإمارات|إمارات|dubai|دبي|abu dhabi|أبوظبي|sharjah/.test(combined)) return 'ae';
  if (/united states|usa|أمريكا|new york|california|texas|austin/.test(combined)) return 'us';
  if (/germany|ألمانيا|deutschland|berlin|munich|frankfurt/.test(combined)) return 'de';
  if (/united kingdom|\buk\b|بريطانيا|london|manchester/.test(combined)) return 'gb';
  if (/france|فرنسا|paris|lyon/.test(combined)) return 'fr';
  if (/spain|إسبانيا|españa|madrid|barcelona/.test(combined)) return 'es';
  if (/turkey|türkiye|تركيا|istanbul|ankara/.test(combined)) return 'tr';
  return 'eg';
}

export function useUserProfile(userId?: string | null) {
  const [profile, setProfile] = useState<RedactedUserProfile | null>(() =>
    userId && cachedUserId === userId ? cachedProfile : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(userId && !profile));

  const reload = useCallback(
    async (force = true) => {
      if (!userId) {
        setProfile(null);
        setIsLoading(false);
        return null;
      }
      setIsLoading(true);
      const data = await fetchUserProfileClient(force, userId);
      setProfile(data);
      setIsLoading(false);
      return data;
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchUserProfileClient(false, userId).then((data) => {
      if (active) {
        setProfile(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [userId]);

  return {
    profile: userId ? profile : null,
    setProfile,
    isLoading: userId ? isLoading : false,
    reload,
  };
}
