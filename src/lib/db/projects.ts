import { getDatabase, isMongoConfigured } from "../mongodb";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import type { DiagramConfig } from "../video/remotion/contracts";

export type ProjectStatus =
  | "draft"
  | "generating_storyboard"
  | "storyboard_ready"
  | "rendering"
  | "ready"
  | "failed";

export interface ProjectRecord {
  _id: string;
  ownerId: string;
  title: string;
  topic: string;
  targetAudience?: string;
  status: ProjectStatus;
  currentVersion: number;
  voiceId?: string;
  voiceName?: string;
  videoUrl?: string;
  durationSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SceneRecord {
  sceneId: string;
  sequence: number;
  title: string;
  narration: string;
  visualLabel: string;
  visualType: string;
  accentWords: string[];
  estimatedSeconds: number;
  cue?: string;
  search?: {
    values: number[];
    target: number;
    step: number;
    mode: "setup" | "compare" | "result";
    decisionCue?: string;
  };
  comparison?: {
    left: { heading: string; points: string[] };
    right: { heading: string; points: string[] };
  };
  science?: {
    badge?: string;
    headline?: string;
    vectorLabel?: string;
    points?: string[];
  };
  diagram?: DiagramConfig;
}

export interface StoryboardRecord {
  _id: string;
  projectId: string;
  ownerId: string;
  version: number;
  title: string;
  targetSeconds: number;
  estimatedSeconds: number;
  scenes: SceneRecord[];
  revisionPrompt?: string;
  createdAt: Date;
}

// In-memory fallback
const memoryProjects = new Map<string, ProjectRecord>();
const memoryStoryboards = new Map<string, StoryboardRecord[]>();

export async function createProject(data: {
  ownerId: string;
  topic: string;
  title?: string;
  targetAudience?: string;
}): Promise<ProjectRecord> {
  const now = new Date();
  const title =
    data.title?.trim() ||
    data.topic.slice(0, 50).trim() + (data.topic.length > 50 ? "..." : "");
  const targetAudience = data.targetAudience?.trim() || "general";

  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        const doc = {
          ownerId: data.ownerId,
          topic: data.topic.trim(),
          title,
          targetAudience,
          status: "draft" as ProjectStatus,
          currentVersion: 1,
          createdAt: now,
          updatedAt: now,
        };
        const result = await db.collection("projects").insertOne(doc);
        return {
          _id: result.insertedId.toString(),
          ...doc,
        };
      }
    } catch (err) {
      console.warn("MongoDB createProject error, using memory fallback:", err);
    }
  }

  const id = new ObjectId().toString();
  const record: ProjectRecord = {
    _id: id,
    ownerId: data.ownerId,
    topic: data.topic.trim(),
    title,
    targetAudience,
    status: "draft",
    currentVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
  memoryProjects.set(id, record);
  return record;
}

export async function listProjects(ownerId: string): Promise<ProjectRecord[]> {
  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        const docs = await db
          .collection("projects")
          .find({ ownerId })
          .sort({ updatedAt: -1 })
          .toArray();
        return docs.map((d) => ({
          _id: d._id.toString(),
          ownerId: d.ownerId,
          title: d.title,
          topic: d.topic,
          targetAudience: d.targetAudience || "general",
          status: d.status,
          currentVersion: d.currentVersion || 1,
          videoUrl: d.videoUrl,
          durationSeconds: d.durationSeconds,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }));
      }
    } catch (err) {
      console.warn("MongoDB listProjects error, using memory fallback:", err);
    }
  }

  const list: ProjectRecord[] = [];
  for (const p of memoryProjects.values()) {
    if (p.ownerId === ownerId) {
      list.push(p);
    }
  }
  return list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getProjectById(
  ownerId: string,
  projectId: string
): Promise<{ project: ProjectRecord | null; storyboard: StoryboardRecord | null }> {
  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        let q: Record<string, unknown> = { ownerId };
        if (ObjectId.isValid(projectId)) {
          q._id = new ObjectId(projectId);
        } else {
          q._id = projectId;
        }

        const projectDoc = await db.collection("projects").findOne(q);
        if (!projectDoc) {
          return { project: null, storyboard: null };
        }

        const project: ProjectRecord = {
          _id: projectDoc._id.toString(),
          ownerId: projectDoc.ownerId,
          title: projectDoc.title,
          topic: projectDoc.topic,
          targetAudience: projectDoc.targetAudience || "general",
          status: projectDoc.status,
          currentVersion: projectDoc.currentVersion || 1,
          voiceId: projectDoc.voiceId,
          voiceName: projectDoc.voiceName,
          videoUrl: projectDoc.videoUrl,
          durationSeconds: projectDoc.durationSeconds,
          createdAt: projectDoc.createdAt,
          updatedAt: projectDoc.updatedAt,
        };

        const projectIdQuery = ObjectId.isValid(project._id)
          ? { $in: [project._id, new ObjectId(project._id)] }
          : project._id;

        const sbDoc = await db
          .collection("storyboards")
          .find({ projectId: projectIdQuery, ownerId })
          .sort({ version: -1 })
          .limit(1)
          .toArray();

        let storyboard: StoryboardRecord | null = null;
        if (sbDoc.length > 0) {
          const s = sbDoc[0];
          storyboard = {
            _id: s._id.toString(),
            projectId: s.projectId?.toString?.() || s.projectId,
            ownerId: s.ownerId,
            version: s.version,
            title: s.title,
            targetSeconds: s.targetSeconds || 75,
            estimatedSeconds: s.estimatedSeconds || 75,
            scenes: s.scenes,
            revisionPrompt: s.revisionPrompt,
            createdAt: s.createdAt,
          };
        }

        return { project, storyboard };
      }
    } catch (err) {
      console.warn("MongoDB getProjectById error:", err);
    }
  }

  const project = memoryProjects.get(projectId) || null;
  if (!project || project.ownerId !== ownerId) {
    return { project: null, storyboard: null };
  }

  const sbs = memoryStoryboards.get(projectId) || [];
  const latestSb = sbs.length > 0 ? sbs[sbs.length - 1] : null;

  return { project, storyboard: latestSb };
}

export async function saveStoryboard(data: {
  projectId: string;
  ownerId: string;
  title: string;
  targetSeconds?: number;
  scenes: SceneRecord[];
  revisionPrompt?: string;
}): Promise<StoryboardRecord> {
  const now = new Date();
  const wordCount = data.scenes.reduce(
    (acc, s) => acc + s.narration.trim().split(/\s+/).length,
    0
  );
  // Average speaking rate: ~2.5 words per second
  const estimatedSeconds = Math.round((wordCount / 2.5) * 10) / 10;

  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        let pQuery: Record<string, unknown> = { ownerId: data.ownerId };
        if (ObjectId.isValid(data.projectId)) {
          pQuery._id = new ObjectId(data.projectId);
        } else {
          pQuery._id = data.projectId;
        }

        const project = await db.collection("projects").findOne(pQuery);
        const nextVersion = (project?.currentVersion || 0) + 1;

        const sbDoc = {
          projectId: data.projectId.toString(),
          ownerId: data.ownerId.toString(),
          version: nextVersion,
          title: data.title,
          targetSeconds: data.targetSeconds || 75,
          estimatedSeconds,
          scenes: data.scenes,
          revisionPrompt: data.revisionPrompt,
          createdAt: now,
        };

        const sbRes = await db.collection("storyboards").insertOne(sbDoc);

        await db.collection("projects").updateOne(pQuery, {
          $set: {
            title: data.title,
            status: "storyboard_ready",
            currentVersion: nextVersion,
            updatedAt: now,
          },
        });

        return {
          _id: sbRes.insertedId.toString(),
          ...sbDoc,
        };
      }
    } catch (err) {
      console.warn("MongoDB saveStoryboard error, using memory fallback:", err);
    }
  }

  const project = memoryProjects.get(data.projectId);
  const nextVer = (project?.currentVersion || 0) + 1;
  const sbId = new ObjectId().toString();

  const record: StoryboardRecord = {
    _id: sbId,
    projectId: data.projectId,
    ownerId: data.ownerId,
    version: nextVer,
    title: data.title,
    targetSeconds: data.targetSeconds || 75,
    estimatedSeconds,
    scenes: data.scenes,
    revisionPrompt: data.revisionPrompt,
    createdAt: now,
  };

  const list = memoryStoryboards.get(data.projectId) || [];
  list.push(record);
  memoryStoryboards.set(data.projectId, list);

  if (project) {
    project.title = data.title;
    project.status = "storyboard_ready";
    project.currentVersion = nextVer;
    project.updatedAt = now;
  }

  return record;
}

export async function updateStoryboardScenes(
  ownerId: string,
  projectId: string,
  scenes: SceneRecord[]
): Promise<StoryboardRecord | null> {
  const { project, storyboard } = await getProjectById(ownerId, projectId);
  if (!project || !storyboard) return null;

  return saveStoryboard({
    projectId,
    ownerId,
    title: storyboard.title,
    targetSeconds: storyboard.targetSeconds,
    scenes,
    revisionPrompt: "Manual scene edits",
  });
}

export async function updateProjectAudience(
  ownerId: string,
  projectId: string,
  targetAudience: string
): Promise<boolean> {
  const cleanAudience = targetAudience.trim() || "general";
  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        let q: Record<string, unknown> = { ownerId };
        if (ObjectId.isValid(projectId)) q._id = new ObjectId(projectId);
        else q._id = projectId;

        await db.collection("projects").updateOne(q, {
          $set: { targetAudience: cleanAudience, updatedAt: new Date() },
        });
        return true;
      }
    } catch (err) {
      console.warn("MongoDB updateProjectAudience error:", err);
    }
  }

  const project = memoryProjects.get(projectId);
  if (project && project.ownerId === ownerId) {
    project.targetAudience = cleanAudience;
    project.updatedAt = new Date();
    return true;
  }
  return false;
}

export async function deleteProject(
  ownerId: string,
  projectId: string
): Promise<boolean> {
  // 1. Clean up file system artifacts (videos, audio, previews, logs)
  try {
    const videoFile = path.join(process.cwd(), "public", "videos", `${projectId}.mp4`);
    if (fs.existsSync(videoFile)) {
      fs.unlinkSync(videoFile);
    }

    const rendersDir = path.join(process.cwd(), "public", "renders");
    const projRenderDir = path.join(rendersDir, projectId);
    if (fs.existsSync(projRenderDir)) {
      fs.rmSync(projRenderDir, { recursive: true, force: true });
    }

    for (const suffix of ["_status.json", "_storyboard.json", "_render.log"]) {
      const f = path.join(rendersDir, `${projectId}${suffix}`);
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
      }
    }
  } catch (fsErr) {
    console.warn("Error cleaning up project files during deletion:", fsErr);
  }

  // 2. Database deletion (MongoDB)
  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        let q: Record<string, unknown> = { ownerId };
        if (ObjectId.isValid(projectId)) q._id = new ObjectId(projectId);
        else q._id = projectId;

        const res = await db.collection("projects").deleteOne(q);

        const projectIdQuery = ObjectId.isValid(projectId)
          ? { $in: [projectId, new ObjectId(projectId)] }
          : projectId;
        await db.collection("storyboards").deleteMany({ projectId: projectIdQuery, ownerId });

        return (res.deletedCount || 0) > 0;
      }
    } catch (err) {
      console.warn("MongoDB deleteProject error:", err);
    }
  }

  // 3. Memory fallback deletion
  const p = memoryProjects.get(projectId);
  if (p && p.ownerId === ownerId) {
    memoryProjects.delete(projectId);
    memoryStoryboards.delete(projectId);
    return true;
  }

  return false;
}
