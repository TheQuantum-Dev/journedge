// app/api/update/restart/route.ts
// Gracefully exits the Next.js process.
// - With nodemon / pm2 / concurrently --restart: auto-restarts
// - With plain "npm run dev": user must re-run manually
// The 200ms delay ensures the HTTP response is flushed before exit.

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "Server is restarting. Refresh in a few seconds.",
  });
  setTimeout(() => process.exit(0), 200);
  return response;
}