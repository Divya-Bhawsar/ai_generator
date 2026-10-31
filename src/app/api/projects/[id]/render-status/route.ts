import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDatabase, isMongoConfigured } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const statusPath = path.join(process.cwd(), "public", "renders", `${id}_status.json`);

  if (!fs.existsSync(statusPath)) {
    return NextResponse.json({
      status: "idle",
      progress: 0,
      stage: "Not rendered yet",
      videoUrl: "",
      duration: 0,
    });
  }

  try {
    const raw = fs.readFileSync(statusPath, "utf-8");
    const data = JSON.parse(raw);

    // If ready, sync with MongoDB
    if (data.status === "ready" && data.videoUrl && isMongoConfigured()) {
      try {
        const db = await getDatabase();
        if (db) {
          let q: Record<string, unknown> = { ownerId: session.userId };
          if (ObjectId.isValid(id)) q._id = new ObjectId(id);
          else q._id = id;

          await db.collection("projects").updateOne(q, {
            $set: {
              status: "ready",
              videoUrl: data.videoUrl,
              durationSeconds: data.duration,
              updatedAt: new Date(),
            },
          });
        }
      } catch (err) {
        console.warn("Error updating project ready state in MongoDB:", err);
      }
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error reading status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
