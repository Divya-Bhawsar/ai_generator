import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProjectById, saveStoryboard, updateProjectAudience } from "@/lib/db/projects";
import { reviseStoryboardAI } from "@/lib/ai/storyboard";

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
  if (!project || !storyboard) {
    return NextResponse.json(
      { error: "Project or existing storyboard not found" },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { revisionPrompt, targetAudience } = body;

    if (!revisionPrompt || typeof revisionPrompt !== "string") {
      return NextResponse.json(
        { error: "Please enter a revision instruction" },
        { status: 400 }
      );
    }

    const audience = targetAudience || project.targetAudience || "general";
    if (targetAudience && targetAudience !== project.targetAudience) {
      await updateProjectAudience(session.userId, id, targetAudience);
    }

    const aiOutput = await reviseStoryboardAI(
      storyboard.title,
      storyboard.scenes,
      revisionPrompt.trim(),
      audience
    );

    const updatedStoryboard = await saveStoryboard({
      projectId: project._id,
      ownerId: session.userId,
      title: aiOutput.title,
      scenes: aiOutput.scenes,
      revisionPrompt: revisionPrompt.trim(),
    });

    return NextResponse.json({ success: true, storyboard: updatedStoryboard, targetAudience: audience });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to apply revision";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
