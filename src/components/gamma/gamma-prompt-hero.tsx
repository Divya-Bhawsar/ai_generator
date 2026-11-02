"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface GammaPromptHeroProps {
  onSuccess?: (projectId: string) => void;
}

const GAMMA_TEMPLATES = [
  {
    icon: "💻",
    title: "Binary Search Algorithm",
    category: "DSA & Code",
    prompt: "How Binary Search cuts search time from O(N) to O(log n) using midpoint halving",
  },
  {
    icon: "⚡",
    title: "CPU Memory Hierarchy",
    category: "System Architecture",
    prompt: "Computer Memory Architecture: CPU Registers vs L1/L2 Cache vs RAM vs NVMe SSD",
  },
  {
    icon: "🍲",
    title: "Science of Besan Ladoo",
    category: "Food Chemistry",
    prompt: "The molecular science of roasting Besan Ladoo: Maillard reaction and ghee crystallization",
  },
  {
    icon: "✈️",
    title: "Aerodynamic Winglets",
    category: "Physics & Aviation",
    prompt: "Why commercial jet airplane wings have curved tips: Bernoulli lift and vortex induced drag",
  },
  {
    icon: "🚀",
    title: "LeetCode Sliding Window",
    category: "Interview Prep",
    prompt: "Cracking LeetCode problems with Two Pointers and Sliding Window algorithmic patterns",
  },
  {
    icon: "☁️",
    title: "Cloud Object Storage",
    category: "Infrastructure",
    prompt: "How Cloud Storage distributes data across global edge buckets with zero egress fees",
  },
];

export function GammaPromptHero({ onSuccess }: GammaPromptHeroProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<"hinglish" | "english">("hinglish");
  const [audience, setAudience] = useState<"general" | "beginners" | "engineers">("general");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<any>(null);

  function toggleVoiceInput() {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognitionClass) {
      setError("Voice dictation is not supported in this browser. Please use Google Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setTopic(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  async function handleGenerate(topicOverride?: string) {
    const finalTopic = (topicOverride || topic).trim();
    if (!finalTopic) return;

    setLoading(true);
    setError(null);
    setLoadingStep("Structuring animated presentation cards with Gemini AI...");

    try {
      // 1. Create Project
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: finalTopic,
          targetAudience: audience,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");

      const projectId = data.project._id;

      // 2. Synthesize Storyboard & Scenes
      setLoadingStep("Designing vector graphics, synchronized voiceover & captions...");
      const sbRes = await fetch(`/api/projects/${projectId}/storyboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: finalTopic,
          targetAudience: audience,
          voiceLanguage: language,
        }),
      });

      if (!sbRes.ok) {
        console.warn("Storyboard generation notice: proceeding to studio for self-healing.");
      }

      if (onSuccess) {
        onSuccess(projectId);
      } else {
        router.push(`/dashboard/project/${projectId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error generating presentation");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #EEF2FF 0%, #FAF5FF 50%, #FDF2F8 100%)",
        border: "1.5px solid #C7D2FE",
        borderRadius: "24px",
        padding: "2.5rem 2rem",
        boxShadow: "0 10px 40px rgba(99, 102, 241, 0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header Tag */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#4338CA",
            background: "rgba(99, 102, 241, 0.15)",
            border: "1px solid #C7D2FE",
            padding: "0.25rem 0.65rem",
            borderRadius: "12px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          ✦ AI KNOWLEDGE STUDIO · PRESENTATION DECK GENERATOR
        </span>
      </div>

      <h1
        style={{
          fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
          fontWeight: 800,
          color: "#0F172A",
          margin: "0 0 0.65rem",
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
        }}
      >
        Transform any concept into an{" "}
        <span
          style={{
            background: "var(--gamma-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          animated visual presentation.
        </span>
      </h1>

      <p style={{ fontSize: "1rem", color: "#334155", margin: "0 0 1.75rem", lineHeight: 1.6, fontWeight: 450 }}>
        Type or speak any topic. VidyaMotion synthesizes structured visual cards, animated vector diagrams, and synchronized voice narration.
      </p>

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            background: "#FEE2E2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            fontSize: "0.85rem",
            marginBottom: "1.25rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Main Input Card */}
      <div
        style={{
          background: "#FFFFFF",
          border: isListening ? "2px solid #EF4444" : "1.5px solid #CBD5E1",
          borderRadius: "16px",
          padding: "0.6rem 0.6rem 0.6rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          boxShadow: isListening ? "0 0 25px rgba(239, 68, 68, 0.25)" : "0 4px 20px rgba(15, 23, 42, 0.06)",
          marginBottom: "1.25rem",
          transition: "all 0.2s ease",
        }}
      >
        <span style={{ fontSize: "1.25rem", color: "#4F46E5" }}>✦</span>

        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
          placeholder={isListening ? "Listening... Speak your topic now in English or Hinglish..." : "What concept or topic do you want to explain? (e.g. How CPU Cache works, Bernoulli's Principle...)"}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "#0F172A",
            fontSize: "1.05rem",
            outline: "none",
            fontWeight: 500,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && topic.trim()) {
              handleGenerate();
            }
          }}
        />

        {/* Mic Dictation */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          disabled={loading}
          title={isListening ? "Stop listening" : "Speak topic with microphone (English & Hinglish)"}
          style={{
            background: isListening ? "#EF4444" : "#F1F5F9",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            width: "38px",
            height: "38px",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            fontSize: "1.05rem",
            color: isListening ? "#FFFFFF" : "#334155",
            transition: "all 0.15s ease",
          }}
        >
          {isListening ? "⏹" : "🎙️"}
        </button>

        {topic && !loading && (
          <button
            type="button"
            onClick={() => setTopic("")}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        )}

        {/* Big Generate Button */}
        <button
          type="button"
          disabled={loading || !topic.trim()}
          onClick={() => handleGenerate()}
          className="gamma-gradient-btn"
          style={{
            padding: "0.85rem 1.65rem",
            fontSize: "0.95rem",
            opacity: loading || !topic.trim() ? 0.6 : 1,
            cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <span>{loading ? "✦ Generating..." : "Generate Deck ✦"}</span>
        </button>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#4338CA", fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem" }}>
          <span style={{ animation: "spin-vinyl 1s linear infinite", display: "inline-block" }}>✦</span>
          <span>{loadingStep}</span>
        </div>
      )}

      {/* Control Pills: Language & Style */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 800, textTransform: "uppercase" }}>
            Narration Voice:
          </span>
          <button
            type="button"
            onClick={() => setLanguage("hinglish")}
            className={`gamma-pill-btn ${language === "hinglish" ? "gamma-pill-active" : ""}`}
          >
            <span>🇮🇳</span>
            <span>Hinglish (Hindi + English)</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage("english")}
            className={`gamma-pill-btn ${language === "english" ? "gamma-pill-active" : ""}`}
          >
            <span>🇺🇸</span>
            <span>English (Neural)</span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 800, textTransform: "uppercase" }}>
            Target Level:
          </span>
          <button
            type="button"
            onClick={() => setAudience("general")}
            className={`gamma-pill-btn ${audience === "general" ? "gamma-pill-active" : ""}`}
          >
            Intuitive & Clear
          </button>
          <button
            type="button"
            onClick={() => setAudience("beginners")}
            className={`gamma-pill-btn ${audience === "beginners" ? "gamma-pill-active" : ""}`}
          >
            🧒 For Beginners
          </button>
          <button
            type="button"
            onClick={() => setAudience("engineers")}
            className={`gamma-pill-btn ${audience === "engineers" ? "gamma-pill-active" : ""}`}
          >
            🔬 Technical Deep Dive
          </button>
        </div>
      </div>

      {/* Starter Deck Gallery */}
      <div>
        <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: "0.75rem", letterSpacing: "0.06em" }}>
          ✦ OR START FROM A CURATED TOPIC DECK:
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
          {GAMMA_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleGenerate(tmpl.prompt)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                padding: "0.95rem 1.15rem",
                textAlign: "left",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.18s ease",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#818CF8";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(79, 70, 229, 0.12)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(15, 23, 42, 0.04)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "1.35rem" }}>{tmpl.icon}</span>
                <span style={{ fontSize: "0.6875rem", color: "#4F46E5", fontWeight: 700, background: "#EEF2FF", padding: "0.15rem 0.5rem", borderRadius: "10px" }}>
                  {tmpl.category}
                </span>
              </div>
              <strong style={{ fontSize: "0.9375rem", color: "#0F172A", marginTop: "0.35rem" }}>
                {tmpl.title}
              </strong>
              <p style={{ fontSize: "0.8125rem", color: "#475569", margin: 0, lineHeight: 1.45 }}>
                {tmpl.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
