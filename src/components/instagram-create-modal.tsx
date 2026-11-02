"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface InstagramCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  "How does Git Branching work under the hood",
  "Samjhao Cloud Computing simple terms mein",
  "Why is the sky blue (Rayleigh Scattering)",
  "Explain Bubble Sort vs Quick Sort in Hinglish",
  "How GPS satellites calculate exact location",
];

export function InstagramCreateModal({ isOpen, onClose }: InstagramCreateModalProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [voiceType, setVoiceType] = useState<"hinglish" | "english">("hinglish");
  const [audience, setAudience] = useState<"general" | "beginners" | "engineers">("general");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  if (!isOpen) return null;

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
      setError("Voice dictation is not supported in this browser. Please use Chrome, Edge, or Safari.");
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

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event?.error === "not-allowed") {
          setError("Microphone permission was denied. Please allow microphone access.");
        }
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

  async function handleCreate(promptTopic?: string) {
    const finalTopic = (promptTopic || topic).trim();
    if (!finalTopic) return;

    setLoading(true);
    setError(null);
    setLoadingStep("Drafting 9:16 Instagram Storyboard with Gemini AI...");

    try {
      // 1. Create project
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

      // 2. Generate Storyboard
      setLoadingStep("Directing scenes, animations & voice narration...");
      const sbRes = await fetch(`/api/projects/${projectId}/storyboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: finalTopic,
          targetAudience: audience,
          voiceLanguage: voiceType,
        }),
      });

      if (!sbRes.ok) {
        console.warn("Storyboard generation notice: continuing to studio for self-healing.");
      }

      onClose();
      router.push(`/dashboard/project/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating explainer reel");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          background: "#18181B",
          color: "#FFFFFF",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          padding: "1.25rem 1.25rem 2rem",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.6)",
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Grab Handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <div style={{ width: "42px", height: "4px", borderRadius: "2px", background: "rgba(255, 255, 255, 0.3)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
                fontSize: "14px",
              }}
            >
              🎬
            </span>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Create Explainer Reel</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "#94A3B8",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: "1rem",
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "0.65rem 0.85rem",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#FCA5A5",
              fontSize: "0.8125rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Input Bar with Mic */}
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
            placeholder={isListening ? "Listening... Speak your topic now..." : "What concept do you want to explain?"}
            style={{
              width: "100%",
              padding: "0.95rem 4.5rem 0.95rem 1rem",
              borderRadius: "12px",
              background: isListening ? "rgba(239, 68, 68, 0.15)" : "#27272A",
              border: isListening ? "1.5px solid #EF4444" : "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              fontSize: "0.9375rem",
              outline: "none",
              boxSizing: "border-box",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && topic.trim()) {
                handleCreate();
              }
            }}
          />

          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={loading}
            title={isListening ? "Stop listening" : "Speak topic (English / Hinglish)"}
            style={{
              position: "absolute",
              right: topic ? "34px" : "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: isListening ? "#EF4444" : "rgba(255, 255, 255, 0.12)",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            {isListening ? "⏹" : "🎙️"}
          </button>

          {topic && !loading && (
            <button
              type="button"
              onClick={() => setTopic("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#71717A",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Voice & Language Option */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={() => setVoiceType("hinglish")}
            style={{
              flex: 1,
              padding: "0.6rem 0.75rem",
              borderRadius: "10px",
              border: voiceType === "hinglish" ? "1.5px solid #F58529" : "1px solid rgba(255,255,255,0.1)",
              background: voiceType === "hinglish" ? "rgba(245, 133, 41, 0.15)" : "#27272A",
              color: "#FFFFFF",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🇮🇳 Hinglish Explanation
          </button>
          <button
            type="button"
            onClick={() => setVoiceType("english")}
            style={{
              flex: 1,
              padding: "0.6rem 0.75rem",
              borderRadius: "10px",
              border: voiceType === "english" ? "1.5px solid #315CEB" : "1px solid rgba(255,255,255,0.1)",
              background: voiceType === "english" ? "rgba(49, 92, 235, 0.15)" : "#27272A",
              color: "#FFFFFF",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🇺🇸 English Narration
          </button>
        </div>

        {/* Quick Ideas */}
        <div style={{ marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "0.72rem", color: "#A1A1AA", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.45rem" }}>
            💡 Quick Ideas:
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTopic(p)}
                style={{
                  background: "#27272A",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "20px",
                  padding: "0.3rem 0.75rem",
                  fontSize: "0.75rem",
                  color: "#D4D4D8",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={loading || !topic.trim()}
          onClick={() => handleCreate()}
          style={{
            width: "100%",
            padding: "0.95rem",
            borderRadius: "12px",
            border: "none",
            background: loading || !topic.trim() ? "rgba(255, 255, 255, 0.15)" : "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: "0.9375rem",
            cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
            boxShadow: loading || !topic.trim() ? "none" : "0 4px 20px rgba(221, 42, 123, 0.35)",
            transition: "transform 0.15s ease",
          }}
        >
          {loading ? loadingStep : "✨ Generate 9:16 Instagram Reel →"}
        </button>
      </div>
    </div>
  );
}
