import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { estimateTokensFromText, logAiUsageAndCheckBudget } from '@/app/lib/aiGovernance';
import {
  applyRateLimit,
  parseBoundedJsonBody,
  DEFAULT_MAX_AI_BODY_BYTES,
  DEFAULT_MAX_AI_INPUT_CHARS,
} from '@/lib/rate-limit';

// GET /api/analyses - List all saved ATS analyses for user
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const rateLimit = await applyRateLimit(
      req,
      { limit: 60, ipLimit: 120, windowMs: 60 * 1000, keyPrefix: 'analyses_get' },
      authUser.userId
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const analyses = await DataStore.getUserAnalyses(authUser.userId);
    return NextResponse.json({ analyses });
  } catch (error: any) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}

// POST /api/analyses - Save a new ATS analysis
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to save analysis.' },
        { status: 401 }
      );
    }

    const rateLimit = await applyRateLimit(
      req,
      { limit: 30, ipLimit: 60, windowMs: 60 * 1000, keyPrefix: 'analyses_post' },
      authUser.userId
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const parsed = await parseBoundedJsonBody(req, DEFAULT_MAX_AI_BODY_BYTES);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }
    const body = parsed.data;
    const {
      resumeFileName,
      targetRole,
      targetJobDescription,
      overallScore,
      grade,
      rankPercentile,
      matchLabel,
      subScores,
      result,
    } = body;

    if (typeof targetRole === 'string' && targetRole.length > 200) {
      return NextResponse.json(
        { error: 'INPUT_TOO_LONG', message: 'Target role cannot exceed 200 characters.' },
        { status: 400 }
      );
    }
    if (
      typeof targetJobDescription === 'string' &&
      targetJobDescription.length > DEFAULT_MAX_AI_INPUT_CHARS
    ) {
      return NextResponse.json(
        {
          error: 'INPUT_TOO_LONG',
          message: `Job description cannot exceed ${DEFAULT_MAX_AI_INPUT_CHARS} characters.`,
        },
        { status: 400 }
      );
    }

    if (overallScore === undefined || !result) {
      return NextResponse.json(
        { error: 'Missing analysis result data' },
        { status: 400 }
      );
    }

    const newAnalysis = await DataStore.createUserAnalysis(authUser.userId, {
      resumeFileName: resumeFileName || 'Uploaded_Resume.pdf',
      targetRole: targetRole || 'General Role',
      targetJobDescription: targetJobDescription || '',
      overallScore,
      grade: grade || 'B',
      rankPercentile: rankPercentile || 'Top 25%',
      matchLabel: matchLabel || 'Good Match',
      subScores: subScores || result.subScores,
      result,
    });

    const approxTokens = estimateTokensFromText(
      (targetJobDescription || '') + ' ' + JSON.stringify(result || {})
    );
    await logAiUsageAndCheckBudget({
      userId: authUser.userId,
      endpoint: '/api/analyses',
      tokens: approxTokens,
      promptTokens: estimateTokensFromText(targetJobDescription || ''),
      completionTokens: estimateTokensFromText(JSON.stringify(result || {})),
      costUsd: 0,
      latencyMs: Date.now() - startTime,
      status: 'fallback',
      provider: 'built-in-ats-engine',
      model: 'built-in-ats-engine',
    });

    return NextResponse.json(
      {
        message: 'Analysis saved successfully',
        analysis: newAnalysis,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error saving analysis:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save analysis' },
      { status: 500 }
    );
  }
}
