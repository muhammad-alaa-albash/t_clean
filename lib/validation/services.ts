import { z } from "zod";

export const serviceCreateSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  price: z.number().nonnegative().optional(),
  companyId: z.number().int().positive(),
});

export const serviceUpdateSchema = serviceCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
