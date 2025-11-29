import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashPassword, signAccessToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { signUpSchema } from "@/lib/validation/auth";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parseResult = signUpSchema.safeParse(json);

    if (!parseResult.success) {
      return errorResponse(
        400,
        "Validation error",
        "VALIDATION_ERROR",
        parseResult.error.format()
      );
    }

    const { fullName, email, password } = parseResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse(409, "Email already in use", "EMAIL_IN_USE");
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse("User created successfully", {
      token,
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return errorResponse(500, "Internal server error", "INTERNAL_SERVER_ERROR");
  }
}
