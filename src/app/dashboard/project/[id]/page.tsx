import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getProjectById, saveStoryboard } from "@/lib/db/projects";
import { generateStoryboardAI } from "@/lib/ai/storyboard";
import { StoryboardStudio } from "@/components/storyboard-studio";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { isMongoConfigured } from "@/lib/mongodb";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const { id } = await params;
  let { project, storyboard } = await getProjectById(session.userId, id);

  if (!project) {
    notFound();
  }

  // Self-heal: If project has no storyboard yet (e.g. from an interrupted initial generation),
  // immediately synthesize one so the creator always lands in an active studio!
  if (!storyboard) {
    try {
      const aiOutput = await generateStoryboardAI(project.topic);
      storyboard = await saveStoryboard({
        projectId: project._id,
        ownerId: session.userId,
        title: aiOutput.title,
        scenes: aiOutput.scenes,
        revisionPrompt: "Auto-healed initial generation",
      });
    } catch (err) {
      console.warn("Self-healing storyboard generation failed:", err);
    }
  }

  const isConnectedToMongo = isMongoConfigured();
  const initial = (session.name || session.email)[0].toUpperCase();

  const serializedProject = JSON.parse(JSON.stringify(project));
  const serializedStoryboard = storyboard ? JSON.parse(JSON.stringify(storyboard)) : null;

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <Link className="wordmark" href="/" aria-label="VidyaMotion home">
          <span className="wordmark-mark" aria-hidden="true">V</span>
          <span>VidyaMotion</span>
        </Link>
        <div className="workspace-header-right" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: "0.8125rem" }}>
            <span style={{ fontWeight: 600, color: "#17191F" }}>{session.name || session.email}</span>
            <span style={{ color: "#059669", fontSize: "0.75rem", fontWeight: 500 }}>
              {isConnectedToMongo ? "● MongoDB Atlas" : "○ Local Database"}
            </span>
          </div>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#315CEB",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {initial}
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="workspace-body">
        <aside className="workspace-rail" aria-label="Workspace navigation">
          <span className="workspace-rail-label">STUDIO STAGES</span>
          <div className="workspace-nav-item workspace-nav-active">
            <span className="workspace-nav-icon" aria-hidden="true">📋</span>
            <span>Storyboard</span>
          </div>
          <div className="workspace-nav-item" style={{ opacity: 0.5, cursor: "not-allowed" }}>
            <span className="workspace-nav-icon" aria-hidden="true">🎙️</span>
            <span>Voice & Audio</span>
          </div>
          <div className="workspace-nav-item" style={{ opacity: 0.5, cursor: "not-allowed" }}>
            <span className="workspace-nav-icon" aria-hidden="true">🎬</span>
            <span>Render Video</span>
          </div>
          <div className="workspace-nav-item" style={{ opacity: 0.5, cursor: "not-allowed" }}>
            <span className="workspace-nav-icon" aria-hidden="true">📱</span>
            <span>Instagram</span>
          </div>
          <div className="workspace-rail-note" style={{ marginTop: "auto" }}>
            Every change to script or visual cues autosaves to MongoDB.
          </div>
        </aside>

        <section className="workspace-main" style={{ padding: "2rem" }}>
          <StoryboardStudio initialProject={serializedProject} initialStoryboard={serializedStoryboard} />
        </section>
      </div>
    </main>
  );
}
