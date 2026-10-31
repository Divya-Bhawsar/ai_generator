import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getProjectById } from "@/lib/db/projects";
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
  const { project, storyboard } = await getProjectById(session.userId, id);

  if (!project) {
    notFound();
  }

  const isConnectedToMongo = isMongoConfigured();
  const initial = (session.name || session.email)[0].toUpperCase();

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
          <StoryboardStudio initialProject={project} initialStoryboard={storyboard} />
        </section>
      </div>
    </main>
  );
}
