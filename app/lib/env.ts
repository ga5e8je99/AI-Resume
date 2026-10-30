/**
 * Runtime Environment Variable Validation
 * Validates required configuration on serverless (Vercel) and local environments.
 */

export interface EnvConfig {
  MONGODB_URI: string;
  JWT_SECRET: string;
  ADMIN_KEY: string;
  ADMIN_EMAILS: string[];
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_API_URL: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL: string;
  OPENAI_BASE_URL: string;
  AI_REQUEST_TIMEOUT_MS: number;
  AI_MAX_RETRIES: number;
  AI_PROVIDER_ENABLED: boolean;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  SENTRY_DSN?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  NODE_ENV: 'development' | 'production' | 'test';
  IS_VERCEL: boolean;
  IS_PRODUCTION: boolean;
}

let cachedEnv: EnvConfig | null = null;

export function isVercel(): boolean {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

/**
 * Validates environment variables at runtime.
 * Throws a descriptive error when required variables are missing or misconfigured.
 */
export function validateEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  const errors: string[] = [];
  const isProd = isProduction();
  const onVercel = isVercel();

  // 1. MONGODB_URI validation
  let mongoUri = process.env.MONGODB_URI?.trim() || '';
  if (!mongoUri) {
    if (onVercel || (isProd && process.env.NEXT_PHASE !== 'phase-production-build')) {
      errors.push(
        'MONGODB_URI is required in production/Vercel environments. ' +
        'Please configure your MongoDB Atlas connection string (e.g., mongodb+srv://<user>:<password>@cluster.mongodb.net/jobmatch).'
      );
    } else {
      // Local development fallback
      mongoUri = 'mongodb://127.0.0.1:27017/jobmatch';
    }
  } else if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    errors.push(
      'MONGODB_URI must start with "mongodb://" or "mongodb+srv://". ' +
      `Received: "${mongoUri.slice(0, 15)}..."`
    );
  }

  // 2. JWT_SECRET validation
  const jwtSecret = process.env.JWT_SECRET?.trim() || 'jobmatch_ats_ai_resume_super_secret_jwt_key_2026';
  if (isProd && onVercel) {
    if (
      !process.env.JWT_SECRET ||
      jwtSecret.includes('replace_with') ||
      jwtSecret.length < 16
    ) {
      errors.push(
        'JWT_SECRET must be set to a secure, unpredictable string of at least 16 characters in production environments.'
      );
    }
  }

  // 3. ADMIN_KEY validation
  const adminKey = process.env.ADMIN_KEY?.trim() || 'GA138989@20102011f';

  // 4. ADMIN_EMAILS
  const adminEmailsRaw = process.env.ADMIN_EMAILS || 'admin@jobmatch.ai';
  const adminEmails = adminEmailsRaw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

  // 5. NEXT_PUBLIC_APP_URL validation
  let appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || '';
  if (!appUrl) {
    if (process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      appUrl = 'http://localhost:3000';
    }
  } else {
    try {
      new URL(appUrl);
    } catch {
      errors.push(`NEXT_PUBLIC_APP_URL is not a valid URL: "${appUrl}"`);
    }
  }

  // 6. NEXT_PUBLIC_API_URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || `${appUrl}/api`;

  // 7. AI Engine Config
  const openAiKey = process.env.OPENAI_API_KEY?.trim() || undefined;
  const openAiModel = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const openAiBaseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const aiTimeout = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '15000', 10);
  const aiRetries = parseInt(process.env.AI_MAX_RETRIES || '2', 10);
  const aiEnabled = process.env.AI_PROVIDER_ENABLED !== 'false';

  // Fail-fast if critical configuration errors were detected
  if (errors.length > 0) {
    const header = '\n======================================================\n❌ ENVIRONMENT CONFIGURATION ERROR (JobMatch AI)\n======================================================\n';
    const body = errors.map((err, idx) => `  ${idx + 1}. ${err}`).join('\n\n');
    const footer = '\n\nPlease check your .env.local file or Vercel Environment Variables dashboard.\nSee DEPLOYMENT.md and .env.example for guidance.\n======================================================\n';
    throw new Error(header + body + footer);
  }

  cachedEnv = {
    MONGODB_URI: mongoUri,
    JWT_SECRET: jwtSecret,
    ADMIN_KEY: adminKey,
    ADMIN_EMAILS: adminEmails,
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_PUBLIC_API_URL: apiUrl,
    OPENAI_API_KEY: openAiKey,
    OPENAI_MODEL: openAiModel,
    OPENAI_BASE_URL: openAiBaseUrl,
    AI_REQUEST_TIMEOUT_MS: isNaN(aiTimeout) ? 15000 : aiTimeout,
    AI_MAX_RETRIES: isNaN(aiRetries) ? 2 : aiRetries,
    AI_PROVIDER_ENABLED: aiEnabled,
    RESEND_API_KEY: process.env.RESEND_API_KEY?.trim() || undefined,
    EMAIL_FROM: process.env.EMAIL_FROM?.trim() || undefined,
    SENTRY_DSN: process.env.SENTRY_DSN?.trim() || undefined,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com',
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    IS_VERCEL: onVercel,
    IS_PRODUCTION: isProd,
  };

  return cachedEnv;
}

/**
 * Returns current validated environment configuration.
 */
export function getEnv(): EnvConfig {
  return validateEnv();
}

export default validateEnv;
