import { z } from "zod";

const serviceBaseSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  price: z.number().nonnegative(),
});

export const serviceCreateSchema = serviceBaseSchema.extend({
  companyIds: z.array(z.number().int().positive()).nonempty(),
});

export const serviceUpdateSchema = serviceBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
