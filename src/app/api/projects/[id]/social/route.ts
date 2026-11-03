import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProjectById, saveSocialPackage, SocialPackage } from "@/lib/db/projects";
import { generateSocialPackageAI, formatFullCaption } from "@/lib/ai/social";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { project, storyboard } = await getProjectById(session.userId, id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // If already generated and cached, return it directly
  if (project.socialPackage) {
    return NextResponse.json({ socialPackage: project.socialPackage });
  }

  // Auto-generate on first fetch
  try {
    const scenes = storyboard?.scenes || [];
    const generated = await generateSocialPackageAI(
      project.topic,
      storyboard?.title || project.title,
      scenes,
      project.targetAudience || "general"
    );

    await saveSocialPackage(session.userId, id, generated);
    return NextResponse.json({ socialPackage: generated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate social package";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { project, storyboard } = await getProjectById(session.userId, id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // If manual edits are provided
    if (body.hook || body.takeaways || body.callToAction || body.hashtags) {
      const hook = String(body.hook || project.socialPackage?.hook || "").trim();
      const takeaways = Array.isArray(body.takeaways)
        ? body.takeaways.map(String)
        : project.socialPackage?.takeaways || [];
      const callToAction = String(
        body.callToAction || project.socialPackage?.callToAction || ""
      ).trim();
      const hashtags = Array.isArray(body.hashtags)
        ? body.hashtags.map(String)
        : project.socialPackage?.hashtags || [];

      const fullCaption =
        body.fullCaption?.trim() ||
        formatFullCaption(hook, takeaways, callToAction, hashtags);

      const updatedPackage: SocialPackage = {
        hook,
        takeaways,
        callToAction,
        hashtags,
        fullCaption,
        generatedAt: new Date().toISOString(),
      };

      await saveSocialPackage(session.userId, id, updatedPackage);
      return NextResponse.json({ success: true, socialPackage: updatedPackage });
    }

    // Otherwise, generate/regenerate via AI
    const scenes = storyboard?.scenes || [];
    const generated = await generateSocialPackageAI(
      project.topic,
      storyboard?.title || project.title,
      scenes,
      body.targetAudience || project.targetAudience || "general"
    );

    await saveSocialPackage(session.userId, id, generated);
    return NextResponse.json({ success: true, socialPackage: generated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update social package";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
