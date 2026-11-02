import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listProjects } from "@/lib/db/projects";
import { GammaWorkspaceHeader } from "@/components/gamma/gamma-workspace-header";
import { GammaPromptHero } from "@/components/gamma/gamma-prompt-hero";
import { GammaProjectGrid } from "@/components/gamma/gamma-project-grid";

export const metadata = {
  title: "Studio Workspace — VidyaMotion",
  description: "Generate structured, visual, animated explainer presentations with AI.",
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const projects = await listProjects(session.userId);
  const serializedProjects = JSON.parse(JSON.stringify(projects));

  return (
    <div className="gamma-shell">
      {/* Gamma Minimalist Top Header */}
      <GammaWorkspaceHeader
        userName={session.name || "Creator"}
        userEmail={session.email}
        projectCount={projects.length}
      />

      {/* Main Studio Body */}
      <main
        style={{
          maxWidth: "1160px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem 6rem",
          display: "flex",
          flexDirection: "column",
          gap: "3rem",
        }}
      >
        {/* Gamma AI Prompt Hero Bar */}
        <GammaPromptHero />

        {/* Gamma Project Decks Grid */}
        <GammaProjectGrid projects={serializedProjects} />
      </main>
    </div>
  );
}
