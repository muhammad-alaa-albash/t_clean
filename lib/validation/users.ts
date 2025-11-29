import { z } from "zod";

export const userUpdateSchema = z
  .object({
    fullName: z.string().min(3).max(255).optional(),
    email: z.string().email().max(255).optional(),
    role: z.enum(["USER", "ADMIN"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
