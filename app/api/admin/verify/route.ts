import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, ADMIN_SECRET_KEY } from '@/app/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminKey } = body;

    if (!adminKey || adminKey.trim() !== ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin access key' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Admin access authorized',
    });

    // Set admin key cookie
    response.cookies.set('jobmatch_admin_key', ADMIN_SECRET_KEY, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = verifyAdmin(req);
  return NextResponse.json({
    isAdmin: auth.isAdmin,
    user: auth.user || null,
  });
}
