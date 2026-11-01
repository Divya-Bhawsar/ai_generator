import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProjectById, updateStoryboardScenes } from "@/lib/db/projects";
import { generateSceneVisualAI } from "@/lib/ai/storyboard";

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
      { error: "Project or storyboard not found" },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { sceneIndex, userHint, narration, title } = body;

    if (
      typeof sceneIndex !== "number" ||
      sceneIndex < 0 ||
      sceneIndex >= storyboard.scenes.length
    ) {
      return NextResponse.json(
        { error: "Invalid scene index provided" },
        { status: 400 }
      );
    }

    const currentScene = storyboard.scenes[sceneIndex];
    const sceneNarration = narration || currentScene.narration;
    const sceneTitle = title || currentScene.title;

    const generated = await generateSceneVisualAI(
      project.topic,
      sceneTitle,
      sceneNarration,
      userHint
    );

    const updatedScenes = [...storyboard.scenes];
    updatedScenes[sceneIndex] = {
      ...currentScene,
      title: sceneTitle,
      narration: sceneNarration,
      svgCode: generated.svgCode,
      diagram: currentScene.diagram
        ? {
            ...currentScene.diagram,
            svg_code: generated.svgCode,
            headline: generated.headline || currentScene.diagram.headline,
            badge: generated.badge || currentScene.diagram.badge,
          }
        : {
            diagram_type: "metric_card",
            headline: generated.headline,
            badge: generated.badge,
            svg_code: generated.svgCode,
          },
    };

    const saved = await updateStoryboardScenes(session.userId, id, updatedScenes);

    return NextResponse.json({
      success: true,
      svgCode: generated.svgCode,
      scenes: saved?.scenes || updatedScenes,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to redraw scene visual";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
