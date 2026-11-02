import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { listProjects, getStoryboardByProjectId } from "@/lib/db/projects";
import { FEATURED_REELS, ReelItem } from "@/lib/video/reel-contracts";
import { InstagramExploreFeed } from "@/components/instagram-explore-feed";
import { InstagramBottomNav } from "@/components/instagram-bottom-nav";

export const metadata = {
  title: "Explore — VidyaMotion",
  description: "Discover trending AI explainer reels on code, science, technology and more.",
};

export default async function ExplorePage() {
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
            likes: 124,
            isLiked: false,
            commentsCount: sb?.scenes.length || 4,
            sharesCount: 12,
            voiceName: p.voiceName || "Edge Neural",
            duration: p.durationSeconds || sb?.estimatedSeconds || 60,
            caption: `${p.topic} #explainer #ai`,
            tags: ["My Explainers", p.targetAudience || "General"],
          });
        }
      }
    } catch (err) {
      console.warn("Error loading user reels for explore page:", err);
    }
  }

  const allReels: ReelItem[] = [...userReels, ...FEATURED_REELS];

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0C", color: "#FFFFFF", paddingBottom: "70px" }}>
      <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading Explore...</div>}>
        <InstagramExploreFeed initialReels={allReels} />
      </Suspense>
      <InstagramBottomNav />
    </main>
  );
}
