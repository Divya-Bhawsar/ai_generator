"use client";

import { useState } from "react";
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
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusMeta = STATUS_LABELS[project.status] || STATUS_LABELS.draft;
  const timeFormatted = new Date(project.updatedAt).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete project");
      }
      setDeleted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting project";
      setError(msg);
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (deleted) {
    return null; // Card removes itself from the list immediately upon deletion
  }

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
        transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease",
        opacity: deleting ? 0.6 : 1,
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

        {error && (
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "#DC2626" }}>
            {error}
          </p>
        )}
      </div>

      {/* Footer Actions: Studio Link & Delete Confirmation */}
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

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {!confirming ? (
            <>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                title="Delete project"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  padding: "0.2rem",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "4px",
                  transition: "color 0.15s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#DC2626";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#94A3B8";
                }}
              >
                🗑️
              </button>
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
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#DC2626", fontWeight: 600 }}>
                Delete?
              </span>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "..." : "Yes, Delete"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirming(false)}
                style={{
                  background: "#F3F4F6",
                  color: "#64748B",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
