import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listProjects, getStoryboardByProjectId } from "@/lib/db/projects";
import { FEATURED_REELS, ReelItem } from "@/lib/video/reel-contracts";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase() || "";
    const tag = searchParams.get("tag")?.toLowerCase() || "";

    const userReels: ReelItem[] = [];

    // If session exists, pull user's rendered projects
    if (session) {
      try {
        const projects = await listProjects(session.userId);
        for (const p of projects) {
          if (p.videoUrl) {
            const sb = await getStoryboardByProjectId(session.userId, p._id);
            userReels.push({
              id: `user-${p._id}`,
              projectId: p._id,
              title: sb?.title || p.title,
              topic: p.topic,
              videoUrl: p.videoUrl,
              creator: {
                name: session.name || "You",
                username: (session.name || "creator").toLowerCase().replace(/[^a-z0-9]+/g, "."),
                avatar: "👤",
                verified: true,
              },
              likes: 120,
              isLiked: false,
              commentsCount: sb?.scenes.length || 4,
              sharesCount: 15,
              voiceName: p.voiceName || "Edge Neural",
              duration: p.durationSeconds || sb?.estimatedSeconds || 60,
              caption: `${p.topic}. Generated with synchronized AI voiceover and kinetic visual motion graphics 🎬 #explainer #ai #vidyamotion`,
              tags: ["My Explainers", p.targetAudience || "General"],
              scenes: sb?.scenes ? sb.scenes.map((s, idx) => ({
                sequence: idx + 1,
                title: s.title,
                narration: s.narration,
                visualLabel: s.visualLabel,
              })) : undefined,
              createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
            });
          }
        }
      } catch (err) {
        console.warn("Error fetching user reels for feed:", err);
      }
    }

    // Merge user reels first, then featured reels
    let allReels: ReelItem[] = [...userReels, ...FEATURED_REELS];

    // Filter by tag if requested
    if (tag && tag !== "all" && tag !== "trending") {
      allReels = allReels.filter((r) =>
        r.tags.some((t) => t.toLowerCase().includes(tag))
      );
    }

    // Filter by search query if requested
    if (query) {
      allReels = allReels.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.topic.toLowerCase().includes(query) ||
          r.caption.toLowerCase().includes(query) ||
          r.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({ reels: allReels });
  } catch (error) {
    console.error("Reels API GET error:", error);
    return NextResponse.json(
      { error: "Failed to load reels", reels: FEATURED_REELS },
      { status: 500 }
    );
  }
}
