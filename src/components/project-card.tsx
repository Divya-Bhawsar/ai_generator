import Link from "next/link";
import { ProjectRecord } from "@/lib/db/projects";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#666B73", bg: "#F3F4F6" },
  generating_storyboard: { label: "Generating...", color: "#E9AE45", bg: "#FEF3C7" },
  storyboard_ready: { label: "Storyboard Ready", color: "#315CEB", bg: "#EEF2FF" },
  rendering: { label: "Rendering Video...", color: "#F25F4C", bg: "#FEE2E2" },
  ready: { label: "Video Ready", color: "#059669", bg: "#D1FAE5" },
  failed: { label: "Needs Attention", color: "#DC2626", bg: "#FEE2E2" },
};

export function ProjectCard({ project }: { project: ProjectRecord }) {
  const statusMeta = STATUS_LABELS[project.status] || STATUS_LABELS.draft;
  const timeFormatted = new Date(project.updatedAt).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E5DF",
        borderRadius: "10px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "1rem",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.6rem",
              borderRadius: "4px",
              color: statusMeta.color,
              background: statusMeta.bg,
            }}
          >
            {statusMeta.label}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#666B73" }}>v{project.currentVersion}</span>
        </div>

        <h3
          style={{
            fontSize: "1.0625rem",
            fontWeight: 700,
            color: "#17191F",
            margin: "0.75rem 0 0.35rem",
            lineHeight: 1.35,
          }}
        >
          {project.title}
        </h3>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "#666B73",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.45,
          }}
        >
          {project.topic}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #F3F4F6",
          paddingTop: "0.75rem",
          marginTop: "0.25rem",
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "#666B73" }}>{timeFormatted}</span>
        <Link
          href={`/dashboard/project/${project._id}`}
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "#315CEB",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          Open Studio ↗
        </Link>
      </div>
    </article>
  );
}
