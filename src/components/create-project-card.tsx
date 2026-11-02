"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface CategoryPrompts {
  id: string;
  name: string;
  icon: string;
  prompts: string[];
}

const TOPIC_CATEGORIES: CategoryPrompts[] = [
  {
    id: "trending",
    name: "Trending & Everyday",
    icon: "🔥",
    prompts: [
      "Why do onions make your eyes cry and how does chemistry trigger it?",
      "How do active noise-cancelling headphones cancel sound waves?",
      "Why does salt melt ice on cold winter roads?",
      "Why do we procrastinate and how does dopamine hijack our focus?",
    ],
  },
  {
    id: "tech",
    name: "Coding & Systems",
    icon: "💻",
    prompts: [
      "How does a Binary Search Tree search millions in O(log N)?",
      "How does Git actually store commits, trees, and blobs on disk?",
      "How does Redis achieve sub-millisecond in-memory speeds?",
      "How does HTTPS public-key encryption prevent eavesdropping?",
    ],
  },
  {
    id: "cooking",
    name: "Kitchen Chemistry",
    icon: "🍳",
    prompts: [
      "Why does a pressure cooker cook rajma 70% faster?",
      "The exact food science behind making soft melting Besan Ladoos",
      "Why does sourdough bread rise and bubble with wild yeast?",
      "Why does browning butter (Maillard reaction) create nutty flavor?",
    ],
  },
  {
    id: "science",
    name: "Biology & Physics",
    icon: "🔬",
    prompts: [
      "How do vaccines train your immune cells to recognize viruses?",
      "Why do tree leaves change from green to vibrant autumn gold?",
      "How do commercial airplanes fly upside down without falling?",
      "What actually happens inside quantum entanglement across space?",
    ],
  },
  {
    id: "hinglish",
    name: "Hinglish Explainer 🇮🇳",
    icon: "🇮🇳",
    prompts: [
      "Binary search tree kaise kaam karta hai step by step Hinglish me samjhao",
      "Pressure cooker me khana 70% jaldi kyu banta hai? Kitchen science in Hinglish",
      "Git commit aur branch pointers disk pe kaise store hote hain Hinglish me",
      "Dopamine kaise hamare focus aur procrastination ko control karta hai in Hinglish",
    ],
  },
];

const TARGET_AUDIENCES = [
  {
    id: "general",
    label: "Curious Public",
    icon: "🌟",
    badge: "VIRAL REEL",
    desc: "Snappy analogies, relatable hooks & zero academic fluff",
    color: "#315CEB",
    bg: "#EEF2FF",
  },
  {
    id: "students",
    label: "Students & Exams",
    icon: "🎓",
    badge: "WORKED EXAMPLES",
    desc: "Clear step-by-step logic, concrete numbers & visual diagrams",
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    id: "beginners",
    label: "Kids & Beginners",
    icon: "🧒",
    badge: "PLAYFUL & SIMPLE",
    desc: "Fun cartoon metaphors, simple vocabulary & bright visuals",
    color: "#D97706",
    bg: "#FFFBEB",
  },
  {
    id: "professionals",
    label: "Developers & Pros",
    icon: "💼",
    badge: "PRODUCTION GRADE",
    desc: "Fast-paced, mathematical depth & real system trade-offs",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
];

export function CreateProjectCard() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("general");
  const [selectedCat, setSelectedCat] = useState("trending");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const activeCategory = TOPIC_CATEGORIES.find((c) => c.id === selectedCat) || TOPIC_CATEGORIES[0];

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
      setError("Voice input (speech-to-text) is not supported in this browser. Please use Google Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "en-IN"; // Native support for Indian English, Hindi & Hinglish
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
        console.warn("Speech recognition error:", event?.error);
        setIsListening(false);
        if (event?.error === "not-allowed") {
          setError("Microphone permission was denied. Please allow microphone access in your browser address bar.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      console.warn("Speech recognition start exception:", err);
      setIsListening(false);
    }
  }

  async function handleCreate(topicToUse?: string) {
    const finalTopic = topicToUse || topic;
    if (!finalTopic.trim()) {
      setError("Please enter a concept or choose one of the suggestions below.");
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingStep("Analyzing pedagogical structure & concrete example...");

    try {
      setTimeout(() => {
        setLoadingStep("Generating custom SVG motion-graphics blueprints...");
      }, 1200);

      setTimeout(() => {
        setLoadingStep("Synthesizing speech timestamps & scene layout...");
      }, 2600);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: finalTopic.trim(),
          targetAudience: audience,
          generateImmediately: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setLoadingStep("Opening Studio with AI Storyboard!");
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
      className="interactive-card"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E5DF",
        borderRadius: "16px",
        padding: "2rem",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.06), 0 2px 8px -2px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #315CEB 0%, #06B6D4 50%, #E9AE45 100%)",
        }}
      />

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#315CEB",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>✨</span> AI VIDEO CREATOR STUDIO
            </span>
          </div>
          <span
            style={{
              fontSize: "0.72rem",
              background: "#EEF2FF",
              color: "#315CEB",
              border: "1px solid #C7D2FE",
              padding: "0.2rem 0.65rem",
              borderRadius: "20px",
              fontWeight: 700,
            }}
          >
            ● 1080x1920 Vertical Reel
          </span>
        </div>

        <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#17191F", margin: 0, letterSpacing: "-0.02em" }}>
          What concept do you want to explain?
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#666B73", margin: "0.35rem 0 0", lineHeight: 1.5 }}>
          Type any scientific puzzle, coding logic, recipe, or everyday curiosity. VidyaMotion creates voice-synced diagrams and custom illustrations.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "0.85rem 1.15rem",
            background: "#FEF2F2",
            color: "#991B1B",
            borderRadius: "8px",
            fontSize: "0.875rem",
            border: "1px solid #FCA5A5",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Target Audience Selector */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#666B73",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            🎯 1. CHOOSE AUDIENCE TONE
          </span>
          <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
            Adapts vocabulary, analogies, and pacing
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {TARGET_AUDIENCES.map((a) => {
            const isSelected = audience === a.id;
            return (
              <button
                key={a.id}
                type="button"
                disabled={loading}
                onClick={() => setAudience(a.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                  padding: "0.85rem 1rem",
                  borderRadius: "10px",
                  border: isSelected ? `2px solid ${a.color}` : "1px solid #E8E5DF",
                  background: isSelected ? a.bg : "#FAF9F6",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.18s ease",
                  boxShadow: isSelected ? "0 4px 12px rgba(49, 92, 235, 0.12)" : "none",
                  transform: isSelected ? "translateY(-1px)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "0.3rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "1.1rem" }}>{a.icon}</span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: isSelected ? a.color : "#17191F",
                      }}
                    >
                      {a.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      color: a.color,
                      letterSpacing: "0.04em",
                      opacity: 0.9,
                    }}
                  >
                    {a.badge}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: isSelected ? "#1E293B" : "#64748B",
                    lineHeight: "1.35",
                  }}
                >
                  {a.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Topic Input & Generation Button */}
      <div>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#666B73",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            display: "block",
            marginBottom: "0.6rem",
          }}
        >
          💡 2. ENTER TOPIC OR QUESTION
        </span>

        <div className="create-project-input-row">
          <div style={{ position: "relative", flex: 1, minWidth: "min(100%, 260px)" }}>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={isListening ? "Listening... Speak your topic now..." : "e.g. How the binary search tree works..."}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              style={{
                width: "100%",
                padding: "0.875rem 4.75rem 0.875rem 1.15rem",
                borderRadius: "10px",
                border: isListening ? "1.5px solid #EF4444" : "1.5px solid #D1D5DB",
                background: isListening ? "#FFF5F5" : "#FFFFFF",
                fontSize: "0.9375rem",
                color: "#17191F",
                outline: "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                if (!isListening) {
                  e.currentTarget.style.borderColor = "#315CEB";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(49, 92, 235, 0.15)";
                }
              }}
              onBlur={(e) => {
                if (!isListening) {
                  e.currentTarget.style.borderColor = "#D1D5DB";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            />

            {/* Mic Dictation Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={loading}
              title={isListening ? "Stop listening" : "Speak topic with microphone (English / Hinglish)"}
              style={{
                position: "absolute",
                right: topic.length > 0 ? "34px" : "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: isListening ? "#EF4444" : "#F1F5F9",
                border: "none",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "grid",
                placeItems: "center",
                cursor: loading ? "not-allowed" : "pointer",
                color: isListening ? "#FFFFFF" : "#475569",
                fontSize: "0.95rem",
                animation: isListening ? "pulse-subtle 1s infinite" : "none",
                transition: "all 0.15s ease",
                padding: 0,
              }}
            >
              {isListening ? "⏹" : "🎙️"}
            </button>

            {topic.length > 0 && !loading && (
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
                  color: "#94A3B8",
                  cursor: "pointer",
                  fontSize: "1rem",
                  padding: "4px",
                }}
                title="Clear input"
              >
                ✕
              </button>
            )}

            {isListening && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.35rem", fontSize: "0.75rem", color: "#DC2626", fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626", display: "inline-block", animation: "pulse-subtle 1s infinite" }} />
                <span>Listening... Speak your topic in English or Hinglish!</span>
              </div>
            )}
          </div>

          <button
            onClick={() => handleCreate()}
            disabled={loading}
            style={{
              padding: "0.875rem 1.75rem",
              borderRadius: "10px",
              border: "none",
              background: loading
                ? "#94A3B8"
                : "linear-gradient(135deg, #315CEB 0%, #2548B8 100%)",
              color: "#FFFFFF",
              fontSize: "0.9375rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(49, 92, 235, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.transform = "none";
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    height: 16,
                    border: "2px solid #FFFFFF",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.75s linear infinite",
                  }}
                />
                <span>Generating Explainer...</span>
              </>
            ) : (
              <>
                <span>Generate Video Storyboard</span>
                <span aria-hidden="true" style={{ fontSize: "1.1rem" }}>→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: "10px",
            padding: "0.85rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#166534",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: "1.2rem", animation: "spin 1.5s linear infinite", display: "inline-block" }}>
            ⚙️
          </span>
          <div style={{ flex: 1 }}>
            <div>{loadingStep}</div>
            <div style={{ fontSize: "0.75rem", color: "#15803D", fontWeight: 500, marginTop: "2px" }}>
              Tailoring technical diagrams, timing cues, and speech pacing.
            </div>
          </div>
        </div>
      )}

      {/* Topic Suggestions by Category */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#666B73", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ✨ 3. OR GET INSPIRED BY TOPIC:
          </span>

          {/* Category Tabs */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {TOPIC_CATEGORIES.map((cat) => {
              const isSelected = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  style={{
                    background: isSelected ? "#315CEB" : "#F1F5F9",
                    color: isSelected ? "#FFFFFF" : "#475569",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.25rem 0.6rem",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Prompts */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {activeCategory.prompts.map((pText) => (
            <button
              key={pText}
              type="button"
              disabled={loading}
              onClick={() => {
                setTopic(pText);
                handleCreate(pText);
              }}
              className="chip-button"
            >
              <span>{pText}</span>
              <span style={{ color: "#315CEB" }}>↗</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
