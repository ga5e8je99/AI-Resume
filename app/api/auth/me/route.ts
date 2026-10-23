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
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
