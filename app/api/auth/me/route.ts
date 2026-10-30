import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await DataStore.findUserById(authUser.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        isDemo: Boolean((user as any).isDemo),
        plan: (user as any).plan || 'free',
        aiCredits: typeof (user as any).aiCredits === 'number' ? (user as any).aiCredits : 3,
        aiResumeGenerationsCount: typeof (user as any).aiResumeGenerationsCount === 'number' ? (user as any).aiResumeGenerationsCount : 0,
        jobMatchFreeUsed: typeof (user as any).jobMatchFreeUsed === 'number' ? (user as any).jobMatchFreeUsed : 0,
        billingCycle: (user as any).billingCycle || 'none',
        planExpiresAt: (user as any).planExpiresAt || null,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
