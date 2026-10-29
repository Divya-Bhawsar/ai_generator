import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <Link className="wordmark" href="/" aria-label="VidyaMotion home">
          <span className="wordmark-mark" aria-hidden="true">V</span>
          <span>VidyaMotion</span>
        </Link>
        <div className="workspace-header-right">
          <span className="workspace-account-label">Personal workspace</span>
          <UserButton />
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
            <h1>Your ideas start <span>here.</span></h1>
            <p>Welcome to your personal VidyaMotion workspace. Your projects will be saved here as you create them.</p>
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
            <p>The idea-to-storyboard workspace is the next step. For now, your account and private workspace are ready.</p>
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
