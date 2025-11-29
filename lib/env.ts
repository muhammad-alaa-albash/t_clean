import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z
    .string()
    .default("3600")
    .transform((val) => {
      const num = Number(val);
      if (!Number.isFinite(num) || num <= 0) {
        throw new Error("JWT_EXPIRES_IN must be a positive number of seconds");
      }
      return num;
    }),
  BCRYPT_SALT_ROUNDS: z
    .string()
    .default("10")
    .transform((val) => {
      const num = Number(val);
      if (!Number.isInteger(num) || num <= 0) {
        throw new Error("BCRYPT_SALT_ROUNDS must be a positive integer");
      }
      return num;
    }),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
