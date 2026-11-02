import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/app/lib/auth';
import { applyRateLimit } from '@/lib/rate-limit';
import DataStore from '@/app/lib/datastore';
import { getCachedJobResults, setCachedJobResults } from '@/lib/jobs/cache';
import { searchAllProviders } from '@/lib/jobs/providers';
import { deduplicateJobs, filterAndSortJobs } from '@/lib/jobs/matcher';
import { sendEmail, getJobAlertEmailHtml, SupportedEmailLanguage } from '@/lib/email';

const CronQuerySchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'all']).optional().default('all'),
  limit: z.number().int().min(1).max(50).optional().default(25),
});

function isAuthorizedCronRequest(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization') || '';
  const customHeader = req.headers.get('x-cron-secret') || '';

  if (cronSecret) {
    if (authHeader === `Bearer ${cronSecret}` || customHeader === cronSecret) {
      return true;
    }
  } else if (authHeader.startsWith('Bearer ') && authHeader.length > 10) {
    // Allow explicit bearer token in local/test when CRON_SECRET env is not set
    return true;
  }

  // Fallback: allow authenticated admin user
  const auth = requireAuth(req);
  if (auth.user && auth.user.role === 'admin') {
    return true;
  }

  return false;
}

async function runJobAlertsCron(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Valid CRON_SECRET or admin authentication required.' },
      { status: 401 }
    );
  }

  const rl = await applyRateLimit(req, {
    limit: 10,
    ipLimit: 20,
    windowMs: 60 * 1000,
    keyPrefix: 'cron_job_alerts',
  });
  if (!rl.allowed && rl.errorResponse) return rl.errorResponse;

  const sp = req.nextUrl.searchParams;
  const freqParam = sp.get('frequency') || 'all';
  const limitParam = sp.get('limit') ? Number(sp.get('limit')) : 25;

  const parsedParams = CronQuerySchema.safeParse({
    frequency: freqParam,
    limit: limitParam,
  });
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', message: 'Invalid cron query parameters.' },
      { status: 400 }
    );
  }

  const { frequency, limit } = parsedParams.data;
  const dueAlertsAll = await DataStore.getDueJobAlerts();
  const dueAlerts = dueAlertsAll
    .filter((a) => (frequency === 'all' ? true : a.alertFrequency === frequency))
    .slice(0, limit);

  let emailsSent = 0;
  const results: Array<{
    searchId: string;
    query: string;
    frequency: string;
    jobsCount: number;
    sent: boolean;
  }> = [];

  for (const alert of dueAlerts) {
    const cacheParams = {
      query: alert.query,
      location: alert.location || '',
      remote: Boolean(alert.remote),
      country: alert.country || 'global',
    };

    let rawJobs = (await getCachedJobResults(cacheParams))?.jobs;
    if (!rawJobs) {
      const federated = await searchAllProviders(cacheParams);
      if (!federated.allFailed && federated.jobs.length > 0) {
        await setCachedJobResults(cacheParams, federated);
      }
      rawJobs = federated.jobs;
    }

    const deduped = deduplicateJobs(rawJobs || []);
    const matched = filterAndSortJobs(deduped, {
      query: alert.query,
      location: alert.location,
      remote: alert.remote,
      employmentType: alert.employmentType || 'any',
      datePosted: alert.datePosted || 'any',
      seniority: alert.seniority || 'any',
      minSalary: alert.minSalary ?? undefined,
      maxSalary: alert.maxSalary ?? undefined,
      source: alert.source || 'all',
      sortBy: 'relevance',
    });

    if (matched.length === 0) {
      results.push({
        searchId: alert.id,
        query: alert.query,
        frequency: alert.alertFrequency,
        jobsCount: 0,
        sent: false,
      });
      continue;
    }

    const userRecord = await DataStore.findUserById(alert.userId);
    const recipientName = (userRecord as any)?.fullName || userRecord?.name || 'there';
    const lang: SupportedEmailLanguage = 'en';

    const html = getJobAlertEmailHtml({
      name: recipientName,
      language: lang,
      query: alert.query,
      location: alert.location,
      frequency: alert.alertFrequency === 'weekly' ? 'weekly' : 'daily',
      jobs: matched.slice(0, 6).map((j) => ({
        title: j.title,
        company: j.company,
        location: j.location,
        url: j.url,
        source: j.source,
        salary: j.salary,
        remote: j.remote,
      })),
      unsubscribeToken: alert.unsubscribeToken,
    });

    const emailRes = await sendEmail({
      to: alert.userEmail,
      subject: `JobMatch AI: ${matched.length} new jobs for "${alert.query}"`,
      html,
      isDemo: Boolean(userRecord?.isDemo),
    });

    if (emailRes.success) {
      emailsSent++;
      await DataStore.markJobAlertSent(alert.id);
    }

    results.push({
      searchId: alert.id,
      query: alert.query,
      frequency: alert.alertFrequency,
      jobsCount: matched.length,
      sent: emailRes.success,
    });
  }

  return NextResponse.json({
    success: true,
    processed: dueAlerts.length,
    emailsSent,
    results,
  });
}

export async function GET(req: NextRequest) {
  return runJobAlertsCron(req);
}

export async function POST(req: NextRequest) {
  return runJobAlertsCron(req);
}
