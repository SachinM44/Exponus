import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'
import { signupInput, signinInput, updateProfileInput } from '@exponus1/exponus-common';

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables: {
        userId: string;
    }
}>();

// Middleware to verify JWT token for protected routes
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header("authorization") || "";
  try {
    // Extract token from Bearer format
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const user = await verify(token, c.env.JWT_SECRET);
    if (user) {
      //@ts-ignore
      c.set("userId", user.id);
      await next();
    } else {
      c.status(403);
      return c.json({
        message: "You are not logged in"
      });
    }
  } catch(e) {
    c.status(403);
    return c.json({
      message: "You are not logged in"
    });
  }
};

userRouter.post('/signup', async (c) => {
    const body = await c.req.json();
    const { success } = signupInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try {
      // First check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          username: body.username
        }
      });

      if (existingUser) {
        c.status(409); // Conflict status code
        return c.json({
          message: "Username already exists. Please choose a different username."
        });
      }

      // If username doesn't exist, create the user
      const user = await prisma.user.create({
        data: {
          username: body.username,
          password: body.password,
          name: body.name
        }
      });
      const jwt = await sign({
        id: user.id
      }, c.env.JWT_SECRET);
  
      return c.text(jwt);
    } catch(e) {
      console.error("Error during signup:", e);
      // Check specifically for unique constraint violations
      if (e.code === 'P2002' && e.meta?.target?.includes('username')) {
        c.status(409); // Conflict
        return c.json({
          message: "Username already exists. Please choose a different username."
        });
      }
      // Other errors
      c.status(500);
      return c.json({
        message: "An error occurred during registration. Please try again."
      });
    }
  })
  
  
  userRouter.post('/signin', async (c) => {
    const body = await c.req.json();
    const { success } = signinInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try {
      const user = await prisma.user.findFirst({
        where: {
          username: body.username,
          password: body.password,
        }
      })
      if (!user) {
        c.status(403);
        return c.json({
          message: "Incorrect creds"
        })
      }
      const jwt = await sign({
        id: user.id
      }, c.env.JWT_SECRET);
  
      return c.text(jwt)
    } catch(e) {
      console.log(e);
      c.status(411);
      return c.text('Invalid')
    }
  })

// Get user profile
userRouter.get('/profile', authMiddleware, async (c) => {
  const userId = c.get("userId");
  
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

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
    console.error(e);
    c.status(500);
    return c.json({
      message: "Error fetching user profile"
    });
  }
});

// Update user profile
userRouter.put('/profile', authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  
  const { success } = updateProfileInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      message: "Inputs not correct"
    });
  }
  
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Handle file upload if present
    let avatarUrl = body.avatar;
    
    // If avatar is a File object, we'd handle the upload to a storage service
    // For now, we'll just store the URL or base64 data directly
    
    const updatedUser = await prisma.user.update({
      where: {
        id: Number(userId)
      },
      data: {
        name: body.name,
        bio: body.bio,
        avatar: avatarUrl
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true
      }
    });

    return c.json(updatedUser);
  } catch (e) {
    console.error(e);
    c.status(500);
    return c.json({
      message: "Error updating user profile"
    });
  }
});