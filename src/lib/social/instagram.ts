/**
 * Instagram Reels Publishing Engine (Meta Graph API v21.0)
 * Handles container creation, status polling, and feed publishing.
 */

export interface InstagramPublishResult {
  success: boolean;
  mediaId: string;
  instagramReelUrl: string;
  isSandbox: boolean;
  error?: string;
}

export async function publishReelToMetaGraphAPI({
  videoUrl,
  caption,
  accountId,
  accessToken,
}: {
  videoUrl: string;
  caption: string;
  accountId?: string;
  accessToken?: string;
}): Promise<InstagramPublishResult> {
  const finalToken = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
  const finalAccountId = accountId || process.env.INSTAGRAM_ACCOUNT_ID;

  // Real Meta Graph API Flow when token & account ID are configured
  if (finalToken && finalAccountId && !finalAccountId.startsWith("mock")) {
    try {
      // Step 1: Create Reels Media Container
      const createUrl = new URL(`https://graph.facebook.com/v21.0/${finalAccountId}/media`);
      createUrl.searchParams.set("media_type", "REELS");
      createUrl.searchParams.set("video_url", videoUrl);
      createUrl.searchParams.set("caption", caption);
      createUrl.searchParams.set("share_to_feed", "true");
      createUrl.searchParams.set("access_token", finalToken);

      const createRes = await fetch(createUrl.toString(), { method: "POST" });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.id) {
        throw new Error(createData.error?.message || "Failed to create Instagram media container");
      }

      const creationId = createData.id;

      // Step 2: Poll Container Status until FINISHED (up to 60s)
      let status = "IN_PROGRESS";
      let attempts = 0;
      while (status !== "FINISHED" && attempts < 20) {
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;

        const statusUrl = `https://graph.facebook.com/v21.0/${creationId}?fields=status_code,status&access_token=${finalToken}`;
        const statusRes = await fetch(statusUrl);
        const statusData = await statusRes.json();

        status = statusData.status_code || statusData.status || "IN_PROGRESS";
        if (status === "ERROR" || status === "EXPIRED") {
          throw new Error(statusData.error?.message || "Instagram media processing failed");
        }
      }

      // Step 3: Publish Media Container
      const publishUrl = new URL(`https://graph.facebook.com/v21.0/${finalAccountId}/media_publish`);
      publishUrl.searchParams.set("creation_id", creationId);
      publishUrl.searchParams.set("access_token", finalToken);

      const pubRes = await fetch(publishUrl.toString(), { method: "POST" });
      const pubData = await pubRes.json();
      if (!pubRes.ok || !pubData.id) {
        throw new Error(pubData.error?.message || "Failed to publish media container");
      }

      const mediaId = pubData.id;

      // Step 4: Retrieve Reel Permalink
      const permalinkUrl = `https://graph.facebook.com/v21.0/${mediaId}?fields=permalink&access_token=${finalToken}`;
      const permRes = await fetch(permalinkUrl);
      const permData = await permRes.json();
      const reelUrl = permData.permalink || `https://www.instagram.com/reel/${mediaId}/`;

      return {
        success: true,
        mediaId,
        instagramReelUrl: reelUrl,
        isSandbox: false,
      };
    } catch (err: unknown) {
      console.warn("Meta Graph API error, falling back to Sandbox Simulator:", err);
      // If live token fails, return error or fallback
      throw err;
    }
  }

  // Developer Sandbox Mode (Realistic Meta Graph API Simulation)
  // Simulates container processing time and returns a valid formatted Reel URL
  await new Promise((r) => setTimeout(r, 1200)); // Container creation delay
  await new Promise((r) => setTimeout(r, 1800)); // Video transcoding & bitrate check delay
  await new Promise((r) => setTimeout(r, 1000)); // Feed publication delay

  const randomHash = Math.random().toString(36).substring(2, 11).toUpperCase();
  const mockMediaId = `179${Date.now().toString().slice(-8)}`;
  const mockReelUrl = `https://www.instagram.com/reel/C_${randomHash}/`;

  return {
    success: true,
    mediaId: mockMediaId,
    instagramReelUrl: mockReelUrl,
    isSandbox: true,
  };
}
