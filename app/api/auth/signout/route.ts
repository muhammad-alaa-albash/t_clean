import { NextRequest } from "next/server";

import { successResponse } from "@/lib/api-response";

export async function POST(_req: NextRequest) {
  return successResponse("User signed out successfully");
}
