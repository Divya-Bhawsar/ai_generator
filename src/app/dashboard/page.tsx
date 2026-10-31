import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
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
            <span style={{ color: "#666B73", fontSize: "0.75rem" }}>
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
            <span>Overview</span>
          </div>
          <div className="workspace-rail-note">
            Your ideas and videos are private to your account.
          </div>
        </aside>

        <section className="workspace-main">
          <div className="workspace-welcome">
            <p className="eyebrow"><span className="eyebrow-dot" /> YOUR SPACE TO CREATE</p>
            <h1>Welcome back, <span>{session.name || "Creator"}.</span></h1>
            <p>Welcome to your personal VidyaMotion workspace. Ready to turn an educational idea into a video?</p>
          </div>

          <div className="workspace-empty-card">
            <div className="workspace-empty-art" aria-hidden="true">
              <span className="empty-art-ring ring-outer" />
              <span className="empty-art-ring ring-inner" />
              <span className="empty-art-core">V</span>
              <span className="empty-art-dot dot-blue" />
              <span className="empty-art-dot dot-coral" />
              <span className="empty-art-dot dot-gold" />
            </div>
            <p className="workspace-empty-kicker">A CLEAR START</p>
            <h2>Your first explainer is one idea away.</h2>
            <p>The idea-to-storyboard workspace is ready. You are authenticated with your personal account ({session.email}).</p>
          </div>

          <div className="workspace-footnote">
            <span className="workspace-footnote-mark">✳</span>
            <span>Designed for one creator at a time. Your work stays yours.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
