import { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);

  if ("error" in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  return successResponse("Profile fetched successfully", {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}
