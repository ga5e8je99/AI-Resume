import mongoose from 'mongoose';
import { getEnv } from './env';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Serverless-Safe MongoDB Connection
 * Reuses active Mongoose connections across warm serverless function invocations (Vercel Lambdas)
 * and guards against connection leaks or cold start stalls.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // 1. If cached connection is already active and open (readyState 1 = connected), return immediately
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. If mongoose singleton itself is already connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  // 3. Obtain connection URI
  const env = getEnv();
  const uri = env.MONGODB_URI;

  // 4. Initiate or join existing connection promise
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,           // Fail fast instead of buffering operations if disconnected
      maxPoolSize: 10,                 // Bounded connection pool for serverless lambdas
      serverSelectionTimeoutMS: 10000, // 10 seconds for initial TLS/DNS handshake on Atlas cold starts
      socketTimeoutMS: 45000,          // 45 seconds socket keep-alive
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log('✅ Connected successfully to MongoDB (Serverless-Safe)');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Clear promise on error so subsequent requests can re-attempt
    cached.conn = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

/**
 * Check if MongoDB connection is currently active (readyState === 1)
 */
export function isDatabaseConnected(): boolean {
  return !!(mongoose.connection && mongoose.connection.readyState === 1);
}

export default connectToDatabase;
