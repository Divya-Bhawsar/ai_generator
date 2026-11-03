"use client";

import Link from "next/link";
import { SignOutButton } from "../sign-out-button";
import { BrandLogo } from "@/components/brand-logo";

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
        borderBottom: "1px solid #E2E8F0",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
      }}
    >
      {/* Left: Brand + Workspace Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <BrandLogo href="/dashboard" size="medium" />

        <span className="gamma-workspace-pill" style={{ color: "#CBD5E1", fontSize: "1rem" }}>/</span>

        {/* Workspace Pill */}
        <div
          className="gamma-workspace-pill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.3rem 0.65rem",
            borderRadius: "8px",
            background: "#F1F5F9",
            border: "1px solid #E2E8F0",
            fontSize: "0.8125rem",
            color: "#1E293B",
            fontWeight: 600,
          }}
        >
          <span>⚡</span>
          <span>{userName || "Personal"}&apos;s Studio</span>
          <span
            style={{
              fontSize: "0.6875rem",
              background: "#EEF2FF",
              color: "#4338CA",
              border: "1px solid #C7D2FE",
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
      <div className="gamma-workspace-header-actions" style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        {onOpenCreate && (
          <button
            type="button"
            onClick={onOpenCreate}
            className="gamma-gradient-btn"
            style={{
              padding: "0.5rem 0.85rem",
              fontSize: "0.8125rem",
            }}
          >
            <span>✦</span>
            <span>New<span className="gamma-header-new-btn-text"> Explainer</span></span>
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
