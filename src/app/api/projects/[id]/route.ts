import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProjectById, deleteProject } from "@/lib/db/projects";

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

  return NextResponse.json({ project, storyboard });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteProject(session.userId, id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Project not found or not owned by user" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Project and all associated media deleted successfully",
  });
}
