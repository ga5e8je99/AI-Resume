import mongoose from 'mongoose';
import JobCache from '@/app/models/JobCache';
import DataStore, { isMongoAvailable } from '@/app/lib/datastore';
import { JobSearchParams } from './types';

const CACHE_TTL_HOURS = 6;

/**
 * Builds a normalized, unique cache key from search parameters
 */
export function buildCacheKey(params: JobSearchParams): string {
  const q = (params.query || '').toLowerCase().trim();
  const loc = (params.location || '').toLowerCase().trim();
  const rem = params.remote ? 'remote' : 'all';
  const c = (params.country || 'global').toLowerCase().trim();
  return `job_search:${q}:${loc}:${rem}:${c}`;
}

/**
 * Retrieves cached job search results if present and unexpired (< 6h)
 */
export async function getCachedJobResults(params: JobSearchParams): Promise<any | null> {
  const cacheKey = buildCacheKey(params);

  // 1. Try MongoDB
  const mongoUp = await isMongoAvailable();
  if (mongoUp) {
    try {
      const entry = await JobCache.findOne({ cacheKey }).lean();
      if (entry && entry.data) {
        if (new Date(entry.expiresAt).getTime() > Date.now()) {
          return entry.data;
        }
      }
    } catch {}
  }

  // 2. Fall back to DataStore
  try {
    return await DataStore.getJobCache(cacheKey);
  } catch {
    return null;
  }
}

/**
 * Stores job search results in cache with 6-hour expiration
 */
export async function setCachedJobResults(params: JobSearchParams, data: any): Promise<void> {
  const cacheKey = buildCacheKey(params);
  const now = Date.now();
  const expiresAt = new Date(now + CACHE_TTL_HOURS * 3600 * 1000);

  // 1. Try MongoDB
  const mongoUp = await isMongoAvailable();
  if (mongoUp) {
    try {
      await JobCache.findOneAndUpdate(
        { cacheKey },
        {
          cacheKey,
          query: params.query || '',
          location: params.location || '',
          remote: Boolean(params.remote),
          country: params.country || 'global',
          data,
          expiresAt,
        },
        { upsert: true, new: true }
      );
      return;
    } catch {}
  }

  // 2. Fall back to DataStore
  try {
    await DataStore.setJobCache(cacheKey, data, CACHE_TTL_HOURS);
  } catch {}
}
