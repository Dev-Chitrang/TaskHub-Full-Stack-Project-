import { z } from "zod"

export const signInSchema = z.object({
    email: z.email("Invalid email"),
    password: z.string().min(6, "Password is required")
})

export const signUpSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be of 8 characters"),
    name: z.string().min(3, "Name must be atleast 3 characters"),
    confirmPassword: z.string().min(8, "Password must be of 8 characters"),
    is2FAEnabled: z.boolean().optional()
}).refine((val) => val.confirmPassword === val.password, {
    path: ['confirmPassword'],
    message: "Passwords do not match",
})


export const forgotPasswordSchema = z.object({
    email: z.email("Invalid email"),
})

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, "Password must be of 8 characters"),
    confirmPassword: z.string().min(8, "Password must be of 8 characters"),
}).refine((val) => val.confirmPassword === val.newPassword, {
    path: ['confirmPassword'],
    message: "Passwords do not match",
})

export const createWorkspaceSchema = z.object({
    name: z.string().min(3, "Name must be atleast 3 characters"),
    color: z.string().min(3, "Color must be atleast 3 characters"),
    description: z.string().optional(),
})

export const createProjectSchema = z.object({
    title: z.string().min(3, "Title must be atleast 3 characters"),
    description: z.string().optional(),
    status: z.enum(["planning", "in_progress", "completed", "on-hold", "cancelled"]),

    start_date: z.date({ required_error: "Start date is required" })
        .optional(),


    due_date: z.date({ required_error: "Due date is required" })
        .optional(),

    members: z.array(z.object({
        user_id: z.string(),
        role: z.enum(["manager", "contributor", "viewer"]),
        name: z.string(),
    })).optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
        if (!val) return []
        if (typeof val === "string") {
            return val.split(",").map((tag) => tag.trim()).filter(Boolean)
        }
        return val
    }),
})


export const createTaskSchema = z.object({
    title: z.string().min(1, "Task title is required"),
    description: z.string().optional(),
    status: z.enum(["todo", "in_progress", "done"]),
    priority: z.enum(["high", "medium", "low"]),
    due_date: z.date({ required_error: "Due date is required" }),
    assignees: z.array(z.string()).min(1, "Atleast one assignee is required"),
})

export const InviteMemberSchema = z.object({
    email: z.string().email("Invalid email"),
    role: z.enum(['admin', 'member', 'viewer']),
})

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(8, "Password must be of 8 characters"),
    newPassword: z.string().min(8, "Password must be of 8 characters"),
    confirmPassword: z.string().min(8, "Password must be of 8 characters"),
}).refine((val) => val.confirmPassword === val.newPassword, {
    path: ['confirmPassword'],
    message: "Passwords do not match",
})
