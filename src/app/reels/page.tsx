import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { listProjects, getStoryboardByProjectId } from "@/lib/db/projects";
import { FEATURED_REELS, ReelItem } from "@/lib/video/reel-contracts";
import { InstagramReelsFeed } from "@/components/instagram-reels-feed";
import { InstagramBottomNav } from "@/components/instagram-bottom-nav";

export const metadata = {
  title: "Reels — VidyaMotion",
  description: "Swipe through 9:16 vertical AI animated explainer reels with synchronized voiceovers.",
};

export default async function ReelsPage() {
  const session = await getSession();
  const userReels: ReelItem[] = [];

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
            likes: 142,
            isLiked: false,
            commentsCount: sb?.scenes.length || 4,
            sharesCount: 18,
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
      console.warn("Error loading user reels for page:", err);
    }
  }

  const allReels: ReelItem[] = [...userReels, ...FEATURED_REELS];

  return (
    <main style={{ position: "relative", width: "100%", height: "100dvh", overflow: "hidden", background: "#000" }}>
      <Suspense fallback={<div style={{ color: "#FFF", display: "grid", placeItems: "center", height: "100%" }}>Loading Reels...</div>}>
        <InstagramReelsFeed initialReels={allReels} />
      </Suspense>
      <InstagramBottomNav />
    </main>
  );
}
