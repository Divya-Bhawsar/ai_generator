"use client";

import { useState } from "react";
import Link from "next/link";
import { ProjectRecord } from "@/lib/db/projects";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; dotColor: string; isPulsing?: boolean }> = {
  draft: { label: "Draft", color: "#64748B", bg: "#F1F5F9", dotColor: "#94A3B8" },
  generating_storyboard: { label: "Generating...", color: "#D97706", bg: "#FEF3C7", dotColor: "#F59E0B", isPulsing: true },
  storyboard_ready: { label: "Storyboard Ready", color: "#2563EB", bg: "#EEF2FF", dotColor: "#3B82F6" },
  rendering: { label: "Rendering 1080p...", color: "#EA580C", bg: "#FFEDD5", dotColor: "#F97316", isPulsing: true },
  ready: { label: "Reel Ready", color: "#059669", bg: "#D1FAE5", dotColor: "#10B981" },
  failed: { label: "Needs Attention", color: "#DC2626", bg: "#FEE2E2", dotColor: "#EF4444" },
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to delete project (HTTP ${res.status})`);
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
    return null;
  }

  return (
    <article
      className="interactive-card"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E5DF",
        borderRadius: "14px",
        padding: "1.35rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "1.15rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        opacity: deleting ? 0.6 : 1,
        position: "relative",
      }}
    >
      <div>
        {/* Status Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0.25rem 0.65rem",
              borderRadius: "20px",
              color: statusMeta.color,
              background: statusMeta.bg,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: statusMeta.dotColor,
                display: "inline-block",
                boxShadow: statusMeta.isPulsing ? `0 0 0 3px ${statusMeta.color}30` : "none",
                animation: statusMeta.isPulsing ? "pulse-subtle 1.5s infinite" : "none",
              }}
            />
            {statusMeta.label}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {project.targetAudience && (
              <span style={{ fontSize: "0.7rem", color: "#64748B", background: "#F8FAFC", padding: "0.15rem 0.45rem", borderRadius: "4px", border: "1px solid #E2E8F0" }}>
                {project.targetAudience}
              </span>
            )}
            <span style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 600 }}>v{project.currentVersion}</span>
          </div>
        </div>

        {/* Project Title */}
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#0F172A",
            margin: "0.85rem 0 0.35rem",
            lineHeight: 1.35,
            letterSpacing: "-0.015em",
          }}
        >
          <Link
            href={`/dashboard/project/${project._id}`}
            style={{
              color: "inherit",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "#315CEB";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "#0F172A";
            }}
          >
            {project.title}
          </Link>
        </h3>

        {/* Topic Prompt */}
        <p
          style={{
            fontSize: "0.8125rem",
            color: "#64748B",
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
          borderTop: "1px solid #F1F5F9",
          paddingTop: "0.75rem",
          marginTop: "0.25rem",
        }}
      >
        <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{timeFormatted}</span>

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
                  padding: "0.25rem",
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
                  fontWeight: 700,
                  color: project.status === "ready" ? "#059669" : "#315CEB",
                  background: project.status === "ready" ? "#ECFDF5" : "#EEF2FF",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{project.status === "ready" ? "▶ Watch Reel" : "Studio"}</span>
                <span style={{ fontSize: "0.9rem" }}>→</span>
              </Link>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#DC2626", fontWeight: 700 }}>
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
                  fontWeight: 700,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "..." : "Yes"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirming(false)}
                style={{
                  background: "#F1F5F9",
                  color: "#64748B",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
