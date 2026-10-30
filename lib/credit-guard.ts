import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/app/models/User';
import DataStore, { isMongoAvailable } from '@/app/lib/datastore';
import { getUserEntitlements } from '@/lib/credits';
import { applyRateLimit } from '@/app/lib/rateLimit';
import { RESUME_GENERATION_CREDIT_COST, JOB_MATCH_CREDIT_COST } from './plans';

export interface CreditOptions {
  cost?: number;
  feature?: 'cover_letter' | 'resume_generation' | 'job_match';
}

export interface CreditCheckResult {
  allowed: boolean;
  isDemo: boolean;
  unlimited: boolean;
  creditsLeft: number;
  errorResponse?: NextResponse;
}

export interface CreditConsumeResult {
  success: boolean;
  remaining: number;
  deducted: boolean;
  error?: string;
}

/**
 * Checks whether the given user has sufficient AI generation credits or an active Pro plan.
 * 
 * Rules:
 * - Pro/enterprise active plan -> unlimited, no deduction required.
 * - Demo users (isDemo) -> never charged, protected by a 30 req/hour rate limit.
 * - Free users -> requires aiCredits > 0, returns HTTP 402 with { error: "NO_CREDITS", upgradeUrl: "/pricing" } if exhausted.
 */
export async function requireCredits(
  userId: string,
  req?: NextRequest,
  options?: CreditOptions
): Promise<CreditCheckResult> {
  if (!userId) {
    return {
      allowed: false,
      isDemo: false,
      unlimited: false,
      creditsLeft: 0,
      errorResponse: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  // 1. Fetch user from DB (MongoDB or Local DataStore)
  let user: any = null;
  const mongoUp = await isMongoAvailable();
  if (mongoUp) {
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId).lean();
      }
    } catch {}
  }

  if (!user) {
    user = await DataStore.findUserById(userId);
  }

  if (!user) {
    // Ephemeral or test token with verified signature: grant default 3 free credits
    return {
      allowed: true,
      isDemo: false,
      unlimited: false,
      creditsLeft: 3,
    };
  }

  // 2. Demo User Guard: Demo users are never charged, protected by per-hour rate limit
  if (user.isDemo) {
    if (req) {
      const demoRateLimit = applyRateLimit(
        req,
        { limit: 30, windowMs: 60 * 60 * 1000, keyPrefix: 'demo_ai' },
        userId
      );
      if (!demoRateLimit.allowed && demoRateLimit.errorResponse) {
        return {
          allowed: false,
          isDemo: true,
          unlimited: false,
          creditsLeft: 0,
          errorResponse: NextResponse.json(
            {
              error: 'DEMO_RATE_LIMIT',
              message: 'Hourly demo limit reached. Please register a free account to continue.',
            },
            { status: 429 }
          ),
        };
      }
    }

    return {
      allowed: true,
      isDemo: true,
      unlimited: true,
      creditsLeft: Infinity,
    };
  }

  // 3. Entitlement check (Pro vs Free)
  const entitlements = getUserEntitlements(user);

  if (entitlements.unlimited || entitlements.isPro) {
    return {
      allowed: true,
      isDemo: false,
      unlimited: true,
      creditsLeft: Infinity,
    };
  }

  // 4. Feature-specific rules (Resume Generation vs Cover Letter)
  const currentCredits = typeof user.aiCredits === 'number' ? user.aiCredits : 3;

  if (options?.feature === 'resume_generation') {
    const cost = options.cost ?? RESUME_GENERATION_CREDIT_COST;
    const resumeGensCount = typeof user.aiResumeGenerationsCount === 'number' ? user.aiResumeGenerationsCount : 0;

    // Free tier gets 1 AI resume/CV generation total (taste)
    if (resumeGensCount < 1) {
      return {
        allowed: true,
        isDemo: false,
        unlimited: false,
        creditsLeft: currentCredits,
      };
    }

    // Free taste already consumed: requires pay-as-you-go credits (at least cost credits)
    if (currentCredits < cost) {
      return {
        allowed: false,
        isDemo: false,
        unlimited: false,
        creditsLeft: currentCredits,
        errorResponse: NextResponse.json(
          {
            error: 'NO_CREDITS',
            upgradeUrl: '/pricing',
            message: 'You have used your 1 free AI resume generation. Upgrade to Pro for unlimited generations or purchase Pay-As-You-Go credits.',
          },
          { status: 402 }
        ),
      };
    }

    return {
      allowed: true,
      isDemo: false,
      unlimited: false,
      creditsLeft: currentCredits,
    };
  }

  if (options?.feature === 'job_match') {
    const cost = options.cost ?? JOB_MATCH_CREDIT_COST;
    const jobMatchFreeUsed = typeof user.jobMatchFreeUsed === 'number' ? user.jobMatchFreeUsed : 0;

    // Free tier gets 3 free Job Match searches total
    if (jobMatchFreeUsed < 3) {
      return {
        allowed: true,
        isDemo: false,
        unlimited: false,
        creditsLeft: 3 - jobMatchFreeUsed,
      };
    }

    // Free quota exhausted: requires pay-as-you-go credits (at least 1 credit)
    if (currentCredits < cost) {
      return {
        allowed: false,
        isDemo: false,
        unlimited: false,
        creditsLeft: currentCredits,
        errorResponse: NextResponse.json(
          {
            error: 'NO_CREDITS',
            upgradeUrl: '/pricing',
            message: 'You have used all 3 free Job Match searches. Upgrade to Pro for unlimited searches or purchase Pay-As-You-Go credits.',
            jobMatchFreeUsed,
          },
          { status: 402 }
        ),
      };
    }

    return {
      allowed: true,
      isDemo: false,
      unlimited: false,
      creditsLeft: currentCredits,
    };
  }

  // Default: Free plan cover letters require aiCredits > 0
  if (currentCredits <= 0) {
    return {
      allowed: false,
      isDemo: false,
      unlimited: false,
      creditsLeft: 0,
      errorResponse: NextResponse.json(
        {
          error: 'NO_CREDITS',
          upgradeUrl: '/pricing',
          message: 'You have exhausted your free AI generation credits. Upgrade to Pro for unlimited generations.',
        },
        { status: 402 }
      ),
    };
  }

  return {
    allowed: true,
    isDemo: false,
    unlimited: false,
    creditsLeft: currentCredits,
  };
}

/**
 * Deducts credit ONLY after successful AI generation.
 * For resume generation:
 * - Free user on 1st generation (taste): increments generation count without consuming credits.
 * - Free user on subsequent generations: consumes `cost` (default 2) credits atomically.
 * Pro / Enterprise users and Demo users are never deducted.
 */
export async function consumeCredit(
  userId: string,
  options?: CreditOptions
): Promise<CreditConsumeResult> {
  if (!userId) {
    return { success: false, remaining: 0, deducted: false, error: 'Missing userId' };
  }

  // 1. Fetch user to check demo or subscription status
  let user: any = null;
  const mongoUp = await isMongoAvailable();
  if (mongoUp) {
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId).lean();
      }
    } catch {}
  }

  if (!user) {
    user = await DataStore.findUserById(userId);
  }

  if (!user) {
    return { success: true, remaining: 2, deducted: true };
  }

  // Demo users are never charged
  if (user.isDemo) {
    return { success: true, remaining: Infinity, deducted: false };
  }

  // Pro / Enterprise users: unlimited, no deduction
  const entitlements = getUserEntitlements(user);
  if (entitlements.unlimited || entitlements.isPro) {
    return { success: true, remaining: Infinity, deducted: false };
  }

  // 2. Resume generation handling
  if (options?.feature === 'resume_generation') {
    const cost = options.cost ?? RESUME_GENERATION_CREDIT_COST;
    const resumeGensCount = typeof user.aiResumeGenerationsCount === 'number' ? user.aiResumeGenerationsCount : 0;

    // If consuming free taste: increment count without deducting credits
    if (resumeGensCount < 1) {
      if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
        try {
          const updated = await User.findByIdAndUpdate(
            userId,
            { $inc: { aiResumeGenerationsCount: 1 } },
            { new: true }
          );
          if (updated) {
            return { success: true, remaining: updated.aiCredits, deducted: true };
          }
        } catch {}
      }
      return DataStore.decrementUserCredits(userId, 0, true);
    }

    // Free taste already consumed: deduct cost credits (e.g. 2) atomically
    if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const updatedUser = await User.findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(userId),
            aiCredits: { $gte: cost },
          },
          {
            $inc: { aiCredits: -cost, aiResumeGenerationsCount: 1 },
          },
          { new: true }
        );

        if (updatedUser) {
          return {
            success: true,
            remaining: updatedUser.aiCredits,
            deducted: true,
          };
        } else {
          return {
            success: false,
            remaining: 0,
            deducted: false,
            error: 'No credits remaining',
          };
        }
      } catch (err: any) {}
    }

    return DataStore.decrementUserCredits(userId, cost, true);
  }

  // 3. Job Match search consumption: first 3 free, then 1 PAYG credit
  if (options?.feature === 'job_match') {
    return DataStore.consumeJobMatchCredit(userId);
  }

  // 4. Default: Free users atomic 1 credit decrement for cover letters
  if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(userId),
          aiCredits: { $gt: 0 },
        },
        {
          $inc: { aiCredits: -1 },
        },
        {
          new: true,
        }
      );

      if (updatedUser) {
        return {
          success: true,
          remaining: updatedUser.aiCredits,
          deducted: true,
        };
      } else {
        return {
          success: false,
          remaining: 0,
          deducted: false,
          error: 'No credits remaining',
        };
      }
    } catch (err: any) {
      // Fall through to DataStore in case of unexpected Mongoose error
    }
  }

  // Fallback to local DataStore atomic decrement
  return DataStore.decrementUserCredits(userId);
}

/**
 * Route handler middleware wrapper for AI-generation endpoints.
 */
export function withCreditGuard(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    return handler(req, context);
  };
}

export default {
  requireCredits,
  consumeCredit,
  withCreditGuard,
};
