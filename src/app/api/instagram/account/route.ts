import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSocialAccount, saveSocialAccount } from "@/lib/db/social";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let account = await getSocialAccount(session.userId);
  if (!account) {
    // Return or initialize default sandbox account for immediate prototyping
    account = await saveSocialAccount(session.userId, {
      accountId: "17841405309211844",
      accountName: `${session.name || "Creator"}'s Studio`,
      accountUsername: "vidyamotion.reels",
      isSandbox: true,
    });
  }

  return NextResponse.json({
    account: {
      ...account,
      hasLiveToken: Boolean(account.accessToken),
      accessToken: account.accessToken ? `••••••••${account.accessToken.slice(-4)}` : "",
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    let finalToken = body.accessToken?.trim();
    let finalAccountId = body.accountId?.trim();
    let finalUsername = body.accountUsername?.trim();
    let tokenType = "standard";

    const appId = process.env.META_APP_ID?.trim();
    const appSecret = process.env.META_APP_SECRET?.trim();

    // If a token was provided, attempt to automatically exchange it for a 60-day or permanent token
    if (finalToken && appId && appSecret) {
      try {
        // Step 1: Exchange short-lived token for 60-Day Long-Lived Token
        const exchangeUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
        exchangeUrl.searchParams.set("grant_type", "fb_exchange_token");
        exchangeUrl.searchParams.set("client_id", appId);
        exchangeUrl.searchParams.set("client_secret", appSecret);
        exchangeUrl.searchParams.set("fb_exchange_token", finalToken);

        const exRes = await fetch(exchangeUrl.toString());
        const exData = await exRes.json();
        if (exData.access_token) {
          finalToken = exData.access_token;
          tokenType = "60-day-long-lived";
          console.log("Successfully exchanged Meta token for 60-day long-lived token.");
        }

        // Step 2: Check if this token manages a Facebook Page with a linked Instagram Business Account
        // Page access tokens derived from long-lived user tokens NEVER EXPIRE!
        const pagesUrl = new URL("https://graph.facebook.com/v21.0/me/accounts");
        pagesUrl.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username,name}");
        pagesUrl.searchParams.set("access_token", finalToken);

        const pagesRes = await fetch(pagesUrl.toString());
        const pagesData = await pagesRes.json();

        if (Array.isArray(pagesData.data)) {
          for (const page of pagesData.data) {
            const ig = page.instagram_business_account;
            if (ig && ig.id) {
              // If accountId was not set or matches this IG, upgrade to the permanent Page token
              if (!finalAccountId || finalAccountId === ig.id) {
                finalAccountId = ig.id;
                if (ig.username && !finalUsername) finalUsername = ig.username;
                if (page.access_token) {
                  finalToken = page.access_token;
                  tokenType = "permanent-page-token";
                  console.log(`Discovered linked Instagram @${ig.username || ig.id} with permanent Page Token!`);
                }
                break;
              }
            }
          }
        }
      } catch (tokenExchangeErr) {
        console.warn("Auto-token extension attempt failed, using provided token directly:", tokenExchangeErr);
      }
    }

    const account = await saveSocialAccount(session.userId, {
      accountId: finalAccountId || body.accountId,
      accountName: body.accountName || (finalUsername ? `@${finalUsername}` : undefined),
      accountUsername: finalUsername || body.accountUsername,
      accessToken: finalToken,
      isSandbox: Boolean(body.isSandbox && !finalToken),
    });

    return NextResponse.json({
      success: true,
      account,
      tokenType,
      message:
        tokenType === "permanent-page-token"
          ? "Connected with permanent (never-expiring) Page Token!"
          : tokenType === "60-day-long-lived"
          ? "Exchanged for 60-day Long-Lived Token!"
          : "Saved account settings successfully.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update social account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
