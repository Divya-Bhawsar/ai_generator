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
    const account = await saveSocialAccount(session.userId, {
      accountId: body.accountId,
      accountName: body.accountName,
      accountUsername: body.accountUsername,
      accessToken: body.accessToken,
      isSandbox: body.isSandbox,
    });

    return NextResponse.json({ success: true, account });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update social account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
