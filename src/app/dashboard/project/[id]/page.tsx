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
              fontSize: "0.875rem",
              color: "#4F46E5",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            ← Back to All Decks
          </Link>
          <span style={{ color: "#CBD5E1" }}>/</span>
          <span style={{ fontSize: "0.875rem", color: "#0F172A", fontWeight: 700 }}>
            {serializedStoryboard?.title || serializedProject.title}
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.72rem",
              background: "#EEF2FF",
              color: "#4338CA",
              border: "1px solid #C7D2FE",
              padding: "0.25rem 0.65rem",
              borderRadius: "12px",
              fontWeight: 700,
            }}
          >
            ✦ CARD CANVAS
          </span>
        </div>

        <StoryboardStudio initialProject={serializedProject} initialStoryboard={serializedStoryboard} />
      </main>
    </div>
  );
}
