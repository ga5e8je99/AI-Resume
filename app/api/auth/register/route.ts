import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, signToken } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide full name, email, and password.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await DataStore.findUserByEmail(cleanEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const allUsers = await DataStore.getUsers();
    const role = allUsers.length === 0 || cleanEmail === 'admin@jobmatch.ai' ? 'admin' : 'user';

    const newUser = await DataStore.createUserAccount({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set('jobmatch_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
