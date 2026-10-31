"use client";

import { useState } from "react";
import Link from "next/link";
import { ProjectRecord, StoryboardRecord, SceneRecord } from "@/lib/db/projects";

const VISUAL_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  hook: { bg: "#FEF2F2", text: "#DC2626", border: "#FCA5A5" },
  flow: { bg: "#EEF2FF", text: "#315CEB", border: "#C7D2FE" },
  bars: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  concept: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
  takeaway: { bg: "#FAF5FF", text: "#9333EA", border: "#E9D5FF" },
  comparison: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  metric_callout: { bg: "#ECFEFF", text: "#0891B2", border: "#A5F3FC" },
  process_steps: { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
};

export function StoryboardStudio({
  initialProject,
  initialStoryboard,
}: {
  initialProject: ProjectRecord;
  initialStoryboard: StoryboardRecord | null;
}) {
  const [project] = useState(initialProject);
  const [storyboard, setStoryboard] = useState<StoryboardRecord | null>(initialStoryboard);
  const [scenes, setScenes] = useState<SceneRecord[]>(initialStoryboard?.scenes || []);
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [revising, setRevising] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Total words & estimated duration
  const totalWords = scenes.reduce((acc, s) => acc + s.narration.trim().split(/\s+/).filter(Boolean).length, 0);
  const estimatedDuration = Math.round((totalWords / 2.5) * 10) / 10;

  function updateSceneText(index: number, newNarration: string) {
    setScenes((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        narration: newNarration,
        estimatedSeconds: Math.round((newNarration.trim().split(/\s+/).filter(Boolean).length / 2.5) * 10) / 10,
      };
      return copy;
    });
  }

  async function handleSaveChanges() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project._id}/storyboard`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save changes");
      setStoryboard(data.storyboard);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateStoryboard() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project._id}/storyboard`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate storyboard");
      setStoryboard(data.storyboard);
      setScenes(data.storyboard.scenes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleApplyRevision(e: React.FormEvent) {
    e.preventDefault();
    if (!revisionPrompt.trim()) return;

    setRevising(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project._id}/storyboard/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionPrompt: revisionPrompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply revision");
      setStoryboard(data.storyboard);
      setScenes(data.storyboard.scenes);
      setRevisionPrompt("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error revising";
      setError(msg);
    } finally {
      setRevising(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", paddingBottom: "4rem" }}>
      {/* Top Navigation & Status Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <Link
            href="/dashboard"
            style={{ fontSize: "0.8125rem", color: "#315CEB", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.5rem" }}
          >
            ← Back to All Projects
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#17191F", margin: 0 }}>
              {storyboard?.title || project.title}
            </h1>
            <span style={{ fontSize: "0.75rem", background: "#EEF2FF", color: "#315CEB", padding: "0.2rem 0.6rem", borderRadius: "4px", fontWeight: 600 }}>
              v{storyboard?.version || project.currentVersion}
            </span>
          </div>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "#666B73" }}>
            Topic: <em>{project.topic}</em>
          </p>
        </div>

        {/* Pacing Badge */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div
            style={{
              background: "#FAF9F6",
              border: "1px solid #E8E5DF",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "#666B73", fontWeight: 600, textTransform: "uppercase" }}>
              NARRATION PACING
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: estimatedDuration >= 60 && estimatedDuration <= 90 ? "#059669" : "#D97706" }}>
              ~{estimatedDuration}s ({totalWords} words)
            </div>
            <div style={{ fontSize: "0.7rem", color: "#666B73" }}>
              Target: 60–90 seconds
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "#FEE2E2", color: "#991B1B", borderRadius: "6px", fontSize: "0.875rem", border: "1px solid #FCA5A5" }}>
          {error}
        </div>
      )}

      {saveSuccess && (
        <div style={{ padding: "0.75rem 1rem", background: "#D1FAE5", color: "#065F46", borderRadius: "6px", fontSize: "0.875rem", border: "1px solid #A7F3D0" }}>
          ✓ Storyboard version saved successfully!
        </div>
      )}

      {/* If no storyboard exists yet */}
      {!storyboard && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", borderRadius: "10px", padding: "2.5rem", textAlign: "center" }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", color: "#17191F" }}>No storyboard generated yet</h3>
          <p style={{ margin: "0 0 1.5rem", color: "#666B73" }}>Click below to let Gemini AI generate your 4–6 scene educational storyboard.</p>
          <button
            onClick={handleGenerateStoryboard}
            disabled={generating}
            className="button"
            style={{ padding: "0.75rem 1.5rem" }}
          >
            {generating ? "Generating with AI..." : "Generate Storyboard Now ✨"}
          </button>
        </div>
      )}

      {/* Storyboard Scenes Grid */}
      {scenes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#17191F", margin: 0 }}>
              Scenes Timeline ({scenes.length} Scenes)
            </h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                style={{
                  background: "#FAF9F6",
                  border: "1px solid #E8E5DF",
                  borderRadius: "6px",
                  padding: "0.4rem 0.85rem",
                  fontSize: "0.8125rem",
                  color: "#17191F",
                  cursor: "pointer",
                }}
              >
                {saving ? "Saving..." : "Save Manual Edits"}
              </button>
              <button
                onClick={handleGenerateStoryboard}
                disabled={generating}
                style={{
                  background: "#FAF9F6",
                  border: "1px solid #E8E5DF",
                  borderRadius: "6px",
                  padding: "0.4rem 0.85rem",
                  fontSize: "0.8125rem",
                  color: "#315CEB",
                  cursor: "pointer",
                }}
              >
                {generating ? "Regenerating..." : "↻ Regenerate All"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {scenes.map((scene, index) => {
              const visualMeta = VISUAL_TYPE_COLORS[scene.visualType] || { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" };

              return (
                <div
                  key={scene.sceneId || index}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E8E5DF",
                    borderRadius: "10px",
                    padding: "1.25rem",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.5rem",
                  }}
                >
                  {/* Left Column: Spoken Narration */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#17191F" }}>
                          Scene {index + 1}
                        </span>
                        <span style={{ fontSize: "0.8125rem", color: "#666B73" }}>• {scene.title}</span>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#666B73" }}>
                        ~{scene.estimatedSeconds}s
                      </span>
                    </div>

                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#666B73", textTransform: "uppercase" }}>
                      🎙️ Spoken Narration (Click to edit text):
                    </label>
                    <textarea
                      value={scene.narration}
                      onChange={(e) => updateSceneText(index, e.target.value)}
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #E8E5DF",
                        background: "#FAF9F6",
                        fontSize: "0.9375rem",
                        color: "#17191F",
                        lineHeight: 1.5,
                        fontFamily: "inherit",
                        resize: "vertical",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Right Column: Visual Motion Direction */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", background: "#FAF9F6", padding: "1rem", borderRadius: "8px", border: "1px solid #E8E5DF" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#666B73", textTransform: "uppercase" }}>
                        🎨 Visual Motion Graphic Cue
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          background: visualMeta.bg,
                          color: visualMeta.text,
                          border: `1px solid ${visualMeta.border}`,
                        }}
                      >
                        {scene.visualType.replace("_", " ")}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#17191F", lineHeight: 1.45 }}>
                      {scene.visualLabel}
                    </p>

                    {scene.accentWords && scene.accentWords.length > 0 && (
                      <div>
                        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#666B73", textTransform: "uppercase" }}>
                          Kinetic Caption Highlights:
                        </span>
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                          {scene.accentWords.map((word, wIdx) => (
                            <span
                              key={wIdx}
                              style={{
                                fontSize: "0.75rem",
                                background: "#FEF3C7",
                                color: "#92400E",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "4px",
                                fontWeight: 600,
                              }}
                            >
                              #{word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversational AI Revision Co-Pilot Box */}
      {scenes.length > 0 && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #315CEB",
            borderRadius: "10px",
            padding: "1.5rem",
            boxShadow: "0 4px 20px rgba(49, 92, 235, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🤖</span>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#17191F", margin: 0 }}>
              AI Revision Co-Pilot
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#666B73" }}>
              — Request natural language changes to the script or visual cues
            </span>
          </div>

          <form onSubmit={handleApplyRevision} style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
            <input
              type="text"
              value={revisionPrompt}
              onChange={(e) => setRevisionPrompt(e.target.value)}
              placeholder="e.g. 'Make the opening hook more dramatic', 'Simplify scene 2 for a high school student', 'Focus more on air pressure'..."
              disabled={revising}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid #E8E5DF",
                background: "#FAF9F6",
                fontSize: "0.9375rem",
                color: "#17191F",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={revising || !revisionPrompt.trim()}
              className="button"
              style={{
                padding: "0.75rem 1.25rem",
                cursor: revising || !revisionPrompt.trim() ? "not-allowed" : "pointer",
                opacity: revising || !revisionPrompt.trim() ? 0.7 : 1,
              }}
            >
              {revising ? "Revising Storyboard..." : "Apply AI Revision →"}
            </button>
          </form>
        </div>
      )}

      {/* Next Step Action Banner */}
      {scenes.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#17191F",
            color: "#FFFFFF",
            padding: "1.25rem 1.75rem",
            borderRadius: "10px",
            marginTop: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", color: "#E9AE45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              READY FOR PRODUCTION
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0.2rem 0" }}>
              Happy with this storyboard?
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#A1A1AA" }}>
              Next step: Synthesize voiceover, align word-level captions, and render your 1080x1920 MP4 explainer video.
            </div>
          </div>
          <button
            onClick={() => alert("Ready for Milestone F05: Asynchronous Video Render Engine!")}
            className="button"
            style={{
              background: "#315CEB",
              color: "#FFFFFF",
              padding: "0.85rem 1.75rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Proceed to Video Render 🎬 →
          </button>
        </div>
      )}
    </div>
  );
}
