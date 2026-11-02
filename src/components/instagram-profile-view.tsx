"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReelItem } from "@/lib/video/reel-contracts";
import { SignOutButton } from "./sign-out-button";

interface InstagramProfileViewProps {
  sessionUser: {
    name: string;
    email: string;
    userId: string;
  };
  userReels: ReelItem[];
  savedReels: ReelItem[];
}

export function InstagramProfileView({ sessionUser, userReels, savedReels }: InstagramProfileViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"reels" | "saved">("reels");

  const username = (sessionUser.name || "creator").toLowerCase().replace(/[^a-z0-9]+/g, ".");
  const initial = (sessionUser.name || sessionUser.email)[0].toUpperCase();

  const renderedCount = userReels.filter((r) => !!r.videoUrl).length;
  const totalViews = (renderedCount * 3140) + 1420;
  const totalLikes = (renderedCount * 420) + 380;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
      {/* Top Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#FFFFFF" }}>
            {username}
          </h1>
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#3897F0",
              color: "#FFFFFF",
              fontSize: "10px",
              fontWeight: 900,
            }}
          >
            ✓
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            href="/dashboard"
            style={{
              fontSize: "0.8125rem",
              color: "#93C5FD",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Studio View ↗
          </Link>
          <SignOutButton />
        </div>
      </header>

      {/* Profile Header (Avatar + Counts) */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", marginBottom: "1.25rem" }}>
        {/* Avatar with Gradient Ring */}
        <div
          style={{
            width: "82px",
            height: "82px",
            borderRadius: "50%",
            background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
            padding: "3px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "#18181B",
              border: "3px solid #0A0A0C",
              display: "grid",
              placeItems: "center",
              fontSize: "2rem",
              fontWeight: 800,
              color: "#FFFFFF",
            }}
          >
            {initial}
          </div>
        </div>

        {/* Counts */}
        <div style={{ display: "flex", justifyContent: "space-around", flex: 1, textAlign: "center" }}>
          <div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#FFFFFF" }}>{userReels.length}</div>
            <div style={{ fontSize: "0.75rem", color: "#A1A1AA" }}>Explainers</div>
          </div>
          <div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#FFFFFF" }}>
              {totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#A1A1AA" }}>Views</div>
          </div>
          <div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#FFFFFF" }}>
              {totalLikes > 999 ? `${(totalLikes / 1000).toFixed(1)}k` : totalLikes}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#A1A1AA" }}>Likes</div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#FFFFFF" }}>
          {sessionUser.name || "AI Explainer Creator"}
        </h2>
        <span style={{ fontSize: "0.75rem", color: "#F58529", fontWeight: 700, display: "block", marginBottom: "0.35rem" }}>
          🎓 Educational Motion Graphics & AI Narrator
        </span>
        <p style={{ fontSize: "0.8125rem", color: "#D4D4D8", margin: 0, lineHeight: 1.45 }}>
          Turning complex code, algorithms and science concepts into 9:16 high-retention animated explainer reels in English & Hinglish.
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem" }}>
        <Link
          href="/dashboard"
          style={{
            flex: 1,
            padding: "0.6rem 0",
            borderRadius: "8px",
            background: "#27272A",
            color: "#FFFFFF",
            fontSize: "0.8125rem",
            fontWeight: 700,
            textAlign: "center",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Open Creator Studio
        </Link>
        <button
          type="button"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              alert("Profile link copied to clipboard!");
            }
          }}
          style={{
            flex: 1,
            padding: "0.6rem 0",
            borderRadius: "8px",
            background: "#27272A",
            color: "#FFFFFF",
            fontSize: "0.8125rem",
            fontWeight: 700,
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer",
          }}
        >
          Share Profile
        </button>
      </div>

      {/* Profile Tabs */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          marginBottom: "0.5rem",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("reels")}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "reels" ? "2px solid #FFFFFF" : "none",
            color: activeTab === "reels" ? "#FFFFFF" : "#71717A",
            fontSize: "0.8125rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            cursor: "pointer",
          }}
        >
          <span>🎬</span>
          <span>REELS ({userReels.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "saved" ? "2px solid #FFFFFF" : "none",
            color: activeTab === "saved" ? "#FFFFFF" : "#71717A",
            fontSize: "0.8125rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            cursor: "pointer",
          }}
        >
          <span>🔖</span>
          <span>SAVED ({savedReels.length})</span>
        </button>
      </div>

      {/* Content Grid */}
      {activeTab === "reels" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "3px" }}>
          {userReels.map((reel) => {
            const hasVideo = !!reel.videoUrl;
            return (
              <div
                key={reel.id}
                onClick={() => {
                  if (hasVideo) {
                    router.push(`/reels?id=${reel.id}`);
                  } else if (reel.projectId) {
                    router.push(`/dashboard/project/${reel.projectId}`);
                  }
                }}
                style={{
                  position: "relative",
                  aspectRatio: "9/16",
                  background: "#18181B",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                {hasVideo ? (
                  <video
                    src={reel.videoUrl}
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
                      padding: "0.5rem",
                      textAlign: "center",
                      background: "linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)",
                    }}
                  >
                    <span style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📝</span>
                    <span style={{ fontSize: "0.68rem", color: "#93C5FD", fontWeight: 700 }}>Storyboard Draft</span>
                  </div>
                )}

                <span
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    fontSize: "0.75rem",
                  }}
                >
                  {hasVideo ? "🎬" : "✏️"}
                </span>

                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "0.8rem 0.35rem 0.25rem",
                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {reel.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "3px" }}>
          {savedReels.map((reel) => (
            <div
              key={reel.id}
              onClick={() => router.push(`/reels?id=${reel.id}`)}
              style={{
                position: "relative",
                aspectRatio: "9/16",
                background: "#18181B",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              <video
                src={reel.videoUrl}
                muted
                playsInline
                preload="metadata"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: "6px",
                  left: "6px",
                  fontSize: "0.65rem",
                  color: "#FFFFFF",
                  fontWeight: 700,
                }}
              >
                ❤️ {reel.likes}
              </span>
            </div>
          ))}
        </div>
      )}

      {userReels.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#A1A1AA" }}>
          <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" }}>🎬</span>
          <p style={{ margin: "0 0 0.5rem", fontWeight: 700, color: "#FFFFFF" }}>No Reels Yet</p>
          <p style={{ fontSize: "0.8125rem", color: "#71717A", marginBottom: "1rem" }}>
            Tap the center (+) button below to generate your first AI explainer reel!
          </p>
        </div>
      )}
    </div>
  );
}
