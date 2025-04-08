import { z } from "zod";

// User validation schemas
export const signupInput = z.object({
    username: z.string(),
    password: z.string().min(6),
    name: z.string().optional()
});

export type SignupInput = z.infer<typeof signupInput>;

export const signinInput = z.object({
    username: z.string(),
    password: z.string().min(6),
});

export type SigninInput = z.infer<typeof signinInput>;

// Profile validation schema
export const updateProfileInput = z.object({
    name: z.string().optional(),
    bio: z.string().optional(),
    avatar: z.union([z.string(), z.instanceof(File)]).optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileInput>;

// Blog validation schemas
export const createBlogInput = z.object({
    title: z.string(),
    content: z.string(),
    id: z.number().optional()
});

export type CreateBlogInput = z.infer<typeof createBlogInput>;

export const updateBlogInput = z.object({
    id: z.number(),
    title: z.string(),
    content: z.string(),
});

export type UpdateBlogInput = z.infer<typeof updateBlogInput>;

// Social interaction schemas
export const likeInput = z.object({
    blogId: z.number(),
    type: z.enum(['LIKE', 'DISLIKE'])
});

export type LikeInput = z.infer<typeof likeInput>;

export const commentInput = z.object({
    blogId: z.number(),
    content: z.string()
});

export type CommentInput = z.infer<typeof commentInput>;

// Response types
export type CreateUserInput = z.infer<typeof signupInput>;
export type UpdateUserInput = z.infer<typeof updateProfileInput>;