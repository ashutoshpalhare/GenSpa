import { z } from "zod";

/**
 * Validation rules shared by the browser (React Hook Form resolvers) and the API.
 * The server re-validates everything; client validation is only a UX convenience.
 */

export const emailSchema = z
  .string("Email is required")
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(255, "Email must be 255 characters or fewer")
  .pipe(z.email("Enter a valid email address"));

/** Indian mobile numbers. Accepts "98xxxxxxxx", "+91 98xxxxxxxx" or "098xxxxxxxx". */
export const indianPhoneSchema = z
  .string("Phone number is required")
  .trim()
  .transform((value) => value.replace(/[\s-]/g, "").replace(/^\+91/, "").replace(/^0/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));

export const passwordSchema = z
  .string("Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or fewer")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/\d/, "Password must include a number");

export const newsletterSubscribeSchema = z.object({
  email: emailSchema,
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
