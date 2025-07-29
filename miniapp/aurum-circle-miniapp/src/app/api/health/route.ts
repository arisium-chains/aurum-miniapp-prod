import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Aurum Circle API is healthy",
    timestamp: new Date().toISOString(),
    services: {
      app: "running",
      ml_api: "running",
      face_detection: "running",
      face_embedding: "running",
    },
  });
}
