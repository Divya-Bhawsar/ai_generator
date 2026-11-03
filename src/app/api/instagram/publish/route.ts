import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProjectById } from "@/lib/db/projects";
import { getSocialAccount } from "@/lib/db/social";
import { publishReelToMetaGraphAPI } from "@/lib/social/instagram";
import { getDatabase, isMongoConfigured } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, caption } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const { project } = await getProjectById(session.userId, projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.videoUrl) {
      return NextResponse.json(
        { error: "No rendered video found for this project. Please generate the video first." },
        { status: 400 }
      );
    }

    // Determine public video URL
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const publicVideoUrl = project.videoUrl.startsWith("http")
      ? project.videoUrl
      : `${protocol}://${host}${project.videoUrl}`;

    // Get user's connected social account
    const socialAccount = await getSocialAccount(session.userId);

    // Caption fallback
    const finalCaption =
      caption ||
      project.socialPackage?.fullCaption ||
      `${project.title} - Learn this in 60 seconds! #education #reels`;

    // Publish to Meta Graph API (or Developer Sandbox)
    const result = await publishReelToMetaGraphAPI({
      videoUrl: publicVideoUrl,
      caption: finalCaption,
      accountId: body.accountId || socialAccount?.accountId,
      accessToken: body.accessToken || socialAccount?.accessToken,
    });

    // Save Instagram URL to project record
    if (isMongoConfigured()) {
      try {
        const db = await getDatabase();
        if (db) {
          let q: Record<string, unknown> = { ownerId: session.userId };
          if (ObjectId.isValid(projectId)) q._id = new ObjectId(projectId);
          else q._id = projectId;

          await db.collection("projects").updateOne(q, {
            $set: {
              instagramReelUrl: result.instagramReelUrl,
              instagramMediaId: result.mediaId,
              publishedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      } catch (dbErr) {
        console.warn("MongoDB update instagramReelUrl error:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      instagramReelUrl: result.instagramReelUrl,
      mediaId: result.mediaId,
      isSandbox: result.isSandbox,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to publish Reel to Instagram";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
