"use client";

import { useState } from "react";
import { SocialPackage } from "@/lib/db/projects";

interface SocialPackageCardProps {
  projectId: string;
  initialPackage?: SocialPackage | null;
  topic: string;
  title: string;
  onOpenPublish?: () => void;
  onPackageUpdate?: (pkg: SocialPackage) => void;
}

export function SocialPackageCard({
  projectId,
  initialPackage,
  topic,
  title,
  onOpenPublish,
  onPackageUpdate,
}: SocialPackageCardProps) {
  const [socialPackage, setSocialPackage] = useState<SocialPackage | null>(
    initialPackage || null
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hook, setHook] = useState(initialPackage?.hook || "");
  const [takeaways, setTakeaways] = useState<string[]>(
    initialPackage?.takeaways || []
  );
  const [callToAction, setCallToAction] = useState(
    initialPackage?.callToAction || ""
  );
  const [hashtags, setHashtags] = useState<string[]>(
    initialPackage?.hashtags || []
  );
  const [newTagInput, setNewTagInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lazy-fetch or generate if not present
  async function fetchOrGenerate(regenerate = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/social`, {
        method: regenerate ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: regenerate ? JSON.stringify({ regenerate: true }) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load social package");
      setSocialPackage(data.socialPackage);
      setHook(data.socialPackage.hook);
      setTakeaways(data.socialPackage.takeaways);
      setCallToAction(data.socialPackage.callToAction);
      setHashtags(data.socialPackage.hashtags);
      setIsEditing(false);
      onPackageUpdate?.(data.socialPackage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error generating package");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveManual() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hook,
          takeaways,
          callToAction,
          hashtags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save edits");
      setSocialPackage(data.socialPackage);
      setIsEditing(false);
      setSaveSuccess(true);
      onPackageUpdate?.(data.socialPackage);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyFull() {
    if (!socialPackage) return;
    const textToCopy = socialPackage.fullCaption;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleCopyHashtagsOnly() {
    if (!socialPackage) return;
    const tags = socialPackage.hashtags
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .join(" ");
    navigator.clipboard.writeText(tags);
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2500);
  }

  function handleAddTag() {
    const clean = newTagInput.trim().replace(/^#/, "");
    if (clean && !hashtags.includes(clean)) {
      setHashtags([...hashtags, clean]);
      setNewTagInput("");
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setHashtags(hashtags.filter((t) => t !== tagToRemove));
  }

  if (!socialPackage && !loading) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px dashed #CBD5E1",
          borderRadius: "16px",
          padding: "2rem",
          textAlign: "center",
          boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
        }}
      >
        <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>
          📱
        </span>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A", margin: "0 0 0.35rem" }}>
          AI Social Package Generator (Instagram Reels)
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#334155", maxWidth: "480px", margin: "0 auto 1.25rem" }}>
          Auto-generate an engagement-optimized caption, 3 bullet takeaways, and viral niche hashtags for your Reel.
        </p>
        <button
          type="button"
          onClick={() => fetchOrGenerate(false)}
          className="gamma-gradient-btn"
          style={{ padding: "0.65rem 1.35rem", fontSize: "0.875rem" }}
        >
          <span>✦ Generate Social Package</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: "16px",
        padding: "1.75rem",
        boxShadow: "0 8px 30px rgba(15, 23, 42, 0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", color: "#4F46E5", letterSpacing: "0.06em" }}>
              ✦ AI SOCIAL PACKAGE GENERATOR (PRD STEP 4.2)
            </span>
            <span style={{ fontSize: "0.6875rem", background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE", padding: "0.1rem 0.5rem", borderRadius: "10px", fontWeight: 700 }}>
              Instagram & YouTube Shorts Ready
            </span>
          </div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F172A", margin: "0.3rem 0 0", letterSpacing: "-0.02em" }}>
            Caption & Viral Hashtags
          </h3>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => fetchOrGenerate(true)}
            disabled={loading}
            style={{
              background: "#F8FAFC",
              color: "#334155",
              border: "1px solid #CBD5E1",
              borderRadius: "10px",
              padding: "0.45rem 0.85rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "all 0.15s ease",
            }}
          >
            <span>{loading ? "Regenerating..." : "↻ Regenerate with AI"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            style={{
              background: isEditing ? "#EEF2FF" : "#F8FAFC",
              color: isEditing ? "#4338CA" : "#334155",
              border: `1px solid ${isEditing ? "#818CF8" : "#CBD5E1"}`,
              borderRadius: "10px",
              padding: "0.45rem 0.85rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isEditing ? "✕ Cancel Editing" : "✎ Edit Caption"}
          </button>

          <button
            type="button"
            onClick={handleCopyFull}
            className="gamma-gradient-btn"
            style={{
              padding: "0.45rem 1.15rem",
              fontSize: "0.8125rem",
            }}
          >
            <span>{copied ? "✓ Copied to Clipboard!" : "📋 Copy Full Caption"}</span>
          </button>

          {onOpenPublish && (
            <button
              type="button"
              onClick={onOpenPublish}
              style={{
                background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "0.45rem 0.95rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(221, 42, 123, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>Publish Reel 🚀</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "#FEE2E2", color: "#991B1B", borderRadius: "10px", fontSize: "0.85rem", border: "1px solid #FCA5A5" }}>
          {error}
        </div>
      )}

      {saveSuccess && (
        <div style={{ padding: "0.75rem 1rem", background: "#D1FAE5", color: "#065F46", borderRadius: "10px", fontSize: "0.85rem", border: "1px solid #A7F3D0" }}>
          ✓ Social package edits saved successfully!
        </div>
      )}

      {/* Main Content: Split Preview Box & Components */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Left: Structured Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* 1. Viral Hook */}
          <div style={{ background: "#F8FAFC", padding: "1rem", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
              1. 1-Sentence Hook (Stops The Scroll)
            </span>
            {isEditing ? (
              <textarea
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                rows={2}
                style={{ width: "100%", marginTop: "0.4rem", padding: "0.5rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.875rem" }}
              />
            ) : (
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.9375rem", fontWeight: 700, color: "#0F172A", lineHeight: 1.45 }}>
                {hook}
              </p>
            )}
          </div>

          {/* 2. 3 Bullet Takeaways */}
          <div style={{ background: "#F8FAFC", padding: "1rem", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
              2. 3 Key Takeaways (Bullet Summary)
            </span>
            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.4rem" }}>
                {takeaways.map((t, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={t}
                    onChange={(e) => {
                      const copy = [...takeaways];
                      copy[idx] = e.target.value;
                      setTakeaways(copy);
                    }}
                    style={{ padding: "0.45rem", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                  />
                ))}
              </div>
            ) : (
              <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem", fontSize: "0.875rem", color: "#334155", lineHeight: 1.6 }}>
                {takeaways.map((t, idx) => (
                  <li key={idx} style={{ marginBottom: "0.25rem" }}>
                    <strong style={{ color: "#0F172A" }}>{t}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 3. Call to Action */}
          <div style={{ background: "#F8FAFC", padding: "1rem", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
              3. Call-To-Action (Follow & Save)
            </span>
            {isEditing ? (
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                style={{ width: "100%", marginTop: "0.4rem", padding: "0.45rem", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
              />
            ) : (
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "#4F46E5", fontWeight: 600 }}>
                {callToAction}
              </p>
            )}
          </div>

          {/* 4. Hashtag Chips */}
          <div style={{ background: "#F8FAFC", padding: "1rem", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                4. Niche Hashtags ({hashtags.length})
              </span>
              <button
                type="button"
                onClick={handleCopyHashtagsOnly}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#4F46E5",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {copiedHashtags ? "✓ Copied Tags" : "Copy Tags Only ↗"}
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "#EEF2FF",
                    color: "#4338CA",
                    border: "1px solid #C7D2FE",
                    borderRadius: "16px",
                    padding: "0.25rem 0.65rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <span>#{tag.replace(/^#/, "")}</span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer", padding: "0 2px" }}
                    >
                      ✕
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isEditing && (
              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem" }}>
                <input
                  type="text"
                  placeholder="Add hashtag (e.g. physics)..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  style={{ flex: 1, padding: "0.35rem 0.65rem", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  style={{ background: "#4F46E5", color: "#FFF", border: "none", borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer" }}
                >
                  + Add
                </button>
              </div>
            )}
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={handleSaveManual}
              disabled={loading}
              className="gamma-gradient-btn"
              style={{ padding: "0.65rem 1.25rem", fontSize: "0.875rem", alignSelf: "flex-start" }}
            >
              <span>{loading ? "Saving..." : "Save Custom Caption"}</span>
            </button>
          )}
        </div>

        {/* Right: Live Ready-To-Paste Reel Caption Preview Box */}
        <div
          style={{
            background: "#0F172A",
            borderRadius: "14px",
            padding: "1.25rem",
            color: "#F8FAFC",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #334155",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Mock Instagram Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "0.75rem", marginBottom: "0.85rem" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
                display: "grid",
                placeItems: "center",
                color: "#FFF",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              ✦
            </div>
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#FFFFFF" }}>vidyamotion.reels</div>
              <div style={{ fontSize: "0.6875rem", color: "#94A3B8" }}>Original Audio · Voice & Music Track</div>
            </div>
          </div>

          {/* Live Formatted Output */}
          <div style={{ flex: 1, whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "0.8125rem", lineHeight: 1.55, color: "#CBD5E1", overflowY: "auto", maxHeight: "380px" }}>
            {socialPackage?.fullCaption || "Generating social package..."}
          </div>

          {/* Footer Copy CTA inside preview */}
          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "0.85rem", marginTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
              {socialPackage?.fullCaption?.length || 0} characters
            </span>
            <button
              type="button"
              onClick={handleCopyFull}
              style={{
                background: copied ? "#10B981" : "rgba(255, 255, 255, 0.15)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "0.35rem 0.85rem",
                fontSize: "0.78125rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {copied ? "✓ Copied!" : "Copy Caption 📋"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
