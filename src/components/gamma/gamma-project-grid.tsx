"use client";

import { useState } from "react";
import Link from "next/link";
import { ProjectRecord } from "@/lib/db/projects";
import { GammaPresenterModal, PresenterScene } from "./gamma-presenter-modal";

interface GammaProjectGridProps {
  projects: ProjectRecord[];
}

export function GammaProjectGrid({ projects }: GammaProjectGridProps) {
  const [filter, setFilter] = useState<"all" | "ready" | "draft">("all");
  const [search, setSearch] = useState("");
  const [presentingProject, setPresentingProject] = useState<{
    title: string;
    videoUrl?: string;
    voiceName?: string;
    duration?: number;
    projectId?: string;
    scenes?: PresenterScene[];
  } | null>(null);

  const filtered = projects.filter((p) => {
    if (filter === "ready" && !p.videoUrl) return false;
    if (filter === "draft" && p.videoUrl) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <div>
        {/* Section Header & Filters */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.72rem", color: "#4F46E5", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ✦ RECENT PRESENTATIONS
            </span>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A", margin: "0.2rem 0 0" }}>
              Your Explainer Decks ({projects.length})
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter decks..."
              style={{
                background: "#FFFFFF",
                border: "1.5px solid #CBD5E1",
                borderRadius: "10px",
                padding: "0.45rem 0.85rem",
                color: "#0F172A",
                fontSize: "0.8125rem",
                outline: "none",
                width: "180px",
              }}
            />

            {/* Filter Pills */}
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`gamma-pill-btn ${filter === "all" ? "gamma-pill-active" : ""}`}
            >
              All ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("ready")}
              className={`gamma-pill-btn ${filter === "ready" ? "gamma-pill-active" : ""}`}
            >
              🎬 Rendered ({projects.filter((p) => !!p.videoUrl).length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("draft")}
              className={`gamma-pill-btn ${filter === "draft" ? "gamma-pill-active" : ""}`}
            >
              📝 Drafts ({projects.filter((p) => !p.videoUrl).length})
            </button>
          </div>
        </div>

        {/* Deck Cards Grid */}
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "3.5rem 1.5rem",
              textAlign: "center",
              background: "#FFFFFF",
              border: "1.5px dashed #CBD5E1",
              borderRadius: "20px",
            }}
          >
            <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>✦</span>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0F172A", margin: "0 0 0.35rem" }}>
              No explainer presentations found
            </h3>
            <p style={{ color: "#475569", fontSize: "0.875rem", margin: 0 }}>
              Use the AI generator bar above to synthesize your first animated topic presentation!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {filtered.map((project) => {
              const hasVideo = !!project.videoUrl;

              return (
                <div
                  key={project._id}
                  className="gamma-card"
                  style={{
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  {/* Presentation Preview Header (16:9 / Video Frame) */}
                  <div
                    style={{
                      position: "relative",
                      aspectRatio: "16/9",
                      background: "#08090E",
                      overflow: "hidden",
                      borderBottom: "1px solid #E2E8F0",
                    }}
                  >
                    {hasVideo ? (
                      <video
                        src={project.videoUrl}
                        muted
                        playsInline
                        preload="metadata"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onMouseOver={(e) => e.currentTarget.play().catch(() => {})}
                        onMouseOut={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.15) 0%, #0E101A 100%)",
                          padding: "1rem",
                          textAlign: "center",
                        }}
                      >
                        <span style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>📊</span>
                        <span style={{ fontSize: "0.75rem", color: "#A5B4FC", fontWeight: 700 }}>
                          Storyboard Deck Ready
                        </span>
                        <span style={{ fontSize: "0.6875rem", color: "#64748B" }}>
                          Click to customize in Studio
                        </span>
                      </div>
                    )}

                    {/* Top Status Badges */}
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        right: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "12px",
                          background: hasVideo ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)",
                          color: hasVideo ? "#6EE7B7" : "#FCD34D",
                          backdropFilter: "blur(8px)",
                          border: hasVideo ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
                        }}
                      >
                        {hasVideo ? "● 1080p Ready" : "○ Draft Deck"}
                      </span>

                      {project.durationSeconds && (
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "10px",
                            background: "rgba(0,0,0,0.6)",
                            color: "#E2E8F0",
                            backdropFilter: "blur(6px)",
                          }}
                        >
                          ⏱️ {project.durationSeconds}s
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: "1.15rem", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.35rem" }}>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          background: "rgba(99, 102, 241, 0.15)",
                          color: "#818CF8",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "8px",
                          fontWeight: 700,
                        }}
                      >
                        {project.voiceName ? `🎙️ ${project.voiceName}` : "AI Narrated"}
                      </span>
                      <span style={{ fontSize: "0.6875rem", color: "#64748B" }}>
                        {project.targetAudience || "General"}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 800,
                        color: "#0F172A",
                        margin: "0 0 0.35rem",
                        lineHeight: 1.3,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {project.title}
                    </h3>

                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "#475569",
                        margin: "0 0 1rem",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        flex: 1,
                      }}
                    >
                      {project.topic}
                    </p>

                    {/* Deck Footer Actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        paddingTop: "0.85rem",
                        borderTop: "1px solid #E2E8F0",
                      }}
                    >
                      {hasVideo ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPresentingProject({
                              title: project.title,
                              videoUrl: project.videoUrl,
                              voiceName: project.voiceName || "Edge Neural",
                              duration: project.durationSeconds || 60,
                              projectId: project._id,
                            })
                          }
                          className="gamma-gradient-btn"
                          style={{
                            flex: 1,
                            padding: "0.55rem 0.75rem",
                            fontSize: "0.8125rem",
                          }}
                        >
                          <span>▷</span>
                          <span>Present</span>
                        </button>
                      ) : null}

                      <Link
                        href={`/dashboard/project/${project._id}`}
                        style={{
                          flex: 1,
                          padding: "0.55rem 0.75rem",
                          borderRadius: "10px",
                          background: hasVideo ? "#F8FAFC" : "var(--gamma-gradient)",
                          border: hasVideo ? "1px solid #CBD5E1" : "none",
                          color: hasVideo ? "#0F172A" : "#FFFFFF",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          textAlign: "center",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.35rem",
                          boxShadow: hasVideo ? "none" : "0 4px 14px rgba(79, 70, 229, 0.3)",
                        }}
                      >
                        <span>✏️</span>
                        <span>{hasVideo ? "Edit Deck" : "Open Studio"}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gamma Presenter Modal */}
      {presentingProject && (
        <GammaPresenterModal
          isOpen={true}
          onClose={() => setPresentingProject(null)}
          title={presentingProject.title}
          videoUrl={presentingProject.videoUrl}
          voiceName={presentingProject.voiceName}
          duration={presentingProject.duration}
          projectId={presentingProject.projectId}
          scenes={presentingProject.scenes}
        />
      )}
    </>
  );
}
