import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Profile persistence is handled locally for this MVP.",
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    status: "saved",
    received: body,
    savedAt: new Date().toISOString(),
  });
}
