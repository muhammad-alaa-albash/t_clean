import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";

export type JwtUserRole = "USER" | "ADMIN";

export interface JwtUserPayload {
  sub: number; // user id
  email: string;
  role: JwtUserRole;
}

export function signAccessToken(user: {
  id: number;
  email: string;
  role: JwtUserRole;
}) {
  const payload: JwtUserPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): JwtUserPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function authenticateRequest(
  req: NextRequest,
  options?: { requireAdmin?: boolean }
) {
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: errorResponse(
        401,
        "Missing or invalid Authorization header",
        "UNAUTHORIZED"
      ),
    } as const;
  }

  const token = authHeader.substring("Bearer ".length).trim();

  if (!token) {
    return {
      error: errorResponse(401, "Missing token", "UNAUTHORIZED"),
    } as const;
  }

  try {
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.isDeleted) {
      return {
        error: errorResponse(401, "User not found or inactive", "UNAUTHORIZED"),
      } as const;
    }

    if (options?.requireAdmin && user.role !== "ADMIN") {
      return {
        error: errorResponse(403, "Admin access required", "FORBIDDEN"),
      } as const;
    }

    return { user } as const;
  } catch {
    return {
      error: errorResponse(401, "Invalid or expired token", "UNAUTHORIZED"),
    } as const;
  }
}
