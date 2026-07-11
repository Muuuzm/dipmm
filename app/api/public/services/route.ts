import { NextResponse } from "next/server";
import { getPublicServices } from "@/lib/public-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json({
    services: await getPublicServices({ bookableOnly: searchParams.get("bookable") === "true" })
  });
}
