import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { organizationCreateSchema } from '@/lib/hr';

const OVERVIEW_GET_RL = {
  keyPrefix: 'api_employer_overview_get',
  limit: 60,
  ipLimit: 120,
  windowMs: 60 * 1000,
};

const ORG_CREATE_RL = {
  keyPrefix: 'api_employer_org_create',
  limit: 10,
  ipLimit: 25,
  windowMs: 60 * 1000,
};

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, OVERVIEW_GET_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const requestedOrgId = req.nextUrl.searchParams.get('orgId')?.trim() || '';
  const userOrgs = await DataStore.getUserOrganizations(user.id);

  if (requestedOrgId) {
    const isMember = await DataStore.isOrganizationMember(requestedOrgId, user.id);
    if (!isMember) {
      return NextResponse.json(
        {
          ok: false,
          error: 'FORBIDDEN',
          message: 'You are not a member of this organization.',
        },
        { status: 403, headers: rl.headers }
      );
    }
  }

  const activeOrg = requestedOrgId
    ? await DataStore.getOrganizationById(requestedOrgId)
    : userOrgs[0] || null;

  if (!activeOrg) {
    return NextResponse.json(
      {
        ok: true,
        organizations: [],
        activeOrganization: null,
        jobs: [],
        ledger: [],
      },
      { status: 200, headers: rl.headers }
    );
  }

  const [jobs, ledger] = await Promise.all([
    DataStore.listEmployerJobs({ orgId: activeOrg.id, limit: 100 }),
    DataStore.getHrCreditLedger(activeOrg.id, 30),
  ]);

  return NextResponse.json(
    {
      ok: true,
      organizations: userOrgs,
      activeOrganization: activeOrg,
      jobs,
      ledger,
    },
    { status: 200, headers: rl.headers }
  );
}

export async function POST(req: NextRequest) {
  if (!validateCsrfOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: 'CSRF_ORIGIN_MISMATCH', message: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, ORG_CREATE_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const bodyRes = await parseBoundedJsonBody<Record<string, unknown>>(req, 64 * 1024);
  if (!bodyRes.ok) return bodyRes.errorResponse;

  const parsed = organizationCreateSchema.safeParse(bodyRes.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid organization details.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  const org = await DataStore.createOrganization(user.id, {
    ...parsed.data,
    initialHrCredits: 2, // 2 starter HR credits for new organizations
  });

  return NextResponse.json(
    {
      ok: true,
      organization: org,
    },
    { status: 201, headers: rl.headers }
  );
}

