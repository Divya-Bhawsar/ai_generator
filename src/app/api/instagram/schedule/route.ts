import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProjectById } from "@/lib/db/projects";
import {
  createScheduledPost,
  listScheduledPosts,
  deleteScheduledPost,
} from "@/lib/db/social";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await listScheduledPosts(session.userId);
  return NextResponse.json({ scheduledPosts: posts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, scheduledTime, caption } = body;

    if (!projectId || !scheduledTime) {
      return NextResponse.json(
        { error: "projectId and scheduledTime are required" },
        { status: 400 }
      );
    }

    const { project } = await getProjectById(session.userId, projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.videoUrl) {
      return NextResponse.json(
        { error: "No rendered video found for this project. Please generate video first." },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledTime);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: "Invalid scheduledTime format" }, { status: 400 });
    }

    const finalCaption =
      caption ||
      project.socialPackage?.fullCaption ||
      `${project.title} - Learn this in 60 seconds! #education #reels`;

    const scheduledPost = await createScheduledPost({
      userId: session.userId,
      projectId: project._id,
      projectTitle: project.title,
      videoUrl: project.videoUrl,
      caption: finalCaption,
      scheduledFor: scheduledDate,
    });

    return NextResponse.json({
      success: true,
      scheduledPostId: scheduledPost._id,
      status: "SCHEDULED",
      scheduledPost,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to schedule post";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const success = await deleteScheduledPost(session.userId, postId);
  return NextResponse.json({ success });
}
