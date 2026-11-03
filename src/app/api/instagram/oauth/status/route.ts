import { NextResponse } from "next/server";

export async function GET() {
  const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return NextResponse.json({
    isOAuthConfigured: Boolean(appId && appSecret),
    appId: appId ? `${appId.slice(0, 4)}••••${appId.slice(-4)}` : null,
    redirectUri: `${appUrl}/api/instagram/oauth/callback`,
    appUrl,
  });
}
