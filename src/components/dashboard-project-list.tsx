"use client";

import { useState, useMemo } from "react";
import { ProjectRecord } from "@/lib/db/projects";
import { ProjectCard } from "@/components/project-card";

type FilterTab = "all" | "ready" | "draft";

export function DashboardProjectList({ projects }: { projects: ProjectRecord[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const readyCount = useMemo(() => projects.filter((p) => p.status === "ready" && p.videoUrl).length, [projects]);
  const draftCount = useMemo(() => projects.length - readyCount, [projects, readyCount]);
  const totalDuration = useMemo(
    () => projects.reduce((acc, p) => acc + (p.durationSeconds || 0), 0),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.topic.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "ready") {
        return p.status === "ready" && Boolean(p.videoUrl);
      }
      if (activeTab === "draft") {
        return p.status !== "ready" || !p.videoUrl;
      }
      return true;
    });
  }, [projects, searchQuery, activeTab]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Studio Metrics Overview Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          className="interactive-card"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "10px",
              background: "#EEF2FF",
              color: "#315CEB",
              display: "grid",
              placeItems: "center",
              fontSize: "1.25rem",
              fontWeight: 700,
            }}
          >
            📋
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              TOTAL EXPLAINERS
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#17191F", lineHeight: 1.2 }}>
              {projects.length}
            </div>
          </div>
        </div>

        <div
          className="interactive-card"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "10px",
              background: "#ECFDF5",
              color: "#059669",
              display: "grid",
              placeItems: "center",
              fontSize: "1.25rem",
              fontWeight: 700,
            }}
          >
            🎬
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              REELS READY (1080p)
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#059669", lineHeight: 1.2 }}>
              {readyCount}
            </div>
          </div>
        </div>

        <div
          className="interactive-card"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "10px",
              background: "#FFFBEB",
              color: "#D97706",
              display: "grid",
              placeItems: "center",
              fontSize: "1.25rem",
              fontWeight: 700,
            }}
          >
            ⏱️
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              VIDEO FOOTAGE
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#17191F", lineHeight: 1.2 }}>
              {totalDuration > 0 ? `${Math.round(totalDuration)}s` : `${projects.length * 60}s est.`}
            </div>
          </div>
        </div>
      </div>

      {/* Projects List Header with Filter Tabs and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          borderBottom: "1px solid #E2E8F0",
          paddingBottom: "1rem",
        }}
      >
        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            style={{
              background: activeTab === "all" ? "#315CEB" : "#F8FAFC",
              color: activeTab === "all" ? "#FFFFFF" : "#475569",
              border: activeTab === "all" ? "1px solid #244BD2" : "1px solid #E2E8F0",
              borderRadius: "20px",
              padding: "0.35rem 0.85rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            All Projects ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ready")}
            style={{
              background: activeTab === "ready" ? "#059669" : "#F8FAFC",
              color: activeTab === "ready" ? "#FFFFFF" : "#475569",
              border: activeTab === "ready" ? "1px solid #047857" : "1px solid #E2E8F0",
              borderRadius: "20px",
              padding: "0.35rem 0.85rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            🎬 Ready ({readyCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("draft")}
            style={{
              background: activeTab === "draft" ? "#475569" : "#F8FAFC",
              color: activeTab === "draft" ? "#FFFFFF" : "#475569",
              border: activeTab === "draft" ? "1px solid #334155" : "1px solid #E2E8F0",
              borderRadius: "20px",
              padding: "0.35rem 0.85rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            📋 Storyboards ({draftCount})
          </button>
        </div>

        {/* Real-time Search Input */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", color: "#94A3B8" }}>
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search explainers..."
            style={{
              width: "100%",
              padding: "0.45rem 2rem 0.45rem 2rem",
              borderRadius: "20px",
              border: "1px solid #CBD5E1",
              background: "#FFFFFF",
              fontSize: "0.8125rem",
              color: "#17191F",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid or Filtered Empty State */}
      {filteredProjects.length === 0 ? (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px dashed #CBD5E1",
            borderRadius: "14px",
            padding: "3rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#17191F", margin: 0 }}>
            No matching projects found
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#64748B", margin: "0.35rem 0 1rem" }}>
            {searchQuery
              ? `No results match "${searchQuery}". Try a different keyword.`
              : "No projects currently in this category."}
          </p>
          {(searchQuery || activeTab !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="chip-button"
            >
              Reset Filters ↻
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {filteredProjects.map((p) => (
            <ProjectCard key={p._id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
