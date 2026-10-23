import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';

export async function GET(req: NextRequest) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.reason || 'Admin access required' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';
    const roleFilter = searchParams.get('role')?.trim() || '';

    const users = await DataStore.getUsers(query, roleFilter);
    return NextResponse.json({ users, count: users.length });
  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.reason || 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role || !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Valid userId and role are required' }, { status: 400 });
    }

    const updatedUser = await DataStore.updateUserRole(userId, role);
    return NextResponse.json({ message: 'User role updated', user: updatedUser });
  } catch (error: any) {
    console.error('Update user role error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.reason || 'Admin access required' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await DataStore.deleteUser(userId);
    return NextResponse.json({ message: 'User and all associated data deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete user' }, { status: 500 });
  }
}
