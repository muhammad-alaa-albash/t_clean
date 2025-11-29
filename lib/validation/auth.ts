import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().min(3).max(255),
  email: z.string().email().max(255),
  password: z.string().min(6).max(255),
});

export const signInSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(255),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
