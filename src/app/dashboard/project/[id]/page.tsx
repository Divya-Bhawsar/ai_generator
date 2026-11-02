import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getProjectById, saveStoryboard } from "@/lib/db/projects";
import { generateStoryboardAI } from "@/lib/ai/storyboard";
import { StoryboardStudio } from "@/components/storyboard-studio";
import Link from "next/link";
import { GammaWorkspaceHeader } from "@/components/gamma/gamma-workspace-header";

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
      const aiOutput = await generateStoryboardAI(project.topic, project.targetAudience || "general");
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

  const serializedProject = JSON.parse(JSON.stringify(project));
  const serializedStoryboard = storyboard ? JSON.parse(JSON.stringify(storyboard)) : null;

  return (
    <div className="gamma-shell">
      {/* Gamma Header */}
      <GammaWorkspaceHeader
        userName={session.name || "Creator"}
        userEmail={session.email}
        projectCount={1}
      />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.75rem 1.5rem 6rem" }}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <Link
            href="/dashboard"
            style={{
              fontSize: "0.8125rem",
              color: "#818CF8",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            ← Back to All Decks
          </Link>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
          <span style={{ fontSize: "0.8125rem", color: "#E2E8F0", fontWeight: 600 }}>
            {serializedStoryboard?.title || serializedProject.title}
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.72rem",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#A5B4FC",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              padding: "0.2rem 0.55rem",
              borderRadius: "12px",
              fontWeight: 700,
            }}
          >
            ✦ GAMMA CARD CANVAS
          </span>
        </div>

        <StoryboardStudio initialProject={serializedProject} initialStoryboard={serializedStoryboard} />
      </main>
    </div>
  );
}
