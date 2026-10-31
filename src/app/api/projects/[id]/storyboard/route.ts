import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProjectById, saveStoryboard, updateStoryboardScenes } from "@/lib/db/projects";
import { generateStoryboardAI } from "@/lib/ai/storyboard";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { project } = await getProjectById(session.userId, id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const aiOutput = await generateStoryboardAI(project.topic);
    const storyboard = await saveStoryboard({
      projectId: project._id,
      ownerId: session.userId,
      title: aiOutput.title,
      scenes: aiOutput.scenes,
      revisionPrompt: "Initial generation",
    });

    return NextResponse.json({ success: true, storyboard });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate storyboard";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { scenes } = body;

  if (!Array.isArray(scenes) || scenes.length === 0) {
    return NextResponse.json({ error: "Invalid scenes array" }, { status: 400 });
  }

  const updated = await updateStoryboardScenes(session.userId, id, scenes);
  if (!updated) {
    return NextResponse.json({ error: "Failed to update storyboard" }, { status: 404 });
  }

  return NextResponse.json({ success: true, storyboard: updated });
}
