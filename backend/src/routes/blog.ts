import { createBlogInput, updateBlogInput, commentInput, likeInput } from "@exponus1/exponus-common";
import { Hono, Context, Next } from "hono";
import { verify } from "hono/jwt";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Define the expected Env type for this router with proper Prisma typing
type BlogEnv = {
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
        S3_BUCKET_NAME: string;
        S3_REGION: string;
        AWS_ACCESS_KEY_ID: string;
        AWS_SECRET_ACCESS_KEY: string;
        HUGGING_FACE_API_TOKEN: string;
    },
    Variables: {
        userId: string;
        prisma: PrismaClient & ReturnType<typeof withAccelerate>;
    }
}

export const blogRouter = new Hono<BlogEnv>();

// Authentication middleware - restore original implementation
blogRouter.use("/*", async (c: Context<BlogEnv>, next: Next) => {
    const authHeader = c.req.header("authorization") || "";
    try {
        // Extract token from Bearer format
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const user = await verify(token, c.env.JWT_SECRET);
        // Add type checking for user.id
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
});

// Create a new blog post
blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const parseResult = createBlogInput.safeParse(body);
    if (!parseResult.success) {
        c.status(400); 
        return c.json({
            message: "Invalid input format",
            errors: parseResult.error.flatten().fieldErrors
        });
    }

    const authorId = c.get("userId");
    const prisma = c.get('prisma');

    try {
        const blog = await prisma.blog.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: Number(authorId)
            }
        });

        return c.json({
            id: blog.id,
            message: "Blog post created successfully"
        });
    } catch (e) {
        console.error("Error creating blog:", e);
        c.status(500);
        return c.json({ message: "Error creating blog post" });
    }
});

// Update a blog post
blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const parseResult = updateBlogInput.safeParse(body);
    if (!parseResult.success) {
        c.status(400); 
        return c.json({
            message: "Invalid input format",
            errors: parseResult.error.flatten().fieldErrors
        });
    }

    const prisma = c.get('prisma');
    const userId = c.get("userId");

    try {
        // Verify the user owns the blog post before updating
        const blogToUpdate = await prisma.blog.findUnique({
            where: {
                id: body.id,
            }
        });

        if (!blogToUpdate) {
            c.status(404);
            return c.json({ message: "Blog post not found" });
        }

        if (blogToUpdate.authorId !== Number(userId)) {
            c.status(403); 
            return c.json({ message: "You are not authorized to update this post" });
        }

        // If authorized, proceed with the update
        const blog = await prisma.blog.update({
            where: {
                id: body.id,
                authorId: Number(userId) 
            }, 
            data: {
                title: body.title,
                content: body.content
            }
        });

        return c.json({
            id: blog.id,
            message: "Blog post updated successfully"
        });
    } catch (e) {
        console.error("Error updating blog:", e);
        c.status(500);
        return c.json({ message: "Error updating blog post" });
    }
});

// Get a paginated list of blog posts
blogRouter.get('/bulk', async (c) => {
    const prisma = c.get('prisma');
    
    // Get page and pageSize from query params, with defaults
    const page = parseInt(c.req.query('page') || '1', 10);
    const pageSize = parseInt(c.req.query('pageSize') || '10', 10);
    
    // Ensure valid numbers
    const pageNumber = Math.max(1, page);
    const limit = Math.max(1, Math.min(50, pageSize)); 
    const offset = (pageNumber - 1) * limit;

    try {
        const blogs = await prisma.blog.findMany({
            skip: offset,
            take: limit,
            orderBy: {
                id: 'desc' 
            },
            select: {
                title: true,
                id: true,
                content: true,
                createdAt: true,
                author: {
                    select: {
                        name: true,
                        avatar: true 
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true
                    }
                }
            }
        });

        // Get total count for pagination info
        const totalBlogs = await prisma.blog.count();
        const totalPages = Math.ceil(totalBlogs / limit);

        return c.json({
            blogs,
            pagination: {
                currentPage: pageNumber,
                pageSize: limit,
                totalBlogs,
                totalPages
            }
        });
    } catch (error) {
        console.error("Error fetching blogs:", error instanceof Error ? error.message : error);
        if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
            const errorObj = error as { code: string, message: string };
            if (errorObj.code === 'P5000' && errorObj.message.includes('P6009')) {
                c.status(500);
                return c.json({ message: "Failed to load blogs: Response size limit exceeded." });
            }
        }
        c.status(500);
        return c.json({ message: "Error fetching blogs" });
    }
});

// Get a single blog post by ID
blogRouter.get('/:id', async (c) => {
    const id = c.req.param("id");
    const prisma = c.get('prisma');

    try {
        const blog = await prisma.blog.findFirst({
            where: {
                id: Number(id)
            },
            select: {
                id: true,
                title: true,
                content: true,
                createdAt: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true
                    }
                }
            }
        });
        
        if (!blog) {
            c.status(404);
            return c.json({ message: "Blog post not found" });
        }

        return c.json({
            blog
        });
    } catch(e) {
        console.error(`Error fetching blog post with ID ${id}:`, e);
        if (e instanceof Error && e.message.includes("Argument `id` must be a number")) {
             c.status(400);
             return c.json({ message: "Invalid blog ID format" });
        }
        c.status(500);
        return c.json({
            message: "Error while fetching blog post"
        });
    }
});

// Get comments for a blog post
blogRouter.get('/:id/comment', async (c) => {
    const id = c.req.param("id");
    const prisma = c.get('prisma');

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
        console.error(`Error fetching comments for blog ID ${id}:`, e);
        c.status(500);
        return c.json({
            message: "Error fetching comments"
        });
    }
});

// Add a comment to a blog post
blogRouter.post('/:id/comment', async (c) => {
    const blogIdFromParam = c.req.param("id");
    const body = await c.req.json();
    const parseResult = commentInput.safeParse(body);
    
    if (!parseResult.success) {
        c.status(400);
        return c.json({
            message: "Invalid input for comment",
            errors: parseResult.error.flatten().fieldErrors
        });
    }

    const userId = c.get("userId");
    const prisma = c.get('prisma');
    const { content } = parseResult.data;

    try {
        // Validate blog exists first
        const blogExists = await prisma.blog.findUnique({
            where: {
                id: Number(blogIdFromParam)
            },
            select: {
                id: true
            }
        });

        if (!blogExists) {
            c.status(404);
            return c.json({ message: "Blog post not found" });
        }

        const comment = await prisma.comment.create({
            data: {
                content: content,
                blogId: Number(blogIdFromParam),
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
            comment,
            message: "Comment added successfully"
        });
    } catch(e) {
        console.error("Error adding comment:", e);
        c.status(500);
        return c.json({
            message: "Error adding comment"
        });
    }
});

// Like/dislike a blog post
blogRouter.post('/:id/like', async (c) => {
    const blogIdFromParam = c.req.param("id");
    const body = await c.req.json();
    const parseResult = likeInput.safeParse(body);
    
    if (!parseResult.success) {
        c.status(400);
        return c.json({
            message: "Invalid input for like/dislike",
            errors: parseResult.error.flatten().fieldErrors
        });
    }

    const userId = c.get("userId");
    const prisma = c.get('prisma');
    const { type } = parseResult.data;

    try {
        // Validate blog exists first
        const blogExists = await prisma.blog.findUnique({
            where: {
                id: Number(blogIdFromParam)
            },
            select: {
                id: true
            }
        });

        if (!blogExists) {
            c.status(404);
            return c.json({ message: "Blog post not found" });
        }

        const like = await prisma.like.upsert({
            where: {
                blogId_userId: {
                    blogId: Number(blogIdFromParam),
                    userId: Number(userId)
                }
            },
            update: {
                type: type
            },
            create: {
                type: type,
                blogId: Number(blogIdFromParam),
                userId: Number(userId)
            }
        });

        return c.json({
            like,
            message: type === 'LIKE' ? "Post liked successfully" : "Post disliked successfully"
        });
    } catch(e) {
        console.error("Error handling like:", e);
        c.status(500);
        return c.json({
            message: "Error processing like/dislike"
        });
    }
});

// Get likes for a blog post
blogRouter.get('/:id/likes', async (c) => {
    const blogId = c.req.param("id");
    const prisma = c.get('prisma');

    try {
        // Validate blog exists first
        const blogExists = await prisma.blog.findUnique({
            where: {
                id: Number(blogId)
            },
            select: {
                id: true
            }
        });

        if (!blogExists) {
            c.status(404);
            return c.json({ message: "Blog post not found" });
        }
        
        const likes = await prisma.like.findMany({
            where: {
                blogId: Number(blogId)
            }
        });

        // Calculate counts
        const likesCount = likes.filter(l => l.type === 'LIKE').length;
        const dislikesCount = likes.filter(l => l.type === 'DISLIKE').length;

        return c.json({
            likes: likes,
            stats: {
                likesCount,
                dislikesCount,
                total: likes.length
            }
        });
    } catch(e) {
        console.error(`Error fetching likes for blog ID ${blogId}:`, e);
        c.status(500);
        return c.json({
            message: "Error fetching likes"
        });
    }
});

// Get presigned URL for blog image upload
blogRouter.post('/image/presigned-url', async (c) => {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { contentType, filename } = body;

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
    const key = `blog-images/${userId}/${uuidv4()}.${fileExtension}`;

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

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); 

        // Construct the final object URL
        const objectUrl = `https://${c.env.S3_BUCKET_NAME}.s3.${c.env.S3_REGION}.amazonaws.com/${key}`;

        return c.json({ 
            presignedUrl, 
            objectUrl, 
            key 
        });

    } catch (error) {
        console.error("Error generating presigned URL for blog image:", error);
        c.status(500);
        return c.json({ 
            message: 'Could not generate upload URL' 
        });
    }
});

// Get blogs by user ID
blogRouter.get('/user/:userId', async (c) => {
    const userIdFromParam = c.req.param("userId");
    const prisma = c.get('prisma');
    
    // Get page and pageSize from query params, with defaults
    const page = parseInt(c.req.query('page') || '1', 10);
    const pageSize = parseInt(c.req.query('pageSize') || '10', 10);
    
    // Ensure valid numbers
    const pageNumber = Math.max(1, page);
    const limit = Math.max(1, Math.min(50, pageSize)); 
    const offset = (pageNumber - 1) * limit;

    try {
        // Verify the user exists
        const userExists = await prisma.user.findUnique({
            where: {
                id: Number(userIdFromParam)
            },
            select: {
                id: true
            }
        });

        if (!userExists) {
            c.status(404);
            return c.json({ message: "User not found" });
        }

        const blogs = await prisma.blog.findMany({
            where: {
                authorId: Number(userIdFromParam)
            },
            skip: offset,
            take: limit,
            orderBy: {
                id: 'desc' 
            },
            select: {
                title: true,
                id: true,
                content: true,
                createdAt: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        });

        // Count total blogs by this user for pagination
        const totalBlogs = await prisma.blog.count({
            where: {
                authorId: Number(userIdFromParam)
            }
        });

        const totalPages = Math.ceil(totalBlogs / limit);

        return c.json({
            blogs,
            pagination: {
                currentPage: pageNumber,
                pageSize: limit,
                totalBlogs,
                totalPages
            }
        });
    } catch (error) {
        console.error(`Error fetching blogs for user ID ${userIdFromParam}:`, error);
        c.status(500);
        return c.json({ message: "Error fetching user's blogs" });
    }
});

// AI Blog Writing Assistant (Local Implementation)
blogRouter.post('/ai-assistant', async (c) => {
    try {
        const { prompt, promptType } = await c.req.json();
        
        if (!prompt || typeof prompt !== 'string') {
            c.status(400);
            return c.json({ message: "Invalid prompt provided" });
        }

        // Local implementation that doesn't rely on external APIs
        const generateContent = (topic: string, type: string = 'topic') => {
            const cleanTopic = topic.trim();
            
            // Templates for different types of content
            const templates = {
                topic: [
                    `# Introduction to ${cleanTopic}\n\nIn today's rapidly evolving world, ${cleanTopic} has become increasingly important. This blog post explores the key aspects of ${cleanTopic} and why it matters to everyone.\n\n## Why ${cleanTopic} Matters\n\n${cleanTopic} is not just a trending topic; it's a fundamental shift in how we approach problems and solutions in our daily lives.`,
                    
                    `# Understanding ${cleanTopic}\n\n${cleanTopic} represents one of the most significant developments in recent years. As we delve into this fascinating subject, we'll discover how it's reshaping our understanding and creating new opportunities.\n\n## The Evolution of ${cleanTopic}\n\nThe concept of ${cleanTopic} has evolved significantly over time, transforming from a niche interest into a mainstream phenomenon.`,
                    
                    `# Exploring the World of ${cleanTopic}\n\nWelcome to an in-depth exploration of ${cleanTopic}. This fascinating subject has captured the attention of experts and enthusiasts alike, offering new perspectives on how we view the world around us.\n\n## The Impact of ${cleanTopic}\n\nFew topics have had such a profound impact on our society as ${cleanTopic}. Let's examine why this matters and what it means for our future.`
                ],
                outline: [
                    `# Comprehensive Guide to ${cleanTopic}\n\n## Introduction\n- Brief overview of ${cleanTopic}\n- Why ${cleanTopic} is relevant today\n- What readers will learn from this article\n\n## Background and History\n- Origins of ${cleanTopic}\n- Key milestones in the development of ${cleanTopic}\n- Notable figures who contributed to ${cleanTopic}\n\n## Main Concepts\n- Core principles of ${cleanTopic}\n- Essential terminology\n- Common misconceptions\n\n## Practical Applications\n- How ${cleanTopic} is used in real-world scenarios\n- Case studies and examples\n- Future potential applications\n\n## Challenges and Limitations\n- Current obstacles in ${cleanTopic}\n- Ethical considerations\n- Areas for improvement\n\n## Conclusion\n- Summary of key points\n- Final thoughts on the future of ${cleanTopic}\n- Call to action for readers`,
                    
                    `# ${cleanTopic}: A Complete Breakdown\n\n## Introduction to ${cleanTopic}\n- What is ${cleanTopic}?\n- Historical context\n- Significance in today's world\n\n## Key Components\n- Essential elements of ${cleanTopic}\n- How these components interact\n- What makes ${cleanTopic} unique\n\n## Benefits and Advantages\n- Primary benefits of ${cleanTopic}\n- Comparative advantages\n- Who benefits most from ${cleanTopic}\n\n## Implementation Strategies\n- Getting started with ${cleanTopic}\n- Best practices and tips\n- Common pitfalls to avoid\n\n## Case Studies\n- Success stories\n- Lessons learned\n- Measurable outcomes\n\n## Future Trends\n- Emerging developments in ${cleanTopic}\n- Predictions for the next 5 years\n- How to stay ahead of the curve\n\n## Resources for Further Learning\n- Books and publications\n- Online courses\n- Communities and forums`
                ],
                paragraph: [
                    `${cleanTopic} has revolutionized the way we think about innovation and progress. By combining cutting-edge technology with human-centered design principles, ${cleanTopic} offers solutions that were previously unimaginable. Experts in the field suggest that the impact of ${cleanTopic} will continue to grow exponentially in the coming years, touching virtually every aspect of our personal and professional lives. What makes ${cleanTopic} particularly fascinating is its adaptability across different contexts and industries, from healthcare and education to finance and entertainment. As more organizations recognize the potential of ${cleanTopic}, we're seeing unprecedented investment in research and development, leading to breakthroughs that push the boundaries of what's possible.`,
                    
                    `The fascinating world of ${cleanTopic} continues to captivate researchers and enthusiasts alike. Recent studies have shown that ${cleanTopic} not only enhances our understanding of complex systems but also provides practical frameworks for solving real-world problems. When examining ${cleanTopic} in detail, we find that its core principles are both elegant and profound, offering insights that transcend traditional disciplinary boundaries. Perhaps most importantly, ${cleanTopic} encourages us to question our assumptions and look at familiar challenges from entirely new perspectives. This paradigm shift has already led to significant breakthroughs in fields ranging from medicine to environmental science, demonstrating the far-reaching implications of ${cleanTopic} for our collective future.`,
                    
                    `${cleanTopic} stands at the intersection of innovation and practicality, offering solutions that address some of today's most pressing challenges. What distinguishes ${cleanTopic} from other approaches is its holistic perspective, considering not just immediate outcomes but long-term sustainability and impact. Researchers working on ${cleanTopic} have identified several key factors that contribute to its effectiveness, including adaptability, scalability, and user-centered design. These elements work together to create systems that not only perform well in controlled environments but thrive in the complex, unpredictable conditions of the real world. As we continue to explore the potential of ${cleanTopic}, we're discovering new applications and use cases that extend far beyond its original conception.`
                ],
                custom: [
                    `You've asked about ${cleanTopic}, which is an excellent topic for exploration. When we consider ${cleanTopic} in depth, several important aspects emerge that deserve careful consideration. First, the conceptual framework of ${cleanTopic} provides a foundation for understanding its broader implications. Second, the practical applications demonstrate how theoretical principles translate into real-world impact. Finally, the evolving nature of ${cleanTopic} points to future developments that may reshape our current understanding. By examining these dimensions, we gain a more comprehensive appreciation of ${cleanTopic} and its significance in contemporary discourse.`,
                    
                    `${cleanTopic} represents a fascinating area of study that continues to evolve and expand. When analyzing ${cleanTopic}, it's important to consider both its historical context and its future trajectory. The development of ${cleanTopic} has been influenced by numerous factors, including technological advancements, changing social dynamics, and shifting economic priorities. These influences have shaped not only how we understand ${cleanTopic} but also how we implement and leverage its principles in various contexts. As we look ahead, the continued evolution of ${cleanTopic} promises to bring new insights and opportunities that could transform our approach to related challenges and opportunities.`
                ]
            };
            
            // Select the appropriate template type or default to 'custom'
            const templateType = type in templates ? type : 'custom';
            
            // Randomly select one of the templates for the chosen type
            const templateOptions = templates[templateType as keyof typeof templates];
            const randomIndex = Math.floor(Math.random() * templateOptions.length);
            
            return templateOptions[randomIndex];
        };

        // Generate content based on the prompt and type
        const generatedContent = generateContent(prompt, promptType || 'topic');
        
        return c.json({ content: generatedContent });
    } catch (error) {
        console.error('AI assistant error:', error);
        c.status(500);
        return c.json({ message: "Failed to generate content" });
    }
});
