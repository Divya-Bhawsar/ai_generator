"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const QUICK_TOPICS = [
  "Why does a pressure cooker cook rajma and chana faster?",
  "How does binary search find a target number in milliseconds?",
  "How do commercial airplanes fly upside down?",
  "Why do we procrastinate and how does the brain choose distractions?",
];

export function CreateProjectCard() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(topicToUse?: string) {
    const finalTopic = topicToUse || topic;
    if (!finalTopic.trim()) {
      setError("Please enter an educational topic or pick a suggestion below.");
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingStep("1. Initializing project draft...");

    try {
      setTimeout(() => {
        setLoadingStep("2. Calling AI to generate 60–90s script & storyboard...");
      }, 900);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: finalTopic.trim(), generateImmediately: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setLoadingStep("3. Storyboard ready! Opening studio...");
      router.push(`/dashboard/project/${data.project._id}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate project";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E5DF",
        borderRadius: "12px",
        padding: "1.75rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#315CEB",
            }}
          >
            START A NEW EXPLAINER
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              background: "#EEF2FF",
              color: "#315CEB",
              padding: "0.15rem 0.5rem",
              borderRadius: "4px",
              fontWeight: 600,
            }}
          >
            AI Paced (60–90s)
          </span>
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#17191F", margin: 0 }}>
          What concept do you want to explain?
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#666B73", margin: "0.25rem 0 0" }}>
          Type any scientific concept, algorithm, history question, or everyday curiosity.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            background: "#FEE2E2",
            color: "#991B1B",
            borderRadius: "6px",
            fontSize: "0.875rem",
            border: "1px solid #FCA5A5",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Why does salt melt ice on winter roads?"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
          style={{
            flex: 1,
            minWidth: "280px",
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
          onClick={() => handleCreate()}
          disabled={loading}
          className="button"
          style={{
            padding: "0.75rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span>Generate Storyboard</span>
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#315CEB", fontSize: "0.8125rem", fontWeight: 500 }}>
          <span>⚙️</span>
          <span>{loadingStep}</span>
        </div>
      )}

      <div>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#666B73", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          ✨ OR PICK A POPULAR TOPIC:
        </span>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          {QUICK_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              disabled={loading}
              onClick={() => {
                setTopic(t);
                handleCreate(t);
              }}
              style={{
                background: "#FAF9F6",
                border: "1px solid #E8E5DF",
                borderRadius: "20px",
                padding: "0.4rem 0.85rem",
                fontSize: "0.8125rem",
                color: "#17191F",
                cursor: loading ? "not-allowed" : "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#315CEB";
                e.currentTarget.style.color = "#315CEB";
                e.currentTarget.style.background = "#EEF2FF";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#E8E5DF";
                e.currentTarget.style.color = "#17191F";
                e.currentTarget.style.background = "#FAF9F6";
              }}
            >
              {t} ↗
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
