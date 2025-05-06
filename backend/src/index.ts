import { Hono } from 'hono'
import { userRouter } from './routes/user';
import { cors } from 'hono/cors'
import { blogRouter } from './routes/blog';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { handle } from 'hono/cloudflare-pages'

// Define types for Bindings and Variables including Prisma
type AppEnv = {
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    S3_BUCKET_NAME: string;
    S3_REGION: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
  },
  Variables: {
    userId: string;
    prisma: PrismaClient & ReturnType<typeof withAccelerate> // Type for Prisma Client with Accelerate
  }
}

const app = new Hono<AppEnv>();

// CORS Middleware (apply first to handle preflight requests properly)
app.use('/*', cors({
  origin: ['http://localhost:5173', 'https://exponus.vercel.app'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
  credentials: true
}))

// Middleware to initialize Prisma Client (after CORS)
app.use('*', async (c, next) => {
  try {
    // Make sure DATABASE_URL starts with prisma:// for Accelerate
    const dbUrl = c.env.DATABASE_URL;
    
    // Create the Prisma client with Accelerate extension
    const prisma = new PrismaClient({
      datasourceUrl: dbUrl,
    }).$extends(withAccelerate());
    
    // Set prisma client in the context
    c.set('prisma', prisma as any);
    await next();
  } catch (error) {
    console.error('Error initializing Prisma client:', error);
    c.status(500);
    return c.json({ message: 'Database connection error' });
  }
})

// API Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
})

// Routes
app.route("/api/v1/user", userRouter);
app.route("/api/v1/blog", blogRouter);

// For Cloudflare Pages
export const onRequest = handle(app);

// Default export for Wrangler
export default app
