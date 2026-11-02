"use client";

import Link from "next/link";
import { SignOutButton } from "../sign-out-button";

interface GammaWorkspaceHeaderProps {
  userName: string;
  userEmail: string;
  projectCount: number;
  onOpenCreate?: () => void;
}

export function GammaWorkspaceHeader({
  userName,
  userEmail,
  projectCount,
  onOpenCreate,
}: GammaWorkspaceHeaderProps) {
  const initial = (userName || userEmail)[0].toUpperCase();

  return (
    <header
      style={{
        height: "64px",
        borderBottom: "1px solid var(--gamma-border)",
        background: "rgba(12, 13, 20, 0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Brand + Workspace Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: "1.05rem",
            letterSpacing: "-0.02em",
          }}
        >
          <span
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "var(--gamma-gradient)",
              display: "grid",
              placeItems: "center",
              fontSize: "14px",
              color: "#FFFFFF",
              boxShadow: "0 0 14px rgba(99, 102, 241, 0.4)",
            }}
          >
            ✦
          </span>
          <span>VidyaMotion</span>
        </Link>

        <span style={{ color: "rgba(255, 255, 255, 0.2)", fontSize: "1rem" }}>/</span>

        {/* Workspace Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.3rem 0.65rem",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: "0.8125rem",
            color: "#E2E8F0",
            fontWeight: 600,
          }}
        >
          <span>⚡</span>
          <span>{userName || "Personal"}&apos;s Studio</span>
          <span
            style={{
              fontSize: "0.6875rem",
              background: "rgba(99, 102, 241, 0.25)",
              color: "#A5B4FC",
              padding: "0.1rem 0.4rem",
              borderRadius: "10px",
              fontWeight: 700,
            }}
          >
            {projectCount} {projectCount === 1 ? "Deck" : "Decks"}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        {onOpenCreate && (
          <button
            type="button"
            onClick={onOpenCreate}
            className="gamma-gradient-btn"
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8125rem",
            }}
          >
            <span>✦</span>
            <span>New Explainer</span>
          </button>
        )}

        {/* User Avatar */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "var(--gamma-gradient)",
            color: "#FFFFFF",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: "13px",
            boxShadow: "0 0 10px rgba(99, 102, 241, 0.3)",
          }}
        >
          {initial}
        </div>

        <SignOutButton />
      </div>
    </header>
  );
}
