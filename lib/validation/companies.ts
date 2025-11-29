import { z } from "zod";

export const companyCreateSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  ownerId: z.number().int().positive().optional(),
});

export const companyUpdateSchema = companyCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
