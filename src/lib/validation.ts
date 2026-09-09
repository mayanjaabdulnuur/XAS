import { z } from "zod";

// Deliberately requires some complexity without being obnoxious about it.
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long") // bcrypt silently truncates beyond 72 bytes
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    level: z.enum(["O_LEVEL", "A_LEVEL"]),
    combinationId: z.string().uuid().optional().or(z.literal("")),
    acceptTerms: z
      .literal(true, {
        errorMap: () => ({ message: "You must accept the Terms of Use and policies" }),
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.level !== "A_LEVEL" || !!data.combinationId, {
    message: "Select an A Level combination",
    path: ["combinationId"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().length(6).regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const documentUploadSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  level: z.enum(["O_LEVEL", "A_LEVEL"]),
  subjectId: z.string().uuid("Select a subject"),
  resourceType: z.enum(["NOTES", "PAST_PAPER", "REVISION_MATERIAL", "STUDY_GUIDE", "OTHER"]),
  year: z.coerce.number().int().min(1990).max(2100).optional(),
  copyrightConfirmed: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you have the right to share this document" }),
  }),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(2000),
});

export const ratingSchema = z.object({
  stars: z.coerce.number().int().min(1).max(5),
});

export const reportSchema = z.object({
  reason: z.enum([
    "COPYRIGHT",
    "INAPPROPRIATE",
    "INCORRECT_MISLEADING",
    "SPAM",
    "MALWARE_SECURITY",
    "DUPLICATE",
    "OTHER",
  ]),
  details: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const premiumCodeCreateSchema = z.object({
  durationDays: z.union([z.literal("none"), z.coerce.number().int().min(1).max(3650)]),
});

export const premiumActivateSchema = z.object({
  code: z.string().trim().min(1, "Enter your premium code"),
});

// ===================== Phase 6: admin =====================

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const adminOtpVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const documentRejectSchema = z.object({
  reason: z.string().trim().min(1, "Give a reason for rejecting this document").max(500),
});

export const subjectUpsertSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  level: z.enum(["O_LEVEL", "A_LEVEL"]),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

export const combinationUpsertSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Code is required").max(20),
  name: z.string().trim().min(1, "Name is required").max(200),
});

export const resourceCategoryUpsertSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
});

export const siteSettingUpsertSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.string().trim().max(2000),
});

export const reportStatusUpdateSchema = z.object({
  status: z.enum(["OPEN", "REVIEWED", "DISMISSED", "ACTIONED"]),
});

// ===================== Phase 7: scholar profile/settings =====================

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72)
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
