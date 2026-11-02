"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ProjectRecord, StoryboardRecord, SceneRecord } from "@/lib/db/projects";
import { cleanSvg } from "@/lib/video/cleanSvg";

const VISUAL_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  hook: { bg: "#FEF2F2", text: "#DC2626", border: "#FCA5A5", icon: "🎯" },
  flow: { bg: "#EEF2FF", text: "#315CEB", border: "#C7D2FE", icon: "⚡" },
  bars: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A", icon: "📊" },
  concept: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0", icon: "💡" },
  takeaway: { bg: "#FAF5FF", text: "#9333EA", border: "#E9D5FF", icon: "🏆" },
  comparison: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA", icon: "⚖️" },
  metric_callout: { bg: "#ECFEFF", text: "#0891B2", border: "#A5F3FC", icon: "📌" },
  process_steps: { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE", icon: "🪜" },
  "binary-search": { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", icon: "🌳" },
  science: { bg: "#F0F9FF", text: "#0284C7", border: "#BAE6FD", icon: "🔬" },
};

const VOICES = [
  {
    id: "neerja",
    name: "neerja",
    label: "Neerja",
    description: "Indian English · Warm, Crystal-Clear Female",
    previewUrl: "/audio/voice-neerja.mp3",
    tag: "Recommended for Teaching & Cooking",
  },
  {
    id: "prabhat",
    name: "prabhat",
    label: "Prabhat",
    description: "Indian English · Articulate, Confident Male",
    previewUrl: "/audio/voice-prabhat.mp3",
    tag: "Recommended for Coding & Tech",
  },
  {
    id: "christopher",
    name: "christopher",
    label: "Christopher",
    description: "US English · Deep, Engaging Explainer Male",
    previewUrl: "/audio/voice-christopher.mp3",
    tag: "Great for Science & Documentaries",
  },
  {
    id: "jenny",
    name: "jenny",
    label: "Jenny",
    description: "US English · Smooth, Friendly Studio Female",
    previewUrl: "/audio/voice-jenny.mp3",
    tag: "Great for General Knowledge",
  },
];

const TARGET_AUDIENCES = [
  { id: "general", label: "Curious Public", icon: "🌟" },
  { id: "students", label: "Students & Exams", icon: "🎓" },
  { id: "beginners", label: "Kids & Beginners", icon: "🧒" },
  { id: "professionals", label: "Developers & Pros", icon: "💼" },
];

export function StoryboardStudio({
  initialProject,
  initialStoryboard,
}: {
  initialProject: ProjectRecord;
  initialStoryboard: StoryboardRecord | null;
}) {
  const [project] = useState(initialProject);
  const [audience, setAudience] = useState(initialProject.targetAudience || "general");
  const [storyboard, setStoryboard] = useState<StoryboardRecord | null>(initialStoryboard);
  const [scenes, setScenes] = useState<SceneRecord[]>(initialStoryboard?.scenes || []);
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [revising, setRevising] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Inspection Modal State (Full-size SVG Vector View)
  const [inspectedSvg, setInspectedSvg] = useState<{
    sceneIndex: number;
    title: string;
    svgCode: string;
    visualLabel: string;
  } | null>(null);
  const [copiedSvg, setCopiedSvg] = useState(false);

  // Single Scene AI Redraw Modal State
  const [redrawSceneModal, setRedrawSceneModal] = useState<{
    index: number;
    title: string;
    narration: string;
  } | null>(null);
  const [redrawHint, setRedrawHint] = useState("");
  const [redrawing, setRedrawing] = useState(false);

  // Voice Selection State
  const initialVoice =
    VOICES.find(
      (v) =>
        v.id === initialProject.voiceId ||
        v.name === initialProject.voiceName ||
        (initialProject.voiceName === "viraj" && v.name === "prabhat") ||
        (initialProject.voiceName === "monica" && v.name === "neerja")
    ) || VOICES[0];
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
    setVideoUrl(null);

    try {
      const res = await fetch(`/api/projects/${project._id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: selectedVoice.id,
          voiceName: selectedVoice.name,
          scenes: scenes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start render");
      }
      if (data.storyboard) {
        setStoryboard(data.storyboard);
        setIsDirty(false);
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
    setIsDirty(true);
  }

  function updateSceneTitle(index: number, newTitle: string) {
    setScenes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], title: newTitle };
      return copy;
    });
    setIsDirty(true);
  }

  function updateSceneVisualLabel(index: number, newLabel: string) {
    setScenes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], visualLabel: newLabel };
      return copy;
    });
    setIsDirty(true);
  }

  function updateSceneVisualType(index: number, newType: string) {
    setScenes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], visualType: newType };
      return copy;
    });
    setIsDirty(true);
  }

  function moveSceneUp(index: number) {
    if (index <= 0) return;
    setScenes((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setIsDirty(true);
  }

  function moveSceneDown(index: number) {
    if (index >= scenes.length - 1) return;
    setScenes((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setIsDirty(true);
  }

  function deleteScene(index: number) {
    if (scenes.length <= 1) {
      setError("Storyboard must retain at least one scene.");
      return;
    }
    setScenes((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }

  function addScene() {
    const nextIdx = scenes.length + 1;
    const newScene: SceneRecord = {
      sceneId: `scene-${String(nextIdx).padStart(2, "0")}`,
      sequence: nextIdx,
      title: `Key Insight ${nextIdx}`,
      narration: "Enter narration explaining the next key insight or demonstration here...",
      estimatedSeconds: 12,
      visualType: "concept",
      visualLabel: "Visual concept diagram illustrating this principle clearly",
      accentWords: ["CORE", "KEY"],
    };
    setScenes((prev) => [...prev, newScene]);
    setIsDirty(true);
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
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleRedrawSingleScene() {
    if (!redrawSceneModal) return;
    setRedrawing(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${project._id}/scene/visual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneIndex: redrawSceneModal.index,
          userHint: redrawHint.trim() || undefined,
          narration: redrawSceneModal.narration,
          title: redrawSceneModal.title,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to redraw scene");

      setScenes((prev) => {
        const copy = [...prev];
        const cur = copy[redrawSceneModal.index];
        copy[redrawSceneModal.index] = {
          ...cur,
          svgCode: data.svgCode,
          diagram: cur.diagram
            ? { ...cur.diagram, svg_code: data.svgCode }
            : { diagram_type: "metric_card", headline: cur.title, svg_code: data.svgCode },
        };
        return copy;
      });

      // Also update inspected SVG if open
      if (inspectedSvg && inspectedSvg.sceneIndex === redrawSceneModal.index) {
        setInspectedSvg({
          ...inspectedSvg,
          svgCode: data.svgCode,
        });
      }

      setRedrawSceneModal(null);
      setRedrawHint("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error redrawing scene visual";
      setError(msg);
    } finally {
      setRedrawing(false);
    }
  }

  async function handleGenerateStoryboard(audienceToUse?: string) {
    const finalAudience = audienceToUse || audience;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project._id}/storyboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAudience: finalAudience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate storyboard");
      setStoryboard(data.storyboard);
      setScenes(data.storyboard.scenes);
      setIsDirty(false);
      if (data.targetAudience) setAudience(data.targetAudience);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleApplyRevision(e?: React.FormEvent, promptOverride?: string) {
    if (e) e.preventDefault();
    const finalPrompt = (promptOverride || revisionPrompt).trim();
    if (!finalPrompt) return;

    setRevising(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project._id}/storyboard/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionPrompt: finalPrompt, targetAudience: audience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply revision");
      setStoryboard(data.storyboard);
      setScenes(data.storyboard.scenes);
      setRevisionPrompt("");
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error revising";
      setError(msg);
    } finally {
      setRevising(false);
    }
  }

  async function handleDeleteProject() {
    setDeletingProject(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project._id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to delete project (HTTP ${res.status})`);
      }
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting project";
      setError(msg);
      setDeletingProject(false);
      setConfirmDelete(false);
    }
  }

  function handleCopySvg() {
    if (!inspectedSvg?.svgCode) return;
    navigator.clipboard.writeText(cleanSvg(inspectedSvg.svgCode));
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  }

  const pacingStatus =
    estimatedDuration >= 50 && estimatedDuration <= 80
      ? { label: "Optimal Reel Pacing", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" }
      : estimatedDuration < 50
      ? { label: "Snappy & Fast (<50s)", color: "#315CEB", bg: "#EEF2FF", border: "#C7D2FE" }
      : { label: "In-Depth (>80s)", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", paddingBottom: "6rem" }}>
      {/* Top Navigation & Status Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ flex: "1 1 280px", minWidth: "min(100%, 280px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <Link
              href="/dashboard"
              style={{
                fontSize: "0.8125rem",
                color: "#315CEB",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                transition: "transform 0.15s ease",
              }}
            >
              ← Back to All Projects
            </Link>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                style={{
                  background: "transparent",
                  border: "1px solid #FECACA",
                  borderRadius: "6px",
                  padding: "0.25rem 0.65rem",
                  fontSize: "0.75rem",
                  color: "#DC2626",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#FEE2E2";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                🗑️ Delete Project
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#DC2626", fontWeight: 600 }}>
                  Permanently delete?
                </span>
                <button
                  type="button"
                  disabled={deletingProject}
                  onClick={handleDeleteProject}
                  style={{
                    background: "#DC2626",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0.25rem 0.65rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: deletingProject ? "not-allowed" : "pointer",
                  }}
                >
                  {deletingProject ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  type="button"
                  disabled={deletingProject}
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    background: "#F3F4F6",
                    color: "#475569",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0.25rem 0.65rem",
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

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#17191F", margin: 0, letterSpacing: "-0.025em" }}>
              {storyboard?.title || project.title}
            </h1>
            <span
              style={{
                fontSize: "0.75rem",
                background: "#EEF2FF",
                color: "#315CEB",
                padding: "0.25rem 0.65rem",
                borderRadius: "20px",
                fontWeight: 700,
                border: "1px solid #C7D2FE",
              }}
            >
              v{storyboard?.version || project.currentVersion}
            </span>
            {videoUrl && (
              <span
                style={{
                  fontSize: "0.75rem",
                  background: "#D1FAE5",
                  color: "#065F46",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "20px",
                  fontWeight: 700,
                  border: "1px solid #A7F3D0",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
                1080x1920 Video Ready
              </span>
            )}
          </div>

          <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "#64748B" }}>
            Topic: <strong style={{ color: "#1E293B" }}>&ldquo;{project.topic}&rdquo;</strong>
          </p>

          {/* Interactive Target Audience Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              🎯 Target Audience:
            </span>
            {TARGET_AUDIENCES.map((a) => {
              const isSelected = audience === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setAudience(a.id);
                    handleGenerateStoryboard(a.id);
                  }}
                  disabled={generating || revising}
                  title={`Switch to ${a.label} and re-adapt storyboard`}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "16px",
                    border: isSelected ? "1.5px solid #315CEB" : "1px solid #E2E8F0",
                    background: isSelected ? "#EEF2FF" : "#FAF9F6",
                    color: isSelected ? "#315CEB" : "#475569",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: generating || revising ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 2px 6px rgba(49, 92, 235, 0.15)" : "none",
                  }}
                >
                  <span>{a.icon}</span>
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pacing Speedometer Gauge */}
        <div
          style={{
            background: "#FFFFFF",
            border: `1.5px solid ${pacingStatus.border}`,
            borderRadius: "12px",
            padding: "0.85rem 1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            minWidth: "min(100%, 220px)",
            flex: "1 1 200px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              REEL PACING GAUGE
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: pacingStatus.color,
                background: pacingStatus.bg,
                padding: "0.15rem 0.5rem",
                borderRadius: "10px",
              }}
            >
              {pacingStatus.label}
            </span>
          </div>

          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#17191F", letterSpacing: "-0.02em" }}>
            ~{estimatedDuration}s{" "}
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#64748B" }}>
              ({totalWords} words)
            </span>
          </div>

          {/* Mini progress bar toward 60s benchmark */}
          <div style={{ width: "100%", height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.min(100, (estimatedDuration / 60) * 100)}%`,
                height: "100%",
                background: pacingStatus.color,
                borderRadius: "3px",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#94A3B8" }}>
            <span>Target: 50–75s</span>
            <span>~150 WPM cadence</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.85rem 1.25rem", background: "#FEE2E2", color: "#991B1B", borderRadius: "8px", fontSize: "0.875rem", border: "1px solid #FCA5A5", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div style={{ padding: "0.85rem 1.25rem", background: "#D1FAE5", color: "#065F46", borderRadius: "8px", fontSize: "0.875rem", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>✓</span>
          <span>Storyboard and visual assets updated successfully!</span>
        </div>
      )}

      {/* Render In-Progress Progress Card */}
      {rendering && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #315CEB",
            borderRadius: "14px",
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(49, 92, 235, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className="spinner" style={{ width: 22, height: 22, border: "2.5px solid #315CEB", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#17191F", fontWeight: 700 }}>
                  Synthesizing High-Definition Reel ({renderProgress}%)
                </h3>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.8125rem", color: "#64748B" }}>
                  Generating neural voiceover, compiling Remotion dynamic SVG scenes, and burning kinetic captions
                </p>
              </div>
            </div>
            <span style={{ fontSize: "0.8125rem", color: "#315CEB", fontWeight: 700, background: "#EEF2FF", padding: "0.3rem 0.75rem", borderRadius: "20px" }}>
              Voice: {selectedVoice.label} · 1080x1920 MP4
            </span>
          </div>

          <div style={{ width: "100%", height: "10px", background: "#E2E8F0", borderRadius: "5px", overflow: "hidden" }}>
            <div
              style={{
                width: `${renderProgress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #315CEB 0%, #45D6B5 100%)",
                borderRadius: "5px",
                transition: "width 0.4s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748B" }}>
            <span>{renderStage || "Processing video pipeline..."}</span>
            <span>Estimated time: ~15-25 seconds</span>
          </div>
        </div>
      )}

      {/* COMPLETED VIDEO PREVIEW PLAYER (1080x1920) */}
      {videoUrl && (
        <div
          className="video-player-grid"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            color: "#FFFFFF",
            borderRadius: "16px",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Vertical 9:16 Video Player Frame */}
          <div
            style={{
              width: "100%",
              maxWidth: "320px",
              aspectRatio: "9/16",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
              border: "3px solid #334155",
              background: "#000",
              position: "relative",
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
                  letterSpacing: "0.08em",
                  background: "rgba(69, 214, 181, 0.15)",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "20px",
                }}
              >
                ● 1080x1920 VERTICAL REEL READY
              </span>
              <h2 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0.6rem 0 0.35rem", color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {storyboard?.title || project.title}
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "#94A3B8", margin: 0, lineHeight: 1.6 }}>
                Rendered with neural voiceover ({selectedVoice.label}), kinetic word-by-word captions, and topic-specific dynamic motion visuals ({videoDuration || estimatedDuration}s).
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
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
                  boxShadow: "0 4px 15px rgba(69, 214, 181, 0.3)",
                }}
              >
                Download 1080x1920 MP4 ⬇
              </a>

              <button
                onClick={() => {
                  voiceSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "0.85rem 1.25rem",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                }}
              >
                Re-render with Voice / Updates ↻
              </button>
            </div>

            <div
              style={{
                marginTop: "0.5rem",
                padding: "1rem 1.25rem",
                borderRadius: "10px",
                background: "rgba(30, 41, 59, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#FFFFFF" }}>
                  Instagram Reels Publishing (Milestone F07)
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "0.15rem" }}>
                  Direct auto-upload to your Instagram Creator / Business account.
                </div>
              </div>
              <button
                onClick={() => alert("Ready for Milestone F07: Instagram Connect & Auto-Publishing!")}
                style={{
                  background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.5rem 1.1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(221, 42, 123, 0.3)",
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
            border: "2px dashed #CBD5E1",
            borderRadius: "16px",
            padding: "4rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#EEF2FF",
              color: "#315CEB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
            }}
          >
            📋
          </div>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#17191F", margin: 0 }}>
              No Storyboard Generated Yet
            </h2>
            <p style={{ fontSize: "0.9375rem", color: "#64748B", maxWidth: "480px", margin: "0.5rem auto 0", lineHeight: 1.5 }}>
              Generate a 5-scene educational script and dynamic SVG vector storyboard for:{" "}
              <strong style={{ color: "#0F172A" }}>&ldquo;{project.topic}&rdquo;</strong>
            </p>
          </div>
          <button
            onClick={() => handleGenerateStoryboard()}
            disabled={generating}
            className="button"
            style={{
              padding: "0.85rem 2rem",
              fontSize: "1rem",
              fontWeight: 700,
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
                    width: 16,
                    height: 16,
                    border: "2px solid #fff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span>Generating Storyboard & SVG Graphics...</span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#17191F", margin: 0, letterSpacing: "-0.02em" }}>
                Scene-by-Scene Script & Motion Visuals
              </h2>
              <span style={{ fontSize: "0.75rem", background: "#F1F5F9", color: "#475569", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: 700 }}>
                {scenes.length} Scenes
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <button
                onClick={addScene}
                className="chip-button"
                style={{
                  background: "#F8FAFC",
                  border: "1.5px solid #CBD5E1",
                  color: "#1E293B",
                  fontWeight: 700,
                }}
              >
                <span>➕ Add Scene</span>
              </button>

              <button
                onClick={handleSaveChanges}
                disabled={saving}
                style={{
                  background: isDirty ? "#315CEB" : "#FAF9F6",
                  border: isDirty ? "1px solid #244BD2" : "1px solid #E8E5DF",
                  color: isDirty ? "#FFFFFF" : "#17191F",
                  borderRadius: "8px",
                  padding: "0.45rem 1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  boxShadow: isDirty ? "0 4px 12px rgba(49, 92, 235, 0.2)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{saving ? "Saving..." : isDirty ? "💾 Save Changes*" : "✓ Saved"}</span>
              </button>

              <button
                onClick={() => handleGenerateStoryboard()}
                disabled={generating}
                style={{
                  background: "#FAF9F6",
                  border: "1px solid #E8E5DF",
                  borderRadius: "8px",
                  padding: "0.45rem 0.95rem",
                  fontSize: "0.8125rem",
                  color: "#315CEB",
                  fontWeight: 600,
                  cursor: generating ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span>{generating ? "Regenerating..." : "↻ Regenerate All"}</span>
              </button>
            </div>
          </div>

          {/* Individual Scene Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {scenes.map((scene, index) => {
              const visualMeta =
                VISUAL_TYPE_COLORS[scene.visualType] || { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB", icon: "🎨" };
              const wordCount = scene.narration.trim().split(/\s+/).filter(Boolean).length;
              const hasSvg = Boolean(scene.svgCode || scene.diagram?.svg_code);

              return (
                <div
                  key={scene.sceneId || index}
                  className="interactive-card scene-card-grid"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "14px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* Left Column: Narration Scripting */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            background: "#1E293B",
                            color: "#FFFFFF",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "6px",
                          }}
                        >
                          #{index + 1}
                        </span>
                        <input
                          type="text"
                          value={scene.title}
                          onChange={(e) => updateSceneTitle(index, e.target.value)}
                          placeholder="Scene title"
                          style={{
                            fontSize: "0.9375rem",
                            fontWeight: 700,
                            color: "#17191F",
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: "6px",
                            padding: "0.3rem 0.65rem",
                            flex: 1,
                            maxWidth: "280px",
                          }}
                        />
                      </div>

                      {/* Scene Ordering & Delete Controls */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <button
                          type="button"
                          onClick={() => moveSceneUp(index)}
                          disabled={index === 0}
                          title="Move Scene Up"
                          style={{
                            background: "#F1F5F9",
                            border: "1px solid #CBD5E1",
                            borderRadius: "4px",
                            padding: "0.2rem 0.45rem",
                            fontSize: "0.75rem",
                            cursor: index === 0 ? "not-allowed" : "pointer",
                            opacity: index === 0 ? 0.4 : 1,
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSceneDown(index)}
                          disabled={index === scenes.length - 1}
                          title="Move Scene Down"
                          style={{
                            background: "#F1F5F9",
                            border: "1px solid #CBD5E1",
                            borderRadius: "4px",
                            padding: "0.2rem 0.45rem",
                            fontSize: "0.75rem",
                            cursor: index === scenes.length - 1 ? "not-allowed" : "pointer",
                            opacity: index === scenes.length - 1 ? 0.4 : 1,
                          }}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteScene(index)}
                          title="Delete Scene"
                          style={{
                            background: "#FEE2E2",
                            border: "1px solid #FCA5A5",
                            borderRadius: "4px",
                            padding: "0.2rem 0.45rem",
                            fontSize: "0.75rem",
                            color: "#DC2626",
                            cursor: scenes.length <= 1 ? "not-allowed" : "pointer",
                            opacity: scenes.length <= 1 ? 0.4 : 1,
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        🎙️ Spoken Narration
                      </label>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: wordCount > 35 ? "#D97706" : "#64748B",
                        }}
                      >
                        ~{scene.estimatedSeconds}s · {wordCount} words
                      </span>
                    </div>

                    <textarea
                      value={scene.narration}
                      onChange={(e) => updateSceneText(index, e.target.value)}
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "0.85rem",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        background: "#FAF9F6",
                        fontSize: "0.9375rem",
                        color: "#17191F",
                        lineHeight: 1.55,
                        fontFamily: "inherit",
                        resize: "vertical",
                        outline: "none",
                      }}
                    />

                    {/* Accent / Kinetic Highlights */}
                    {scene.accentWords && scene.accentWords.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.15rem" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                          Kinetic Highlights:
                        </span>
                        {scene.accentWords.map((word, wIdx) => (
                          <span
                            key={wIdx}
                            style={{
                              fontSize: "0.72rem",
                              background: "#FEF3C7",
                              color: "#92400E",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                              fontWeight: 700,
                              letterSpacing: "0.02em",
                            }}
                          >
                            #{word}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Visual Cue & SVG Vector Preview */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      background: "#F8FAFC",
                      padding: "1.1rem",
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        🎨 Scene Visual Direction
                      </span>
                      <select
                        value={scene.visualType}
                        onChange={(e) => updateSceneVisualType(index, e.target.value)}
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.25rem 0.6rem",
                          borderRadius: "6px",
                          background: visualMeta.bg,
                          color: visualMeta.text,
                          border: `1px solid ${visualMeta.border}`,
                          cursor: "pointer",
                        }}
                      >
                        <option value="hook">🎯 Hook / Problem</option>
                        <option value="concept">💡 Concept Core</option>
                        <option value="process_steps">🪜 Process Steps</option>
                        <option value="comparison">⚖️ Comparison Grid</option>
                        <option value="binary-search">🌳 Binary Search / Trees</option>
                        <option value="science">🔬 Science & Physics Vector</option>
                        <option value="takeaway">🏆 Key Takeaway</option>
                      </select>
                    </div>

                    {/* Interactive SVG / Illustration Preview Container */}
                    <div
                      onClick={() => {
                        if (hasSvg) {
                          setInspectedSvg({
                            sceneIndex: index,
                            title: scene.title,
                            svgCode: scene.svgCode || scene.diagram?.svg_code || "",
                            visualLabel: scene.visualLabel,
                          });
                        }
                      }}
                      title={hasSvg ? "Click to view full-size vector diagram" : undefined}
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "175px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "#0F172A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0.5rem",
                        boxSizing: "border-box",
                        cursor: hasSvg ? "pointer" : "default",
                        border: "1px solid #1E293B",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {hasSvg ? (
                        <div
                          className="svg-preview-wrapper"
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: cleanSvg(scene.svgCode || scene.diagram?.svg_code || ""),
                          }}
                        />
                      ) : (
                        <div style={{ textAlign: "center", color: "#64748B", fontSize: "0.8125rem" }}>
                          No SVG vector generated yet
                        </div>
                      )}

                      {/* Click overlay indicator */}
                      {hasSvg && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "8px",
                            right: "8px",
                            background: "rgba(15, 23, 42, 0.8)",
                            color: "#94A3B8",
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          🔍 Expand
                        </div>
                      )}
                    </div>

                    {/* Action Bar for Scene Graphic */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setRedrawSceneModal({
                            index,
                            title: scene.title,
                            narration: scene.narration,
                          });
                          setRedrawHint("");
                        }}
                        style={{
                          background: "#EEF2FF",
                          border: "1px solid #C7D2FE",
                          color: "#315CEB",
                          borderRadius: "6px",
                          padding: "0.3rem 0.65rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>✨ Redraw Visual</span>
                      </button>

                      {hasSvg && (
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedSvg({
                              sceneIndex: index,
                              title: scene.title,
                              svgCode: scene.svgCode || scene.diagram?.svg_code || "",
                              visualLabel: scene.visualLabel,
                            });
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid #CBD5E1",
                            color: "#475569",
                            borderRadius: "6px",
                            padding: "0.3rem 0.65rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          🔍 Inspect Diagram
                        </button>
                      )}
                    </div>

                    {/* Visual Motion Prompt / Label */}
                    <textarea
                      value={scene.visualLabel}
                      onChange={(e) => updateSceneVisualLabel(index, e.target.value)}
                      rows={2}
                      placeholder="Visual motion cue..."
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        background: "#FFFFFF",
                        fontSize: "0.8125rem",
                        color: "#17191F",
                        lineHeight: 1.45,
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Scene Big Action */}
          <button
            type="button"
            onClick={addScene}
            style={{
              padding: "1rem",
              background: "#FFFFFF",
              border: "2px dashed #CBD5E1",
              borderRadius: "12px",
              color: "#315CEB",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#315CEB";
              e.currentTarget.style.background = "#F8FAFF";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#CBD5E1";
              e.currentTarget.style.background = "#FFFFFF";
            }}
          >
            <span>➕ Add Another Scene to Storyboard</span>
          </button>
        </div>
      )}

      {/* Conversational AI Revision Co-Pilot Box */}
      {scenes.length > 0 && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #315CEB",
            borderRadius: "14px",
            padding: "1.75rem",
            boxShadow: "0 6px 24px rgba(49, 92, 235, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.3rem" }}>🤖</span>
            <div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "#17191F", margin: 0 }}>
                AI Revision Co-Pilot
              </h3>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.8125rem", color: "#64748B" }}>
                Request natural language revisions to pacing, tone, metaphors, or visual graphics across all scenes.
              </p>
            </div>
          </div>

          <form onSubmit={handleApplyRevision} className="revision-form">
            <input
              type="text"
              value={revisionPrompt}
              onChange={(e) => setRevisionPrompt(e.target.value)}
              placeholder="e.g. 'Make the opening hook more dramatic', 'Explain scene 2 like I am 10 years old', 'Add concrete numbers'..."
              disabled={revising}
              style={{
                flex: 1,
                padding: "0.85rem 1.15rem",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
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
                padding: "0.85rem 1.5rem",
                cursor: revising || !revisionPrompt.trim() ? "not-allowed" : "pointer",
                opacity: revising || !revisionPrompt.trim() ? 0.7 : 1,
                fontWeight: 700,
              }}
            >
              {revising ? "Revising Storyboard..." : "Apply AI Revision →"}
            </button>
          </form>

          {/* Audience & Style Quick Revision Chips */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>
              💡 Quick Adapters:
            </span>
            {[
              { label: "🧒 Simplify for Beginners", prompt: "Explain this using fun, playful visual metaphors for kids and beginners with zero jargon." },
              { label: "⚡ High-Energy Hook", prompt: "Make the opening scene hook intensely dramatic, shocking, and impossible to scroll past." },
              { label: "🎓 Step-by-Step Breakdown", prompt: "Walk through concrete numbered steps and clear cause-and-effect with metrics." },
              { label: "⏱️ Trim to Under 60s", prompt: "Condense this script tightly to under 55 seconds (around 120 words) for rapid short-form reels." },
              { label: "🔬 Technical Deep Dive", prompt: "Make this concise, technical, and data-dense for software engineers and practitioners." },
              { label: "🌟 Real-Life Analogy", prompt: "Ground this in a vivid, relatable everyday real-world analogy." },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                disabled={revising}
                onClick={() => {
                  setRevisionPrompt(chip.prompt);
                  handleApplyRevision(undefined, chip.prompt);
                }}
                className="chip-button"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VOICE SELECTION & RENDER TRIGGER SECTION */}
      {scenes.length > 0 && !rendering && (
        <div
          ref={voiceSectionRef}
          id="voice-selection"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "#315CEB", letterSpacing: "0.06em" }}>
              STAGE 3: NEURAL VOICE & VIDEO SYNTHESIS
            </span>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#17191F", margin: "0.3rem 0 0", letterSpacing: "-0.02em" }}>
              Select Narration Voice
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#64748B", margin: "0.25rem 0 0" }}>
              Audition the neural voices below. Each voice delivers natural breathing pauses and authentic Indian English pronunciation.
            </p>
          </div>

          <div className="voice-selection-grid">
            {VOICES.map((v) => {
              const isSelected = selectedVoice.id === v.id;
              const isPlaying = playingVoice === v.name;

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVoice(v)}
                  className="interactive-card"
                  style={{
                    border: `2px solid ${isSelected ? "#315CEB" : "#E2E8F0"}`,
                    background: isSelected ? "#F8FAFF" : "#FFFFFF",
                    borderRadius: "12px",
                    padding: "1.35rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: isSelected ? "0 6px 20px rgba(49, 92, 235, 0.1)" : "none",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontWeight: 800, color: "#17191F", fontSize: "1.1rem" }}>{v.label}</span>
                      {isSelected && (
                        <span style={{ fontSize: "0.7rem", background: "#315CEB", color: "#FFF", padding: "0.15rem 0.5rem", borderRadius: "10px", fontWeight: 700 }}>
                          Selected
                        </span>
                      )}
                      {/* Animated Audio Equalizer Wave while playing */}
                      {isPlaying && (
                        <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "16px", marginLeft: "0.25rem" }}>
                          <span className="equalizer-bar" />
                          <span className="equalizer-bar" />
                          <span className="equalizer-bar" />
                          <span className="equalizer-bar" />
                          <span className="equalizer-bar" />
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#64748B", marginTop: "0.25rem" }}>{v.description}</div>
                    <div style={{ fontSize: "0.72rem", color: "#315CEB", fontWeight: 600, marginTop: "0.35rem" }}>{v.tag}</div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playVoicePreview(v);
                    }}
                    style={{
                      background: isPlaying ? "#F25F4C" : "#F8FAFC",
                      color: isPlaying ? "#FFFFFF" : "#17191F",
                      border: "1px solid #CBD5E1",
                      borderRadius: "20px",
                      padding: "0.45rem 0.95rem",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{isPlaying ? "⏹ Pause" : "▶ Audition"}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Render Action Button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: "1.5rem", marginTop: "0.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ fontSize: "0.875rem", color: "#64748B" }}>
              Outputs vertical <strong>1080x1920 MP4</strong> with dynamic vector motion graphics, neural narration, and synchronized captions.
            </div>
            <button
              onClick={handleStartRender}
              className="button"
              style={{
                padding: "0.95rem 2.25rem",
                fontSize: "1.0625rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                boxShadow: "0 6px 20px rgba(49, 92, 235, 0.25)",
              }}
            >
              <span>Generate Reel with {selectedVoice.label} 🎬</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BAR DOCK (Sticky Bottom Control) */}
      {scenes.length > 0 && (
        <div className="floating-action-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.8125rem", fontWeight: 700 }}>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: pacingStatus.color,
              }}
            />
            <span>{scenes.length} Scenes · ~{estimatedDuration}s</span>
          </div>

          <div style={{ width: 1, height: 20, background: "rgba(255, 255, 255, 0.2)" }} />

          {isDirty ? (
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              style={{
                background: "#F59E0B",
                color: "#0F172A",
                border: "none",
                borderRadius: "20px",
                padding: "0.35rem 0.85rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <span>● Save Unsaved Edits</span>
            </button>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>✓ Synced</span>
          )}

          <button
            onClick={() => {
              if (voiceSectionRef.current) {
                voiceSectionRef.current.scrollIntoView({ behavior: "smooth" });
              } else {
                handleStartRender();
              }
            }}
            style={{
              background: "#315CEB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "20px",
              padding: "0.45rem 1.15rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 2px 10px rgba(49, 92, 235, 0.4)",
            }}
          >
            <span>Render Reel 🎬</span>
          </button>
        </div>
      )}

      {/* DIAGRAM INSPECTION MODAL (Milestone F04 / F05) */}
      {inspectedSvg && (
        <div
          className="modal-backdrop"
          onClick={() => setInspectedSvg(null)}
        >
          <div
            className="modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0F172A",
              color: "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              maxWidth: "800px",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontSize: "0.72rem", color: "#45D6B5", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  DYNAMIC VECTOR DIAGRAM · SCENE #{inspectedSvg.sceneIndex + 1}
                </span>
                <h3 style={{ margin: "0.2rem 0 0", fontSize: "1.25rem", fontWeight: 800, color: "#FFFFFF" }}>
                  {inspectedSvg.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectedSvg(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  color: "#FFFFFF",
                  fontSize: "1rem",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Large Canvas Display */}
            <div
              style={{
                padding: "1.25rem 1rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#080C14",
                minHeight: "240px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: "520px",
                  height: "auto",
                  minHeight: "200px",
                  maxHeight: "55vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
                dangerouslySetInnerHTML={{
                  __html: cleanSvg(inspectedSvg.svgCode),
                }}
              />
            </div>

            {/* Modal Bottom Actions */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div style={{ fontSize: "0.8125rem", color: "#94A3B8", maxWidth: "420px" }}>
                {inspectedSvg.visualLabel}
              </div>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={handleCopySvg}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "0.5rem 1rem",
                    color: "#FFFFFF",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {copiedSvg ? "✓ Copied SVG Code!" : "📋 Copy SVG Code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sceneToRedraw = scenes[inspectedSvg.sceneIndex];
                    setRedrawSceneModal({
                      index: inspectedSvg.sceneIndex,
                      title: sceneToRedraw.title,
                      narration: sceneToRedraw.narration,
                    });
                    setRedrawHint("");
                  }}
                  style={{
                    background: "#315CEB",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.5rem 1.15rem",
                    color: "#FFFFFF",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ✨ Redraw with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE SCENE AI VISUAL REDRAW MODAL */}
      {redrawSceneModal && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!redrawing) setRedrawSceneModal(null);
          }}
        >
          <div
            className="modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "1.5rem",
              maxWidth: "560px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#315CEB", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  AI VISUAL REDRAW · SCENE #{redrawSceneModal.index + 1}
                </span>
                <h3 style={{ margin: "0.25rem 0 0", fontSize: "1.35rem", fontWeight: 800, color: "#17191F" }}>
                  Redraw Scene Illustration
                </h3>
              </div>
              <button
                type="button"
                disabled={redrawing}
                onClick={() => setRedrawSceneModal(null)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  cursor: redrawing ? "not-allowed" : "pointer",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.9rem",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.875rem", color: "#64748B", margin: "0 0 1rem", lineHeight: 1.5 }}>
              Topic: <strong>{project.topic}</strong> &bull; Scene: <em>{redrawSceneModal.title}</em>
            </p>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                Visual Style or Custom Direction (Optional)
              </label>
              <textarea
                value={redrawHint}
                onChange={(e) => setRedrawHint(e.target.value)}
                placeholder="e.g. 'Show a glowing kadai with melting golden ghee and roasted gram flour', 'Add tree branches showing comparison', 'Focus on 3 numbered pillars'..."
                rows={3}
                disabled={redrawing}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  background: "#FAF9F6",
                  fontSize: "0.875rem",
                  color: "#17191F",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Quick Direction Chips */}
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {[
                "📊 Flowchart & Step Arrows",
                "🔬 Cross-Section / Inside View",
                "🌳 Hierarchical Tree / Branching",
                "🎨 Vibrant & Minimalist",
                "⚡ Dramatic High Contrast",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={redrawing}
                  onClick={() => setRedrawHint(suggestion)}
                  className="chip-button"
                  style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                disabled={redrawing}
                onClick={() => setRedrawSceneModal(null)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.65rem 1.15rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: redrawing ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={redrawing}
                onClick={handleRedrawSingleScene}
                className="button"
                style={{
                  padding: "0.65rem 1.35rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: redrawing ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {redrawing ? (
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
                    <span>Redrawing SVG...</span>
                  </>
                ) : (
                  <span>Redraw Scene Visual ✨</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
