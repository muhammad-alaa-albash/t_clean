import { NextRequest } from "next/server";

import { successResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  void req;
  return successResponse("User signed out successfully");
}
