import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createProject, listProjects, saveStoryboard } from "@/lib/db/projects";
import { generateStoryboardAI } from "@/lib/ai/storyboard";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await listProjects(session.userId);
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { topic, title, generateImmediately } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide a topic for your explainer video." },
        { status: 400 }
      );
    }

    // Create the project in draft state
    const project = await createProject({
      ownerId: session.userId,
      topic: topic.trim(),
      title: title?.trim(),
    });

    let storyboard = null;

    // If requested, generate the initial storyboard immediately
    if (generateImmediately !== false) {
      try {
        const aiOutput = await generateStoryboardAI(topic.trim());
        storyboard = await saveStoryboard({
          projectId: project._id,
          ownerId: session.userId,
          title: aiOutput.title,
          scenes: aiOutput.scenes,
        });
      } catch (err: unknown) {
        console.warn("AI generation failed during project creation:", err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        project,
        storyboard,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create project.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
