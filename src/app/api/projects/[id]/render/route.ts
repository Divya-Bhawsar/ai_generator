import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProjectById } from "@/lib/db/projects";
import { getDatabase, isMongoConfigured } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

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

  const body = await req.json().catch(() => ({}));
  const voiceId = body.voiceId || "Q1NHvGuV9SzxtiSnVDEH";
  const voiceName = body.voiceName || "viraj";

  const rendersDir = path.join(process.cwd(), "public", "renders");
  const videosDir = path.join(process.cwd(), "public", "videos");
  fs.mkdirSync(rendersDir, { recursive: true });
  fs.mkdirSync(videosDir, { recursive: true });

  const storyboardPath = path.join(rendersDir, `${id}_storyboard.json`);
  const statusPath = path.join(rendersDir, `${id}_status.json`);
  const outputMp4Path = path.join(videosDir, `${id}.mp4`);

  // Write storyboard to disk for worker
  fs.writeFileSync(storyboardPath, JSON.stringify(storyboard, null, 2), "utf-8");

  // Initial status
  const initialStatus = {
    status: "rendering",
    progress: 5,
    stage: "Starting video render worker...",
    videoUrl: "",
    duration: 0,
    error: "",
  };
  fs.writeFileSync(statusPath, JSON.stringify(initialStatus, null, 2), "utf-8");

  // Update MongoDB status to rendering
  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        let q: Record<string, unknown> = { ownerId: session.userId };
        if (ObjectId.isValid(id)) q._id = new ObjectId(id);
        else q._id = id;

        await db.collection("projects").updateOne(q, {
          $set: {
            status: "rendering",
            voiceId,
            voiceName,
            updatedAt: new Date(),
          },
        });
      }
    } catch (err) {
      console.warn("Error updating project status to rendering in MongoDB:", err);
    }
  }

  // Spawn render worker detached in background
  const workerScript = path.join(process.cwd(), "src", "lib", "video", "render_worker.py");
  const child = spawn(
    "python3",
    [
      workerScript,
      "--project-id", id,
      "--voice-id", voiceId,
      "--voice-name", voiceName,
      "--storyboard-file", storyboardPath,
      "--output-mp4", outputMp4Path,
      "--status-file", statusPath,
    ],
    {
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ""}`,
      },
    }
  );

  child.unref();

  return NextResponse.json({
    success: true,
    status: "rendering",
    message: "Video rendering started",
  });
}
