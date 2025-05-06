import { Hono, Context, Next } from "hono";
import { sign, verify } from 'hono/jwt'
import { signupInput, signinInput, updateProfileInput } from '@exponus1/exponus-common';
import bcrypt from 'bcryptjs';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

// Define the expected Env type for this router, matching index.ts
type UserEnv = {
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
        // Add S3 related env variables
        S3_BUCKET_NAME: string;
        S3_REGION: string;
        AWS_ACCESS_KEY_ID: string;
        AWS_SECRET_ACCESS_KEY: string;
    },
    Variables: {
        userId: string;
        prisma: PrismaClient & ReturnType<typeof withAccelerate>;
    }
}

export const userRouter = new Hono<UserEnv>();

// Middleware to verify JWT token for protected routes
const authMiddleware = async (c: Context<UserEnv>, next: Next) => {
  const authHeader = c.req.header("authorization") || "";
  try {
    // Extract token from Bearer format
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const user = await verify(token, c.env.JWT_SECRET);
    if (user && typeof user.id === 'string') {
      c.set("userId", user.id as string);
      await next();
    } else if (user && typeof user.id === 'number') {
      c.set("userId", user.id.toString());
      await next();
    } else {
      c.status(401);
      return c.json({
        message: "Unauthorized: Invalid token or user ID"
      });
    }
  } catch(e) {
    c.status(401);
    return c.json({
      message: "Unauthorized: Authentication error"
    });
  }
};

userRouter.post('/signup', async (c) => {
    const body = await c.req.json();
    const parseResult = signupInput.safeParse(body);
    if (!parseResult.success) {
        c.status(400);
        return c.json({
            message: "Invalid signup input",
            errors: parseResult.error.flatten().fieldErrors
        });
    }
    const prisma = c.get('prisma');
    const { username, password, name } = parseResult.data;
  
    try {
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10);

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          username: username
        }
      });

      if (existingUser) {
        c.status(409); // Conflict status code
        return c.json({
          message: "Username already exists"
        });
      }

      // If username doesn't exist, create the user with hashed password
      const user = await prisma.user.create({
        data: {
          username: username,
          password: hashedPassword,
          name: name
        }
      });
      // Calculate expiration time (1 day from now)
      const expiresIn = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 1 day in seconds
      // Include expiration in the payload
      const jwt = await sign({ id: user.id, exp: expiresIn }, c.env.JWT_SECRET);
  
      return c.json({ 
        token: jwt,
        message: "User registered successfully"
      });
    } catch(e) {
      console.error("Error during signup:", e);
      // Handle potential Prisma unique constraint violation explicitly
      if ((e as any).code === 'P2002' && (e as any).meta?.target?.includes('username')) {
        c.status(409); // Conflict
        return c.json({
          message: "Username already exists"
        });
      }
      // Other errors are internal server errors
      c.status(500);
      return c.json({
        message: "An unexpected error occurred during registration"
      });
    }
  });
  
  
userRouter.post('/signin', async (c) => {
    const body = await c.req.json();
    const parseResult = signinInput.safeParse(body);
    if (!parseResult.success) {
        c.status(400);
        return c.json({
            message: "Invalid signin input",
            errors: parseResult.error.flatten().fieldErrors
        });
    }

    const prisma = c.get('prisma');
    const { username, password } = parseResult.data;
  
    try {
      // Find user by username first
      const user = await prisma.user.findUnique({
        where: {
          username: username,
        }
      });
      // If user exists, compare the provided password with the stored hash
      if (!user || !await bcrypt.compare(password, user.password)) {
        c.status(401);
        return c.json({
          message: "Incorrect username or password"
        });
      }
      // Calculate expiration time (1 day from now)
      const expiresIn = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 1 day in seconds
      // Include expiration in the payload
      const jwt = await sign({ id: user.id, exp: expiresIn }, c.env.JWT_SECRET);
  
      return c.json({
        token: jwt,
        message: "Login successful"
      });
    } catch(e) {
      console.error("Error during signin:", e);
      c.status(500);
      return c.json({ 
        message: 'An unexpected error occurred during signin' 
      });
    }
});

// Get Presigned URL for Avatar Upload
userRouter.post('/avatar/presigned-url', authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const contentType = body.contentType; // e.g., 'image/jpeg', 'image/png'
  const filename = body.filename || 'avatar.jpg'; // Get filename from frontend if possible

  if (!contentType || !contentType.startsWith('image/')) {
      c.status(400);
      return c.json({ 
        message: 'Invalid content type. Only images are allowed.' 
      });
  }

  // Check if all S3 environment variables are available
  if (!c.env.S3_BUCKET_NAME || !c.env.S3_REGION || 
      !c.env.AWS_ACCESS_KEY_ID || !c.env.AWS_SECRET_ACCESS_KEY) {
    c.status(500);
    return c.json({ 
      message: 'S3 storage is not properly configured' 
    });
  }

  // Generate a unique key for the S3 object
  const fileExtension = filename.split('.').pop() || 'jpg';
  const key = `avatars/${userId}/${uuidv4()}.${fileExtension}`;

  try {
      const s3Client = new S3Client({
          region: c.env.S3_REGION,
          credentials: {
              accessKeyId: c.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: c.env.AWS_SECRET_ACCESS_KEY,
          },
      });

      const command = new PutObjectCommand({
          Bucket: c.env.S3_BUCKET_NAME,
          Key: key,
          ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // URL expires in 5 minutes

      // Construct the final object URL
      const objectUrl = `https://${c.env.S3_BUCKET_NAME}.s3.${c.env.S3_REGION}.amazonaws.com/${key}`;

      return c.json({ 
        presignedUrl, 
        objectUrl, 
        key 
      });

  } catch (error) {
      console.error("Error generating presigned URL:", error);
      c.status(500);
      return c.json({ 
        message: 'Could not generate upload URL' 
      });
  }
});

// Get user profile
userRouter.get('/profile', authMiddleware, async (c) => {
  const userId = c.get("userId");
  const prisma = c.get('prisma');

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId)
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true
      }
    });

    if (!user) {
      c.status(404);
      return c.json({
        message: "User not found"
      });
    }

    return c.json(user);
  } catch (e) {
    console.error("Error fetching user profile:", e);
    c.status(500);
    return c.json({
      message: "Error fetching user profile"
    });
  }
});

// Update user profile - Now expects avatar URL from S3
userRouter.put('/profile', authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  
  // Validate incoming body using the common schema
  const parseResult = updateProfileInput.safeParse(body);
  if (!parseResult.success) {
    c.status(400);
    return c.json({
      message: "Invalid input",
      errors: parseResult.error.flatten().fieldErrors
    });
  }
  
  const prisma = c.get('prisma');

  // Extract validated data
  const { name, bio, avatar } = parseResult.data;

  try {
    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: {
        id: Number(userId)
      },
      select: { id: true }
    });

    if (!userExists) {
      c.status(404);
      return c.json({
        message: "User not found"
      });
    }

    // The 'avatar' field in the body should now be the S3 object URL
    let avatarUrl = typeof avatar === 'string' ? avatar : undefined;
    
    const updatedUser = await prisma.user.update({
      where: {
        id: Number(userId)
      },
      data: {
        name: name,
        bio: bio,
        // Only update avatar if a new URL string was provided
        ...(avatarUrl && { avatar: avatarUrl }),
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true
      }
    });

    return c.json({
      user: updatedUser,
      message: "Profile updated successfully"
    });
  } catch (e) {
    console.error("Error updating user profile:", e);
    c.status(500);
    return c.json({
      message: "Error updating user profile"
    });
  }
});
