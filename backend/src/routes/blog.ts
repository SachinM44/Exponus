// import { createblogInput, updateblogInput } from "@exponus1/exponus-common";
import { createBlogInput, updateBlogInput, commentInput, likeInput } from "@exponus1/exponus-common";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";


export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }, 
    Variables: {
        userId: string;
    }
}>();

blogRouter.use("/*", async (c, next) => {
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
            })
        }
    } catch(e) {
        c.status(403);
        return c.json({
            message: "You are not logged in"
        })
    }
});

blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const { success } = createBlogInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }

    const authorId = c.get("userId");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: Number(authorId)
        }
    })

    return c.json({
        id: blog.id
    })
})

blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const { success } = updateBlogInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.update({
        where: {
            id: body.id
        }, 
        data: {
            title: body.title,
            content: body.content
        }
    })

    return c.json({
        id: blog.id
    })
})

// Todo: add pagination
blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const blogs = await prisma.blog.findMany({
        select: {
            content: true,
            title: true,
            id: true,
            author: {
                select: {
                    name: true
                }
            }
        }
    });

    return c.json({
        blogs
    })
})

blogRouter.get('/:id', async (c) => {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try {
        const blog = await prisma.blog.findFirst({
            where: {
                id: Number(id)
            },
            select: {
                id: true,
                title: true,
                content: true,
                author: {
                    select: {
                        name: true
                    }
                }
            }
        })
    
        return c.json({
            blog
        });
    } catch(e) {
        c.status(411); // 4
        return c.json({
            message: "Error while fetching blog post"
        });
    }
})

// Get comments for a blog post
blogRouter.get('/:id/comment', async (c) => {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const comments = await prisma.comment.findMany({
            where: {
                blogId: Number(id)
            },
            include: {
                user: {
                    select: {
                        name: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return c.json({
            comments
        });
    } catch(e) {
        c.status(500);
        return c.json({
            message: "Error fetching comments"
        });
    }
});

// Add a comment to a blog post
blogRouter.post('/:id/comment', async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { success } = commentInput.safeParse(body);
    
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        });
    }

    const userId = c.get("userId");
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const comment = await prisma.comment.create({
            data: {
                content: body.content,
                blogId: Number(id),
                userId: Number(userId)
            },
            include: {
                user: {
                    select: {
                        name: true,
                        avatar: true
                    }
                }
            }
        });

        return c.json({
            comment
        });
    } catch(e) {
        console.error(e);
        c.status(500);
        return c.json({
            message: "Error adding comment"
        });
    }
});

// Like/dislike a blog post
blogRouter.post('/:id/like', async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { success } = likeInput.safeParse(body);
    
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        });
    }

    const userId = c.get("userId");
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        // First check if user already liked/disliked this post
        const existingLike = await prisma.like.findUnique({
            where: {
                blogId_userId: {
                    blogId: Number(id),
                    userId: Number(userId)
                }
            }
        });

        let like;
        
        if (existingLike) {
            // Update existing like
            like = await prisma.like.update({
                where: {
                    id: existingLike.id
                },
                data: {
                    type: body.type
                }
            });
        } else {
            // Create new like
            like = await prisma.like.create({
                data: {
                    type: body.type,
                    blogId: Number(id),
                    userId: Number(userId)
                }
            });
        }

        // Get updated like counts
        const likesCount = await prisma.like.count({
            where: {
                blogId: Number(id),
                type: 'LIKE'
            }
        });
        
        const dislikesCount = await prisma.like.count({
            where: {
                blogId: Number(id),
                type: 'DISLIKE'
            }
        });

        return c.json({
            like,
            likesCount,
            dislikesCount
        });
    } catch(e) {
        console.error(e);
        c.status(500);
        return c.json({
            message: "Error liking blog post"
        });
    }
});

// Get likes for a blog post
blogRouter.get('/:id/like', async (c) => {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        // Get like counts
        const likesCount = await prisma.like.count({
            where: {
                blogId: Number(id),
                type: 'LIKE'
            }
        });
        
        const dislikesCount = await prisma.like.count({
            where: {
                blogId: Number(id),
                type: 'DISLIKE'
            }
        });
        
        // If user is logged in, check if they liked this post
        let userLike = null;
        const authHeader = c.req.header("authorization") || "";
        
        if (authHeader) {
            try {
                const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
                const user = await verify(token, c.env.JWT_SECRET);
                
                if (user && user.id) {
                    userLike = await prisma.like.findUnique({
                        where: {
                            blogId_userId: {
                                blogId: Number(id),
                                userId: Number(user.id)
                            }
                        }
                    });
                }
            } catch(e) {
                // Ignore errors - just means user isn't logged in
            }
        }

        return c.json({
            likesCount,
            dislikesCount,
            userLike
        });
    } catch(e) {
        c.status(500);
        return c.json({
            message: "Error fetching likes"
        });
    }
});