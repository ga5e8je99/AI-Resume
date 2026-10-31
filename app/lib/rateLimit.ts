export {
  getClientIp,
  checkRateLimit,
  checkRateLimitAsync,
  applyRateLimit,
  parseBoundedJsonBody,
  DEFAULT_MAX_AI_BODY_BYTES,
  DEFAULT_MAX_AI_INPUT_CHARS,
  resetRateLimit,
  clearAllRateLimits,
} from '@/lib/rate-limit';

export type {
  RateLimitConfig,
  RateLimitCheckResult,
  RateLimitResponse,
} from '@/lib/rate-limit';
