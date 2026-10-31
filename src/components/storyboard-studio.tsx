"use client";

import { useState, useEffect, useRef } from "react";
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

const VOICES = [
  {
    id: "Q1NHvGuV9SzxtiSnVDEH",
    name: "viraj",
    label: "Viraj",
    description: "Indian English · Confident, Informative Male",
    previewUrl: "/audio/voice-viraj.mp3",
  },
  {
    id: "zuIkusKkwwtn2eFqk87f",
    name: "monica",
    label: "Monica",
    description: "Indian English · Clear, Engaging Female",
    previewUrl: "/audio/voice-monica.mp3",
  },
];

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

  // Voice Selection State
  const initialVoice = VOICES.find((v) => v.id === initialProject.voiceId || v.name === initialProject.voiceName) || VOICES[0];
  const [selectedVoice, setSelectedVoice] = useState(initialVoice);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceSectionRef = useRef<HTMLDivElement | null>(null);

  // Render State
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStage, setRenderStage] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(initialProject.videoUrl || null);
  const [videoDuration, setVideoDuration] = useState<number | null>(initialProject.durationSeconds || null);

  // Total words & estimated duration
  const totalWords = scenes.reduce((acc, s) => acc + s.narration.trim().split(/\s+/).filter(Boolean).length, 0);
  const estimatedDuration = Math.round((totalWords / 2.5) * 10) / 10;

  // Poll for existing video or render progress
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`/api/projects/${project._id}/render-status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "ready" && data.videoUrl) {
            setVideoUrl(data.videoUrl);
            setVideoDuration(data.duration);
          } else if (data.status === "rendering") {
            setRendering(true);
            setRenderProgress(data.progress || 10);
            setRenderStage(data.stage || "Rendering...");
          }
        }
      } catch {
        // silent check
      }
    }
    checkStatus();
  }, [project._id]);

  // Poller during active rendering
  useEffect(() => {
    if (!rendering) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${project._id}/render-status`);
        if (res.ok) {
          const data = await res.json();
          setRenderProgress(data.progress || 10);
          setRenderStage(data.stage || "Processing...");

          if (data.status === "ready" && data.videoUrl) {
            setRendering(false);
            setVideoUrl(data.videoUrl);
            setVideoDuration(data.duration);
            clearInterval(interval);
          } else if (data.status === "failed") {
            setRendering(false);
            setError(data.error || "Rendering failed");
            clearInterval(interval);
          }
        }
      } catch {
        // network retry
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [rendering, project._id]);

  function playVoicePreview(voice: (typeof VOICES)[0]) {
    if (playingVoice === voice.name && audioRef.current) {
      audioRef.current.pause();
      setPlayingVoice(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(voice.previewUrl);
    audioRef.current = audio;
    setPlayingVoice(voice.name);
    audio.play().catch(() => setPlayingVoice(null));
    audio.onended = () => setPlayingVoice(null);
  }

  async function handleStartRender() {
    setRendering(true);
    setRenderProgress(5);
    setRenderStage(`Preparing video render with ${selectedVoice.label}...`);
    setError(null);
    setVideoUrl(null); // Hide old video during render to show fresh progress

    try {
      const res = await fetch(`/api/projects/${project._id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: selectedVoice.id,
          voiceName: selectedVoice.name,
          scenes: scenes, // ALWAYS pass current in-memory scenes!
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start render");
      }
      if (data.storyboard) {
        setStoryboard(data.storyboard);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error initiating render";
      setError(msg);
      setRendering(false);
    }
  }

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

  function updateSceneTitle(index: number, newTitle: string) {
    setScenes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], title: newTitle };
      return copy;
    });
  }

  function updateSceneVisualLabel(index: number, newLabel: string) {
    setScenes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], visualLabel: newLabel };
      return copy;
    });
  }

  function updateSceneVisualType(index: number, newType: string) {
    setScenes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], visualType: newType };
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
            {videoUrl && (
              <span style={{ fontSize: "0.75rem", background: "#D1FAE5", color: "#065F46", padding: "0.2rem 0.6rem", borderRadius: "4px", fontWeight: 600 }}>
                ● Video Ready
              </span>
            )}
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
            <div style={{ fontSize: "1rem", fontWeight: 700, color: estimatedDuration >= 50 && estimatedDuration <= 90 ? "#059669" : "#D97706" }}>
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
          ✓ Storyboard updated successfully!
        </div>
      )}

      {/* Render In-Progress Progress Bar */}
      {rendering && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #315CEB",
            borderRadius: "12px",
            padding: "1.75rem",
            boxShadow: "0 6px 20px rgba(49, 92, 235, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="spinner" style={{ width: 18, height: 18, border: "2px solid #315CEB", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#17191F", fontWeight: 700 }}>
                Rendering Your Explainer Video ({renderProgress}%)
              </h3>
            </div>
            <span style={{ fontSize: "0.8125rem", color: "#315CEB", fontWeight: 600 }}>
              Voice: {selectedVoice.label} · 1080x1920 MP4
            </span>
          </div>

          <div style={{ width: "100%", height: "8px", background: "#E8E5DF", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                width: `${renderProgress}%`,
                height: "100%",
                background: "#315CEB",
                borderRadius: "4px",
                transition: "width 0.4s ease",
              }}
            />
          </div>

          <p style={{ margin: 0, fontSize: "0.875rem", color: "#666B73" }}>
            {renderStage || "Processing video pipeline..."}
          </p>
        </div>
      )}

      {/* COMPLETED VIDEO PREVIEW PLAYER (Milestone F06) */}
      {videoUrl && (
        <div
          style={{
            background: "#17191F",
            color: "#FFFFFF",
            borderRadius: "12px",
            padding: "2rem",
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: "2.5rem",
            alignItems: "center",
          }}
        >
          {/* Vertical 9:16 Video Player Frame */}
          <div
            style={{
              width: "100%",
              maxWidth: "320px",
              aspectRatio: "9/16",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 12px 36px rgba(0,0,0,0.5)",
              border: "3px solid #314158",
              background: "#000",
            }}
          >
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Video Metadata & Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#45D6B5",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                ● 1080x1920 VERTICAL REEL READY
              </span>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.35rem 0", color: "#FFFFFF" }}>
                {storyboard?.title || project.title}
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "#94A3B8", margin: 0, lineHeight: 1.5 }}>
                Rendered with neural voiceover ({selectedVoice.label}), kinetic burned-in captions, and animated visual scenes ({videoDuration || estimatedDuration}s).
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              <a
                href={videoUrl}
                download={`${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`}
                className="button"
                style={{
                  padding: "0.85rem 1.75rem",
                  background: "#45D6B5",
                  color: "#0B1220",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  textDecoration: "none",
                }}
              >
                Download 1080x1920 MP4 ⬇
              </a>

              <button
                onClick={() => {
                  voiceSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  padding: "0.85rem 1.25rem",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                Re-render with another voice or scene updates ↻
              </button>
            </div>

            <div
              style={{
                marginTop: "1rem",
                padding: "1rem 1.25rem",
                borderRadius: "8px",
                background: "#1E293B",
                border: "1px solid #334155",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#FFFFFF" }}>
                  Instagram Reels Publishing (Milestone F07)
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                  Connect your Instagram Creator / Business account to post directly.
                </div>
              </div>
              <button
                onClick={() => alert("Ready for Milestone F07: Instagram Connect & Auto-Publishing!")}
                style={{
                  background: "#E1306C",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.5rem 1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Post to Instagram ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no storyboard exists yet */}
      {scenes.length === 0 && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px dashed #CBD5E1",
            borderRadius: "12px",
            padding: "3.5rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
            boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "#EEF2FF",
              color: "#315CEB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
            }}
          >
            📋
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#17191F", margin: 0 }}>
              No Storyboard Generated Yet
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#64748B", maxWidth: "480px", margin: "0.5rem auto 0" }}>
              Generate a 5-scene educational script and motion graphic storyboard for:{" "}
              <strong style={{ color: "#0F172A" }}>&ldquo;{project.topic}&rdquo;</strong>
            </p>
          </div>
          <button
            onClick={handleGenerateStoryboard}
            disabled={generating}
            className="button"
            style={{
              padding: "0.75rem 1.75rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: generating ? "not-allowed" : "pointer",
            }}
          >
            {generating ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    border: "2px solid #fff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span>Generating Storyboard...</span>
              </>
            ) : (
              <>
                <span>Generate Storyboard ✨</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Storyboard Scenes Grid */}
      {scenes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#17191F", margin: 0 }}>
              Scene-by-Scene Script & Motion Visuals ({scenes.length} Scenes)
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
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#17191F", whiteSpace: "nowrap" }}>
                          Scene {index + 1}:
                        </span>
                        <input
                          type="text"
                          value={scene.title}
                          onChange={(e) => updateSceneTitle(index, e.target.value)}
                          placeholder="Scene title"
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#17191F",
                            background: "#FAF9F6",
                            border: "1px solid #E8E5DF",
                            borderRadius: "4px",
                            padding: "0.2rem 0.5rem",
                            flex: 1,
                            maxWidth: "260px",
                          }}
                        />
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
                        🎨 Visual Cue & Theme
                      </span>
                      <select
                        value={scene.visualType}
                        onChange={(e) => updateSceneVisualType(index, e.target.value)}
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          background: visualMeta.bg,
                          color: visualMeta.text,
                          border: `1px solid ${visualMeta.border}`,
                          cursor: "pointer",
                        }}
                      >
                        <option value="hook">Hook / Problem</option>
                        <option value="concept">Concept Core</option>
                        <option value="process_steps">Process Flow</option>
                        <option value="comparison">Comparison Grid</option>
                        <option value="takeaway">Key Takeaway</option>
                      </select>
                    </div>

                    <textarea
                      value={scene.visualLabel}
                      onChange={(e) => updateSceneVisualLabel(index, e.target.value)}
                      rows={3}
                      placeholder="Visual motion cue..."
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        border: "1px solid #E8E5DF",
                        background: "#FFFFFF",
                        fontSize: "0.875rem",
                        color: "#17191F",
                        lineHeight: 1.45,
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />

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
              placeholder="e.g. 'Make the opening hook more dramatic', 'Simplify scene 2 for high schoolers', 'Change tone to energetic'..."
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

      {/* VOICE SELECTION & RENDER TRIGGER MODAL / SECTION */}
      {scenes.length > 0 && !rendering && (
        <div
          ref={voiceSectionRef}
          id="voice-selection"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E5DF",
            borderRadius: "12px",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#315CEB", letterSpacing: "0.05em" }}>
              STAGE 3: VOICE & VIDEO SYNTHESIS
            </span>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#17191F", margin: "0.25rem 0 0" }}>
              Select Narration Voice
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#666B73", margin: "0.25rem 0 0" }}>
              Audition the neural voices below. Each voice delivers natural breathing pauses and Indian English pronunciation.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {VOICES.map((v) => {
              const isSelected = selectedVoice.id === v.id;
              const isPlaying = playingVoice === v.name;

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVoice(v)}
                  style={{
                    border: `2px solid ${isSelected ? "#315CEB" : "#E8E5DF"}`,
                    background: isSelected ? "#F8FAFF" : "#FFFFFF",
                    borderRadius: "10px",
                    padding: "1.25rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 700, color: "#17191F", fontSize: "1.0625rem" }}>{v.label}</span>
                      {isSelected && (
                        <span style={{ fontSize: "0.7rem", background: "#315CEB", color: "#FFF", padding: "0.1rem 0.4rem", borderRadius: "3px", fontWeight: 600 }}>
                          Selected
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#666B73", marginTop: "0.25rem" }}>{v.description}</div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playVoicePreview(v);
                    }}
                    style={{
                      background: isPlaying ? "#F25F4C" : "#FAF9F6",
                      color: isPlaying ? "#FFFFFF" : "#17191F",
                      border: "1px solid #E8E5DF",
                      borderRadius: "20px",
                      padding: "0.4rem 0.85rem",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span>{isPlaying ? "⏹ Pause" : "▶ Preview"}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Render Action Button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E8E5DF", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
            <div style={{ fontSize: "0.8125rem", color: "#666B73" }}>
              Outputs vertical 1080x1920 MP4 with synchronized captions & ducked audio.
            </div>
            <button
              onClick={handleStartRender}
              className="button"
              style={{
                padding: "0.85rem 2rem",
                fontSize: "1rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>Generate Video with {selectedVoice.label} 🎬</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
