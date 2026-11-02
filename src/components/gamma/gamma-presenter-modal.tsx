"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export interface PresenterScene {
  sequence: number;
  title: string;
  narration: string;
  visualLabel: string;
  estimatedSeconds?: number;
}

interface GammaPresenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  videoUrl?: string | null;
  voiceName?: string;
  duration?: number;
  projectId?: string;
  scenes?: PresenterScene[];
}

export function GammaPresenterModal({
  isOpen,
  onClose,
  title,
  videoUrl,
  voiceName = "Madhur Neural",
  duration = 60,
  projectId,
  scenes = [],
}: GammaPresenterModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " || e.key === "k") {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      } else if (e.key === "m") {
        setIsMuted((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#08090D",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top Gamma Presenter Bar */}
      <header
        style={{
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          background: "rgba(12, 13, 20, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              borderRadius: "8px",
              padding: "0.35rem 0.75rem",
              color: "#E2E8F0",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span>✕</span>
            <span>Exit Present (Esc)</span>
          </button>

          <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#FFFFFF" }}>
            {title}
          </span>

          <span
            style={{
              fontSize: "0.75rem",
              background: "rgba(99, 102, 241, 0.2)",
              color: "#A5B4FC",
              padding: "0.2rem 0.6rem",
              borderRadius: "12px",
              fontWeight: 600,
            }}
          >
            ✦ Presenter Mode
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => setShowNotesDrawer((prev) => !prev)}
            style={{
              background: showNotesDrawer ? "rgba(99, 102, 241, 0.25)" : "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "0.35rem 0.75rem",
              color: showNotesDrawer ? "#A5B4FC" : "#E2E8F0",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>📝 Presenter Script Notes</span>
          </button>

          {projectId && (
            <Link
              href={`/dashboard/project/${projectId}`}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.35rem 0.75rem",
                color: "#E2E8F0",
                fontSize: "0.8125rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              ✏️ Edit in Studio
            </Link>
          )}

          {videoUrl && (
            <a
              href={videoUrl}
              download={`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`}
              className="gamma-gradient-btn"
              style={{
                padding: "0.4rem 0.95rem",
                fontSize: "0.8125rem",
                textDecoration: "none",
              }}
            >
              Export MP4 ⬇
            </a>
          )}
        </div>
      </header>

      {/* Main Presentation Stage */}
      <div style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden" }}>
        {/* Centered Video Player Stage */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            position: "relative",
          }}
        >
          {videoUrl ? (
            <div
              style={{
                position: "relative",
                maxHeight: "calc(100vh - 170px)",
                aspectRatio: "9/16",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
                border: "2px solid rgba(255, 255, 255, 0.12)",
                background: "#000",
              }}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                autoPlay
                playsInline
                muted={isMuted}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          ) : (
            <div
              style={{
                maxWidth: "600px",
                padding: "3rem 2rem",
                textAlign: "center",
                background: "#181A2A",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
              }}
            >
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>🎬</span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#FFFFFF" }}>
                Ready to Render Presentation
              </h2>
              <p style={{ color: "#CBD5E1", fontSize: "0.9375rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                This presentation has its storyboard cards organized. Jump into the Studio to render the 1080p video with neural voiceover.
              </p>
              {projectId && (
                <Link
                  href={`/dashboard/project/${projectId}`}
                  className="gamma-gradient-btn"
                  style={{
                    padding: "0.75rem 1.5rem",
                    fontSize: "0.9375rem",
                    textDecoration: "none",
                  }}
                >
                  Open in Studio to Render →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Presenter Notes & Script Sidebar (Collapsible) */}
        {showNotesDrawer && (
          <aside
            style={{
              width: "360px",
              background: "#131520",
              borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "1.25rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#818CF8", textTransform: "uppercase" }}>
                ✦ Scene-by-Scene Script Notes
              </span>
              <button
                type="button"
                onClick={() => setShowNotesDrawer(false)}
                style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {scenes.map((scene, i) => (
                <div
                  key={i}
                  onClick={() => setActiveSceneIndex(i)}
                  style={{
                    padding: "0.85rem",
                    borderRadius: "12px",
                    background: activeSceneIndex === i ? "rgba(99, 102, 241, 0.15)" : "#181A2A",
                    border: activeSceneIndex === i ? "1px solid #818CF8" : "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#818CF8" }}>
                      CARD 0{scene.sequence || i + 1}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "#94A3B8" }}>
                      {scene.visualLabel}
                    </span>
                  </div>
                  <strong style={{ fontSize: "0.85rem", color: "#FFFFFF", display: "block", marginBottom: "0.25rem" }}>
                    {scene.title}
                  </strong>
                  <p style={{ fontSize: "0.78125rem", color: "#CBD5E1", margin: 0, lineHeight: 1.45 }}>
                    "{scene.narration}"
                  </p>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Scene Timeline Bar (Gamma Style) */}
      {scenes.length > 0 && (
        <footer
          style={{
            height: "64px",
            background: "rgba(12, 13, 20, 0.95)",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            padding: "0 1.5rem",
            gap: "0.75rem",
            overflowX: "auto",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "var(--gamma-text-dim)", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>
            CARDS:
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
            {scenes.map((scene, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSceneIndex(i)}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "8px",
                  background: activeSceneIndex === i ? "var(--gamma-gradient)" : "rgba(255, 255, 255, 0.05)",
                  border: activeSceneIndex === i ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#FFFFFF",
                  fontSize: "0.78125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span>{i + 1}.</span>
                <span>{scene.title}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.75rem", color: "#94A3B8", whiteSpace: "nowrap" }}>
            <span>🎙️ {voiceName}</span>
            <span>•</span>
            <span>{duration}s</span>
          </div>
        </footer>
      )}
    </div>
  );
}
