import { z } from "zod";

// User validation schemas
export const signupInput = z.object({
    username: z.string().min(3).max(30),
    password: z.string().min(6).max(100),
    name: z.string().min(1).max(50).optional()
});

export type SignupInput = z.infer<typeof signupInput>;

export const signinInput = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
});

export type SigninInput = z.infer<typeof signinInput>;

// Profile validation schema
export const updateProfileInput = z.object({
    name: z.string().min(1).max(50).optional(),
    bio: z.string().max(500).optional(),
    avatar: z.string().url().optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileInput>;

// Blog validation schemas
export const createBlogInput = z.object({
    title: z.string().min(3).max(100),
    content: z.string().min(10),
    id: z.number().optional()
});

export type CreateBlogInput = z.infer<typeof createBlogInput>;

export const updateBlogInput = z.object({
    id: z.number(),
    title: z.string().min(3).max(100),
    content: z.string().min(10),
});

export type UpdateBlogInput = z.infer<typeof updateBlogInput>;

// Social interaction schemas
export const likeInput = z.object({
    // blogId is taken from URL param in the backend route, remove from body validation
    // blogId: z.number(),
    type: z.enum(['LIKE', 'DISLIKE'])
});

export type LikeInput = z.infer<typeof likeInput>;

export const commentInput = z.object({
    content: z.string().min(1).max(1000)
});

export type CommentInput = z.infer<typeof commentInput>;

// Response types
export type CreateUserInput = z.infer<typeof signupInput>;
export type UpdateUserInput = z.infer<typeof updateProfileInput>;