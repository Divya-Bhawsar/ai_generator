"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface GammaPromptHeroProps {
  onSuccess?: (projectId: string) => void;
}

export interface TopicSuggestion {
  icon: string;
  category: string;
  title: string;
  prompt: string;
  tag: string;
}

export const ALL_TOPIC_SUGGESTIONS: TopicSuggestion[] = [
  // Coding & Systems
  {
    icon: "💻",
    category: "Coding & DSA",
    title: "Binary Search Algorithm",
    prompt: "How Binary Search cuts search time from O(N) to O(log n) using midpoint halving",
    tag: "DSA",
  },
  {
    icon: "🚀",
    category: "Coding & DSA",
    title: "LeetCode Sliding Window",
    prompt: "Cracking LeetCode problems with Two Pointers and Sliding Window algorithmic patterns",
    tag: "Algorithms",
  },
  {
    icon: "🌳",
    category: "Coding & DSA",
    title: "Git Internal Object Store",
    prompt: "How Git actually stores commits, trees, and blobs on disk using SHA-1 hashing",
    tag: "DevTools",
  },
  {
    icon: "⚡",
    category: "Coding & DSA",
    title: "CPU Memory Hierarchy",
    prompt: "Computer Memory Architecture: CPU Registers vs L1/L2 Cache vs RAM vs NVMe SSD",
    tag: "Architecture",
  },
  {
    icon: "🔒",
    category: "Coding & DSA",
    title: "HTTPS & Public-Key Encryption",
    prompt: "How RSA and Elliptic Curve asymmetric cryptography prevents network eavesdropping",
    tag: "Security",
  },
  {
    icon: "🏎️",
    category: "Coding & DSA",
    title: "Redis In-Memory Engine",
    prompt: "Why Redis achieves sub-millisecond latency: single-threaded event loop and epoll",
    tag: "Databases",
  },

  // Everyday & Science
  {
    icon: "🎧",
    category: "Science & Physics",
    title: "Active Noise Cancellation",
    prompt: "How active noise-cancelling headphones invert sound waves through destructive phase interference",
    tag: "Acoustics",
  },
  {
    icon: "✈️",
    category: "Science & Physics",
    title: "Why Airplane Wings Have Curved Tips",
    prompt: "Why commercial jet airplane wings have curved tips: Bernoulli lift and vortex induced drag",
    tag: "Aerodynamics",
  },
  {
    icon: "❄️",
    category: "Science & Physics",
    title: "Why Salt Melts Ice",
    prompt: "Why salt melts ice on roads: freezing point depression and ionic dissolution",
    tag: "Chemistry",
  },
  {
    icon: "🧅",
    category: "Science & Physics",
    title: "Why Onions Make You Cry",
    prompt: "The exact chemical reaction: syn-propanethial-S-oxide triggering tear glands",
    tag: "Biochemistry",
  },
  {
    icon: "🧬",
    category: "Science & Physics",
    title: "How mRNA Vaccines Work",
    prompt: "How lipid nanoparticles deliver mRNA blueprints to train immune dendritic cells",
    tag: "Immunology",
  },
  {
    icon: "🌌",
    category: "Science & Physics",
    title: "Quantum Entanglement",
    prompt: "What Einstein called spooky action at a distance: wave function collapse across space",
    tag: "Quantum",
  },

  // Cooking & Kitchen Chemistry
  {
    icon: "🍲",
    category: "Kitchen Chemistry",
    title: "Molecular Science of Besan Ladoo",
    prompt: "The molecular science of roasting Besan Ladoo: Maillard reaction and ghee crystallization",
    tag: "Culinary",
  },
  {
    icon: "🍳",
    category: "Kitchen Chemistry",
    title: "Why Pressure Cookers Cook 70% Faster",
    prompt: "How increasing boiling chamber pressure elevates water boiling temperature to 121°C",
    tag: "Thermodynamics",
  },
  {
    icon: "🍞",
    category: "Kitchen Chemistry",
    title: "Science of Sourdough Bread",
    prompt: "How wild lactobacillus and yeast colonies produce lactic acid and carbon dioxide bubbles",
    tag: "Fermentation",
  },
  {
    icon: "🧈",
    category: "Kitchen Chemistry",
    title: "The Maillard Reaction in Browning Butter",
    prompt: "Why browning milk solids at 140°C transforms butter into nutty liquid gold",
    tag: "Flavor Science",
  },

  // Hinglish Explainer 🇮🇳
  {
    icon: "🇮🇳",
    category: "Hinglish Explainer",
    title: "Binary Search in Hinglish",
    prompt: "Binary search tree kaise kaam karta hai step by step Hinglish me samjhao with examples",
    tag: "Hinglish Tech",
  },
  {
    icon: "🍲",
    category: "Hinglish Explainer",
    title: "Pressure Cooker Science in Hinglish",
    prompt: "Pressure cooker me daal aur rajma 70% jaldi kyu bante hain? Kitchen science in Hinglish",
    tag: "Hinglish Food",
  },
  {
    icon: "📱",
    category: "Hinglish Explainer",
    title: "How Wi-Fi Works in Hinglish",
    prompt: "Wi-Fi router se internet radio waves ke through hamare phone tak kaise pahunchta hai Hinglish me",
    tag: "Hinglish Telecom",
  },
  {
    icon: "🧠",
    category: "Hinglish Explainer",
    title: "Dopamine & Focus in Hinglish",
    prompt: "Dopamine kaise hamare focus aur phone scrolling addiction ko control karta hai in Hinglish",
    tag: "Hinglish Mind",
  },

  // Brain & Psychology
  {
    icon: "🧠",
    category: "Psychology & Brain",
    title: "Dopamine & Procrastination",
    prompt: "Why we procrastinate and how dopamine anticipation hijacks the prefrontal cortex",
    tag: "Neuroscience",
  },
  {
    icon: "☕",
    category: "Psychology & Brain",
    title: "How Caffeine Blocks Sleepiness",
    prompt: "How caffeine molecules bind to adenosine receptors in the brain to block tiredness signals",
    tag: "Neurochemistry",
  },
  {
    icon: "💤",
    category: "Psychology & Brain",
    title: "Why Humans Dream in REM Sleep",
    prompt: "How the brain consolidates memories, solves emotional conflicts, and simulates threats in dreams",
    tag: "Cognitive",
  },

  // Finance & Business
  {
    icon: "📈",
    category: "Finance & Startups",
    title: "Power of Compound Interest",
    prompt: "How compound interest exponentially multiplies wealth and the mathematical Rule of 72",
    tag: "Investing",
  },
  {
    icon: "💸",
    category: "Finance & Startups",
    title: "How Inflation Works",
    prompt: "Why central banks print currency, demand-pull vs cost-push inflation, and purchasing power loss",
    tag: "Economics",
  },
  {
    icon: "🦄",
    category: "Finance & Startups",
    title: "Why Tech Companies Get 10x Valuations",
    prompt: "The unit economics of SaaS software: zero marginal cost, net retention rate, and LTV/CAC ratio",
    tag: "Startups",
  },
];

export const CATEGORY_FILTERS = [
  { id: "all", label: "All Topics", icon: "✦" },
  { id: "Coding & DSA", label: "Code & DSA", icon: "💻" },
  { id: "Science & Physics", label: "Science & Physics", icon: "🔬" },
  { id: "Kitchen Chemistry", label: "Kitchen Chemistry", icon: "🍳" },
  { id: "Hinglish Explainer", label: "Hinglish Explainer 🇮🇳", icon: "🇮🇳" },
  { id: "Psychology & Brain", label: "Psychology & Brain", icon: "🧠" },
  { id: "Finance & Startups", label: "Finance & Startups", icon: "📈" },
];

export function GammaPromptHero({ onSuccess }: GammaPromptHeroProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<"hinglish" | "english">("hinglish");
  const [audience, setAudience] = useState<"general" | "beginners" | "engineers">("general");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<any>(null);
  const blurTimeoutRef = useRef<any>(null);

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

      {/* Main Input Card with Relative Dropdown Anchor */}
      <div style={{ position: "relative", marginBottom: "0.85rem" }}>
        <div
          className="gamma-hero-input-row"
          style={{
            background: "#FFFFFF",
            border: isListening ? "2px solid #EF4444" : isInputFocused ? "2px solid #4F46E5" : "1.5px solid #CBD5E1",
            borderRadius: "16px",
            padding: "0.6rem 0.6rem 0.6rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            boxShadow: isListening
              ? "0 0 25px rgba(239, 68, 68, 0.25)"
              : isInputFocused
              ? "0 6px 24px rgba(79, 70, 229, 0.18)"
              : "0 4px 20px rgba(15, 23, 42, 0.06)",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ fontSize: "1.25rem", color: "#4F46E5" }}>✦</span>

          <input
            type="text"
            className="gamma-hero-input-field"
            value={topic}
            onFocus={() => {
              if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
              setIsInputFocused(true);
            }}
            onBlur={() => {
              blurTimeoutRef.current = setTimeout(() => {
                setIsInputFocused(false);
              }, 250);
            }}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
            placeholder={
              isListening
                ? "Listening... Speak your topic now in English or Hinglish..."
                : "What concept or topic do you want to explain? (e.g. How CPU Cache works, Besan Ladoo Chemistry...)"
            }
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
                setIsInputFocused(false);
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
              onClick={() => {
                setTopic("");
                setIsInputFocused(false);
              }}
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
            onClick={() => {
              setIsInputFocused(false);
              handleGenerate();
            }}
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

        {/* Live Auto-Suggestions Dropdown at Input Time */}
        {isInputFocused && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              background: "#FFFFFF",
              border: "1.5px solid #C7D2FE",
              borderRadius: "16px",
              boxShadow: "0 18px 45px -8px rgba(79, 70, 229, 0.22)",
              zIndex: 100,
              padding: "1rem",
              maxHeight: "380px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid #EEF2FF",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.9rem" }}>💡</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4F46E5", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {topic.trim()
                    ? `Matching Topics for "${topic.slice(0, 24)}${topic.length > 24 ? "..." : ""}"`
                    : "✦ Popular Suggested Topics (Click to Select)"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    const rand = ALL_TOPIC_SUGGESTIONS[Math.floor(Math.random() * ALL_TOPIC_SUGGESTIONS.length)];
                    setTopic(rand.prompt);
                  }}
                  style={{
                    background: "#EEF2FF",
                    border: "1px solid #C7D2FE",
                    color: "#4338CA",
                    borderRadius: "12px",
                    padding: "0.2rem 0.55rem",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🎲 Surprise Me
                </button>
                <button
                  type="button"
                  onClick={() => setIsInputFocused(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#64748B",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {ALL_TOPIC_SUGGESTIONS.filter((s) => {
                if (!topic.trim()) return true;
                const q = topic.toLowerCase();
                return (
                  s.title.toLowerCase().includes(q) ||
                  s.prompt.toLowerCase().includes(q) ||
                  s.category.toLowerCase().includes(q) ||
                  s.tag.toLowerCase().includes(q)
                );
              })
                .slice(0, 6)
                .map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setTopic(s.prompt);
                      setIsInputFocused(false);
                    }}
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "10px",
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.75rem",
                      transition: "all 0.15s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#EEF2FF";
                      e.currentTarget.style.borderColor = "#C7D2FE";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#F8FAFC";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "1.2rem" }}>{s.icon}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <strong style={{ fontSize: "0.875rem", color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {s.title}
                          </strong>
                          <span style={{ fontSize: "0.6875rem", background: "#EEF2FF", color: "#4F46E5", padding: "0.1rem 0.45rem", borderRadius: "8px", fontWeight: 700 }}>
                            {s.category}
                          </span>
                        </div>
                        <p style={{ margin: "0.15rem 0 0", fontSize: "0.78125rem", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.prompt}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsInputFocused(false);
                        handleGenerate(s.prompt);
                      }}
                      style={{
                        background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.35rem 0.75rem",
                        color: "#FFFFFF",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
                      }}
                    >
                      ⚡ Use &amp; Generate
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Inspiration Chips directly below input */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap", marginBottom: "1.35rem" }}>
        <span style={{ fontSize: "0.72rem", color: "#4F46E5", fontWeight: 800, textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
          <span>✨ Ideas:</span>
        </span>
        <button
          type="button"
          onClick={() => {
            const rand = ALL_TOPIC_SUGGESTIONS[Math.floor(Math.random() * ALL_TOPIC_SUGGESTIONS.length)];
            setTopic(rand.prompt);
          }}
          style={{
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "20px",
            padding: "0.25rem 0.65rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
          }}
        >
          <span>🎲 Surprise Me</span>
        </button>
        {[
          { label: "Besan Ladoo Chemistry", prompt: "The molecular science of roasting Besan Ladoo: Maillard reaction and ghee crystallization", icon: "🍲" },
          { label: "Binary Search O(log N)", prompt: "How Binary Search cuts search time from O(N) to O(log n) using midpoint halving", icon: "💻" },
          { label: "Noise Cancellation", prompt: "How active noise-cancelling headphones invert sound waves through destructive phase interference", icon: "🎧" },
          { label: "Dopamine & Focus", prompt: "Why we procrastinate and how dopamine anticipation hijacks the prefrontal cortex", icon: "⚡" },
          { label: "Pressure Cooker 70% Faster", prompt: "How increasing boiling chamber pressure elevates water boiling temperature to 121°C", icon: "🍳" },
          { label: "How Caffeine Blocks Sleepiness", prompt: "How caffeine molecules bind to adenosine receptors in the brain to block tiredness signals", icon: "☕" },
          { label: "Hinglish: Wi-Fi Waves", prompt: "Wi-Fi router se internet radio waves ke through hamare phone tak kaise pahunchta hai Hinglish me", icon: "🇮🇳" },
          { label: "Compound Interest", prompt: "How compound interest exponentially multiplies wealth and the mathematical Rule of 72", icon: "📈" },
          { label: "Airplane Wingtips", prompt: "Why commercial jet airplane wings have curved tips: Bernoulli lift and vortex induced drag", icon: "✈️" },
          { label: "mRNA Vaccines", prompt: "How lipid nanoparticles deliver mRNA blueprints to train immune dendritic cells", icon: "🧬" },
        ].map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => {
              setTopic(chip.prompt);
              setIsInputFocused(false);
            }}
            style={{
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "20px",
              padding: "0.25rem 0.65rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#0F172A",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              transition: "all 0.15s ease",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#4F46E5";
              e.currentTarget.style.color = "#4F46E5";
              e.currentTarget.style.background = "#EEF2FF";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#CBD5E1";
              e.currentTarget.style.color = "#0F172A";
              e.currentTarget.style.background = "#FFFFFF";
            }}
          >
            <span>{chip.icon}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#4338CA", fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem" }}>
          <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>✦</span>
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
            Intuitive &amp; Clear
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

      {/* Curated Deck Gallery with Category Filter Tabs */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.85rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ✦ EXPLORE CURATED TOPIC DECKS ({ALL_TOPIC_SUGGESTIONS.filter((s) => selectedCategory === "all" || s.category === selectedCategory).length}):
          </span>

          {/* Category Tabs */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {CATEGORY_FILTERS.map((cat) => {
              const count = cat.id === "all" ? ALL_TOPIC_SUGGESTIONS.length : ALL_TOPIC_SUGGESTIONS.filter((s) => s.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`gamma-pill-btn ${selectedCategory === cat.id ? "gamma-pill-active" : ""}`}
                  style={{ fontSize: "0.72rem", padding: "0.25rem 0.65rem" }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
          {ALL_TOPIC_SUGGESTIONS.filter((s) => selectedCategory === "all" || s.category === selectedCategory).map((tmpl, idx) => (
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
