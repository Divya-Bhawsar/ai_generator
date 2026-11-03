import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

  const returnTo = req.nextUrl.searchParams.get("returnTo") || "/dashboard";

  if (!appId || !appSecret) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "Meta App Credentials are not configured yet. Add META_APP_ID and META_APP_SECRET to your .env.local file.",
      },
      { status: 400 }
    );
  }

  // Determine base public URL
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/api/instagram/oauth/callback`;

  // Generate CSRF state
  const statePayload = {
    userId: session.userId,
    returnTo,
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

  // Meta permissions required for Instagram Reels Publishing
  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
  ].join(",");

  const metaAuthUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  metaAuthUrl.searchParams.set("client_id", appId);
  metaAuthUrl.searchParams.set("redirect_uri", redirectUri);
  metaAuthUrl.searchParams.set("scope", scopes);
  metaAuthUrl.searchParams.set("response_type", "code");
  metaAuthUrl.searchParams.set("state", state);

  // Set CSRF verification cookie
  const response = NextResponse.redirect(metaAuthUrl.toString());
  response.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
