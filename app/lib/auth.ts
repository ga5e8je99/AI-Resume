import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'jobmatch_ats_ai_resume_super_secret_jwt_key_2026';

export const ADMIN_SECRET_KEY = process.env.ADMIN_KEY || 'GA138989@20102011f';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role?: 'user' | 'admin';
  isDemo?: boolean;
}

export function isDemoUser(user: AuthTokenPayload | { email?: string; isDemo?: boolean } | null | undefined): boolean {
  if (!user) return false;
  if ('isDemo' in user && user.isDemo === true) return true;
  if ('email' in user && user.email?.toLowerCase().trim() === 'demo@jobmatch.ai') return true;
  return false;
}

// Hash password securely with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare plain password with stored hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token (expires in 7 days)
export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

// Verify JWT token
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (err) {
    return null;
  }
}

// Extract authenticated user payload from NextRequest (Cookie or Header)
export function getAuthenticatedUser(req: NextRequest): AuthTokenPayload | null {
  // 1. Try from cookies
  const cookieToken = req.cookies.get('jobmatch_token')?.value;
  if (cookieToken) {
    const verified = verifyToken(cookieToken);
    if (verified) return verified;
  }

  // 2. Try from Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.split(' ')[1];
    const verified = verifyToken(headerToken);
    if (verified) return verified;
  }

  return null;
}

// Verify if the incoming request has Admin privileges
// Validates:
// 1. x-admin-key header or jobmatch_admin_key cookie matching ADMIN_SECRET_KEY
// 2. OR Authenticated user with role === 'admin' or matching ADMIN_EMAILS
export function verifyAdmin(req: NextRequest): { isAdmin: boolean; user?: AuthTokenPayload | null; reason?: string } {
  // Check admin key header or cookie
  const adminKeyHeader = req.headers.get('x-admin-key');
  const adminKeyCookie = req.cookies.get('jobmatch_admin_key')?.value;
  if (adminKeyHeader === ADMIN_SECRET_KEY || adminKeyCookie === ADMIN_SECRET_KEY) {
    return { isAdmin: true, user: getAuthenticatedUser(req) };
  }

  // Check authenticated user
  const user = getAuthenticatedUser(req);
  if (!user) {
    return { isAdmin: false, reason: 'Not authenticated' };
  }

  if (user.role === 'admin') {
    return { isAdmin: true, user };
  }

  const adminEmails = (process.env.ADMIN_EMAILS || 'admin@jobmatch.ai').split(',').map((e) => e.trim().toLowerCase());
  if (adminEmails.includes(user.email.toLowerCase())) {
    return { isAdmin: true, user };
  }

  return { isAdmin: false, user, reason: 'Insufficient privileges' };
}

// Validate that mutating requests originate from the same host (CSRF protection)
export function validateCsrfOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // Non-browser clients or requests without Origin header (e.g. server-to-server or tests)

  const host = req.headers.get('host');
  if (!host) return true;

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host; // includes port
    if (originHost.toLowerCase() === host.toLowerCase()) return true;

    // Check against configured APP URL if present
    if (process.env.NEXT_PUBLIC_APP_URL) {
      try {
        const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);
        if (originUrl.host.toLowerCase() === appUrl.host.toLowerCase()) return true;
      } catch {}
    }

    return false;
  } catch {
    return false;
  }
}

