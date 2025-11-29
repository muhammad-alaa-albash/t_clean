import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyPassword, signAccessToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { signInSchema } from "@/lib/validation/auth";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parseResult = signInSchema.safeParse(json);

    if (!parseResult.success) {
      return errorResponse(
        400,
        "Validation error",
        "VALIDATION_ERROR",
        parseResult.error.format()
      );
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findFirst({
      where: {
        email,
        isDeleted: false,
      },
    });

    if (!user) {
      return errorResponse(
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS"
      );
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return errorResponse(
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS"
      );
    }

    const token = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse("User logged in successfully", {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return errorResponse(500, "Internal server error", "INTERNAL_SERVER_ERROR");
  }
}
