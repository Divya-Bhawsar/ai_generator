import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listProjects, getStoryboardByProjectId } from "@/lib/db/projects";
import { FEATURED_REELS, ReelItem } from "@/lib/video/reel-contracts";
import { InstagramProfileView } from "@/components/instagram-profile-view";
import { InstagramBottomNav } from "@/components/instagram-bottom-nav";

export const metadata = {
  title: "Profile — VidyaMotion",
  description: "Creator profile, explainer reels, and saved collections.",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const userReels: ReelItem[] = [];

  try {
    const projects = await listProjects(session.userId);
    for (const p of projects) {
      const sb = await getStoryboardByProjectId(session.userId, p._id);
      userReels.push({
        id: `user-${p._id}`,
        projectId: p._id,
        title: sb?.title || p.title,
        topic: p.topic,
        videoUrl: p.videoUrl || "",
        creator: {
          name: session.name || "Creator",
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
        caption: `${p.topic}`,
        tags: ["My Explainers", p.targetAudience || "General"],
      });
    }
  } catch (err) {
    console.warn("Error loading profile reels:", err);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0C", color: "#FFFFFF", paddingBottom: "70px" }}>
      <InstagramProfileView
        sessionUser={{
          name: session.name || "Creator",
          email: session.email,
          userId: session.userId,
        }}
        userReels={userReels}
        savedReels={FEATURED_REELS.slice(0, 3)}
      />
      <InstagramBottomNav />
    </main>
  );
}
