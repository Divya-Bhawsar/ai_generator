import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveSocialAccount } from "@/lib/db/social";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Retrieve state cookie
  const storedState = req.cookies.get("ig_oauth_state")?.value;

  let returnTo = "/dashboard";
  let targetUserId = "";

  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      returnTo = decoded.returnTo || "/dashboard";
      targetUserId = decoded.userId || "";
    } catch {
      // ignore
    }
  }

  // Handle user cancellation or Meta denial
  if (error) {
    const errorMsg = encodeURIComponent(errorDescription || error || "Instagram authorization was canceled");
    return NextResponse.redirect(new URL(`${returnTo}?oauth_error=${errorMsg}`, req.url));
  }

  if (!code || !state || state !== storedState) {
    const errorMsg = encodeURIComponent("Security check failed: Invalid OAuth state or missing code.");
    return NextResponse.redirect(new URL(`${returnTo}?oauth_error=${errorMsg}`, req.url));
  }

  const session = await getSession();
  const userId = session?.userId || targetUserId;
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in?redirect=/dashboard", req.url));
  }

  const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    const errorMsg = encodeURIComponent("Meta App ID and Secret not configured in server environment.");
    return NextResponse.redirect(new URL(`${returnTo}?oauth_error=${errorMsg}`, req.url));
  }

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/api/instagram/oauth/callback`;

  try {
    // Step 1: Exchange auth code for short-lived access token
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error?.message || "Failed to exchange authorization code for access token");
    }

    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange short-lived token for 60-day Long-Lived Token
    const longTokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longTokenUrl.searchParams.set("client_id", appId);
    longTokenUrl.searchParams.set("client_secret", appSecret);
    longTokenUrl.searchParams.set("fb_exchange_token", shortLivedToken);

    const longRes = await fetch(longTokenUrl.toString());
    const longData = await longRes.json();
    const finalAccessToken = longData.access_token || shortLivedToken;

    // Step 3: Fetch linked Facebook Pages and their attached Instagram Business Account
    const accountsUrl = new URL("https://graph.facebook.com/v21.0/me/accounts");
    accountsUrl.searchParams.set("fields", "id,name,instagram_business_account{id,username,name,profile_picture_url}");
    accountsUrl.searchParams.set("access_token", finalAccessToken);

    const accountsRes = await fetch(accountsUrl.toString());
    const accountsData = await accountsRes.json();

    interface PageEntry {
      id: string;
      name: string;
      instagram_business_account?: {
        id: string;
        username?: string;
        name?: string;
        profile_picture_url?: string;
      };
    }

    const pages: PageEntry[] = accountsData.data || [];
    const connectedPage = pages.find((p) => p.instagram_business_account?.id);

    if (!connectedPage || !connectedPage.instagram_business_account) {
      const warningMsg = encodeURIComponent(
        "Facebook account connected, but no Instagram Professional account was found linked to your Facebook Pages. Make sure your Instagram account is switched to Creator/Business and linked to a Facebook Page."
      );
      return NextResponse.redirect(new URL(`${returnTo}?oauth_warning=${warningMsg}`, req.url));
    }

    const igAccount = connectedPage.instagram_business_account;

    // Step 4: Persist the Live Connected Instagram Account
    await saveSocialAccount(userId, {
      accountId: igAccount.id,
      accountName: igAccount.name || connectedPage.name || "Instagram Account",
      accountUsername: igAccount.username || "instagram.creator",
      accessToken: finalAccessToken,
      isSandbox: false,
    });

    const response = NextResponse.redirect(
      new URL(`${returnTo}?instagram_connected=true&ig_handle=${encodeURIComponent(igAccount.username || "")}`, req.url)
    );
    response.cookies.delete("ig_oauth_state");
    return response;
  } catch (err: unknown) {
    console.error("Meta OAuth callback exception:", err);
    const msg = encodeURIComponent(err instanceof Error ? err.message : "Failed to complete Instagram authorization");
    return NextResponse.redirect(new URL(`${returnTo}?oauth_error=${msg}`, req.url));
  }
}
