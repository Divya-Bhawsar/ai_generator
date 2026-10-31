import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { listProjects } from "@/lib/db/projects";
import { SignOutButton } from "@/components/sign-out-button";
import { CreateProjectCard } from "@/components/create-project-card";
import { ProjectCard } from "@/components/project-card";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const isConnectedToMongo = isMongoConfigured();
  const initial = (session.name || session.email)[0].toUpperCase();
  const projects = await listProjects(session.userId);

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
          <span className="workspace-rail-label">WORKSPACE</span>
          <div className="workspace-nav-item workspace-nav-active">
            <span className="workspace-nav-icon" aria-hidden="true">⌂</span>
            <span>Explainers ({projects.length})</span>
          </div>
          <div className="workspace-rail-note">
            Your ideas and videos are private to your account.
          </div>
        </aside>

        <section className="workspace-main" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="workspace-welcome">
            <p className="eyebrow"><span className="eyebrow-dot" /> YOUR CREATOR STUDIO</p>
            <h1>Welcome back, <span>{session.name || "Creator"}.</span></h1>
            <p>Transform any educational idea into a voice-synced, motion-animated Instagram Reel.</p>
          </div>

          {/* New Explainer Creator Box */}
          <CreateProjectCard />

          {/* Projects List Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#17191F", margin: 0 }}>
                Your Explainer Projects {projects.length > 0 && `(${projects.length})`}
              </h2>
            </div>

            {projects.length === 0 ? (
              <div className="workspace-empty-card" style={{ marginTop: 0 }}>
                <div className="workspace-empty-art" aria-hidden="true">
                  <span className="empty-art-ring ring-outer" />
                  <span className="empty-art-ring ring-inner" />
                  <span className="empty-art-core">V</span>
                  <span className="empty-art-dot dot-blue" />
                  <span className="empty-art-dot dot-coral" />
                  <span className="empty-art-dot dot-gold" />
                </div>
                <p className="workspace-empty-kicker">A CLEAR START</p>
                <h2>No explainer videos created yet.</h2>
                <p>Type a topic above or pick one of the recommended ideas to generate your first storyboard!</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {projects.map((p) => (
                  <ProjectCard key={p._id} project={p} />
                ))}
              </div>
            )}
          </div>

          <div className="workspace-footnote">
            <span className="workspace-footnote-mark">✳</span>
            <span>Designed for clear teaching. 60–90 second explainers with synchronized voice and captions.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
