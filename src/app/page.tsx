"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";

interface ShowcaseCard {
  id: string;
  sequence: number;
  badge: string;
  title: string;
  narration: string;
  visualLabel: string;
  accent: string;
}

const SHOWCASE_CARDS: ShowcaseCard[] = [
  {
    id: "card-1",
    sequence: 1,
    badge: "THE HOOK",
    title: "The Linear Search Problem",
    narration: "Searching 1,000,000 items sequentially one by one takes up to one million comparisons in the worst case.",
    visualLabel: "Sorted Array Visualization",
    accent: "#EF4444",
  },
  {
    id: "card-2",
    sequence: 2,
    badge: "CORE LOGIC",
    title: "Inspect the Midpoint",
    narration: "Binary search checks the middle element immediately and halves the search space in one single calculation.",
    visualLabel: "Midpoint Pivot at Index 500k",
    accent: "#4F46E5",
  },
  {
    id: "card-3",
    sequence: 3,
    badge: "DEEP DIVE",
    title: "Exponential Elimination",
    narration: "By discarding the wrong half each step, one million items are searched in only twenty comparisons: O(log n).",
    visualLabel: "Logarithmic Tree Graph",
    accent: "#7C3AED",
  },
  {
    id: "card-4",
    sequence: 4,
    badge: "KEY TAKEAWAY",
    title: "Scaling to Billions",
    narration: "That is why logarithmic algorithms scale effortlessly to billions of database queries without slowing down.",
    visualLabel: "Benchmark Efficiency Matrix",
    accent: "#10B981",
  },
];

const SAMPLE_TOPICS = [
  { icon: "💻", label: "Binary Search Algorithm", prompt: "How Binary Search cuts search time from O(N) to O(log n)" },
  { icon: "⚡", label: "CPU Memory Architecture", prompt: "Computer Memory: Registers vs L1/L2 Cache vs RAM vs SSD" },
  { icon: "🍲", label: "Science of Besan Ladoo", prompt: "Molecular food chemistry of Besan Ladoo: Maillard reaction and ghee" },
  { icon: "✈️", label: "Aerodynamic Winglets", prompt: "Why commercial jet airplane wings have curved tips: Bernoulli lift" },
];

const BENTO_FEATURES = [
  {
    span: "col-span-2",
    icon: "✦",
    title: "Prompt-to-Storyboard Intelligence",
    description: "Type any complex topic or dictate verbally with your microphone. The AI synthesizes structured visual cards, pacing formulas, and conversational scripts in seconds.",
    tag: "Gemini AI Director",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    iconBg: "#4F46E5",
  },
  {
    span: "col-span-1",
    icon: "📐",
    title: "Dynamic Vector Diagrams",
    description: "Automatic algorithmic trees, CPU cache ladders, chemical reactions, and aerodynamic streamlines rendered in clean animated SVG.",
    tag: "Remotion Motion Engine",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    iconBg: "#10B981",
  },
  {
    span: "col-span-1",
    icon: "🎙️",
    title: "Studio Neural Voiceovers",
    description: "Crystal-clear neural speech in both conversational Hinglish (Hindi + English) and natural English, free of robotic cadence.",
    tag: "Dual-Language Audio",
    bg: "#FFFBEB",
    border: "#FDE68A",
    iconBg: "#F59E0B",
  },
  {
    span: "col-span-2",
    icon: "⚡",
    title: "Kinetic Word-by-Word Captions",
    description: "Word-level timing alignment burns animated, high-retention captions directly into 1080x1920 vertical or 16:9 widescreen MP4 videos.",
    tag: "Burned-In Kinetic Captions",
    bg: "#FDF2F8",
    border: "#FBCFE8",
    iconBg: "#EC4899",
  },
  {
    span: "col-span-1",
    icon: "🤖",
    title: "Natural Language AI Co-Pilot",
    description: "Revise scripts instantly: 'Simplify scene 2 for a beginner', 'Add concrete numbers', or 'Translate to Hinglish' in one click.",
    tag: "Interactive Revisions",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    iconBg: "#0284C7",
  },
  {
    span: "col-span-2",
    icon: "▷",
    title: "Full-Screen Presenter Mode",
    description: "Present seamlessly with interactive scene chapter timeline, speaker notes drawer, and one-click 1080p MP4 download.",
    tag: "Presentation Deck Stage",
    bg: "#FAF5FF",
    border: "#E9D5FF",
    iconBg: "#7C3AED",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [topicInput, setTopicInput] = useState("");
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
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setTopicInput(transcript);
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

  function handleStart(prompt?: string) {
    const finalPrompt = (prompt || topicInput).trim();
    if (finalPrompt) {
      router.push(`/dashboard?topic=${encodeURIComponent(finalPrompt)}`);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        color: "#0F172A",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Background Luminous Radiant Aura */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1200px",
          height: "600px",
          background: "radial-gradient(ellipse 70% 50% at 50% -5%, rgba(99, 102, 241, 0.12) 0%, rgba(236, 72, 153, 0.06) 50%, rgba(248, 250, 252, 0) 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Navigation Header */}
      <header
        className="landing-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.25rem",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
        }}
      >
        <BrandLogo href="/" size="large" />

        {/* Center Nav */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.75rem",
          }}
          className="desktop-nav"
        >
          <a href="#showcase" style={{ color: "#334155", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            Capabilities
          </a>
          <a href="#bento" style={{ color: "#334155", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            Motion Engine
          </a>
          <a href="#how-it-works" style={{ color: "#334155", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            Workflow
          </a>
          <a href="#examples" style={{ color: "#334155", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            Featured Decks
          </a>
        </nav>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href="/sign-in"
            style={{
              color: "#334155",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
              padding: "0.4rem 0.75rem",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            style={{
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
              color: "#FFFFFF",
              fontSize: "0.875rem",
              fontWeight: 700,
              padding: "0.55rem 1.15rem",
              borderRadius: "10px",
              textDecoration: "none",
              boxShadow: "0 4px 18px rgba(79, 70, 229, 0.35)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span>Create Explainer</span>
            <span>✦</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", position: "relative", zIndex: 1 }}>
        {/* HERO SECTION */}
        <section style={{ textAlign: "center", padding: "4.5rem 0 3.5rem" }}>
          {/* Badge Pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <span
              style={{
                fontSize: "0.78125rem",
                fontWeight: 800,
                color: "#4338CA",
                background: "#EEF2FF",
                border: "1px solid #C7D2FE",
                borderRadius: "20px",
                padding: "0.35rem 0.95rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
              }}
            >
              <span style={{ color: "#4F46E5" }}>✦</span>
              <span>AI-POWERED EDUCATIONAL MOTION DECKS</span>
            </span>
          </div>

          {/* Majestic Hero Headline */}
          <h1
            style={{
              fontSize: "clamp(2.35rem, 5.5vw, 4.25rem)",
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.035em",
              lineHeight: 1.12,
              margin: "0 auto 1.5rem",
              maxWidth: "940px",
            }}
          >
            Turn any complex idea into an{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
              }}
            >
              animated visual explainer.
            </span>
          </h1>

          {/* High-Contrast Clear Description */}
          <p
            style={{
              fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)",
              color: "#334155",
              maxWidth: "780px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.65,
              fontWeight: 450,
            }}
          >
            Generate 60–90 second animated video presentations with synchronized neural voiceovers,
            kinetic subtitles, and dynamic vector graphics. No video editing or animation skills required.
          </p>

          {/* Interactive AI Prompt Box in Hero */}
          <div
            className="landing-hero-prompt-bar"
            style={{
              maxWidth: "760px",
              margin: "0 auto 2rem",
              background: "#FFFFFF",
              border: isListening ? "2px solid #EF4444" : "1.5px solid #CBD5E1",
              borderRadius: "18px",
              padding: "0.6rem 0.6rem 0.6rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              boxShadow: "0 10px 40px rgba(15, 23, 42, 0.08), 0 0 25px rgba(79, 70, 229, 0.08)",
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontSize: "1.25rem", color: "#4F46E5" }}>✦</span>

            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder={isListening ? "Listening... Speak your topic now in English or Hinglish..." : "What concept do you want to explain? (e.g. Binary Search, CPU Architecture, Cloud Storage...)"}
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
                if (e.key === "Enter") handleStart();
              }}
            />

            {/* Mic Dictation */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListening ? "Stop listening" : "Dictate topic with microphone (English & Hinglish)"}
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

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => handleStart()}
              style={{
                background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
                border: "none",
                borderRadius: "12px",
                padding: "0.85rem 1.65rem",
                color: "#FFFFFF",
                fontSize: "0.9375rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(79, 70, 229, 0.35)",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              <span>Generate Deck</span>
              <span>✦</span>
            </button>
          </div>

          {/* Quick Idea Chips */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.78125rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Try a topic:
            </span>
            {SAMPLE_TOPICS.map((topic, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleStart(topic.prompt)}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "20px",
                  padding: "0.4rem 0.95rem",
                  color: "#334155",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                  transition: "all 0.15s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#EEF2FF";
                  e.currentTarget.style.borderColor = "#818CF8";
                  e.currentTarget.style.color = "#4338CA";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.color = "#334155";
                }}
              >
                <span>{topic.icon}</span>
                <span>{topic.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* HERO INTERACTIVE SHOWCASE DECK */}
        <section id="showcase" style={{ marginBottom: "6rem" }}>
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #E2E8F0",
              borderRadius: "24px",
              boxShadow: "0 25px 70px rgba(15, 23, 42, 0.08), 0 0 40px rgba(99, 102, 241, 0.06)",
              overflow: "hidden",
            }}
          >
            {/* Mock Window Header */}
            <div
              style={{
                height: "52px",
                background: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
                padding: "0 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                <span style={{ fontSize: "0.85rem", color: "#0F172A", marginLeft: "0.75rem", fontWeight: 700 }}>
                  Binary Search Algorithm — 4-Card Presentation Deck
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#4338CA",
                    background: "#EEF2FF",
                    border: "1px solid #C7D2FE",
                    borderRadius: "10px",
                    padding: "0.2rem 0.55rem",
                  }}
                >
                  ✦ PRESENTATION CANVAS
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#065F46",
                    background: "#ECFDF5",
                    border: "1px solid #A7F3D0",
                    borderRadius: "10px",
                    padding: "0.2rem 0.55rem",
                  }}
                >
                  ● 1080p Video Synced
                </span>
              </div>
            </div>

            {/* Split Content: Cards on Left, Video Output on Right */}
            <div
              className="landing-showcase-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
                gap: "1.75rem",
                padding: "1.75rem",
              }}
            >
              {/* Left Column: Interactive Modular Cards Stream */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#4F46E5", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    ✦ STORYBOARD CARDS SEQUENCE (CLICK TO INSPECT):
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>4 Cards · 48s Total</span>
                </div>

                {SHOWCASE_CARDS.map((card, idx) => {
                  const isActive = idx === activeCardIndex;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setActiveCardIndex(idx)}
                      style={{
                        padding: "1rem 1.15rem",
                        borderRadius: "14px",
                        background: isActive ? "#EEF2FF" : "#F8FAFC",
                        border: isActive ? "2px solid #4F46E5" : "1px solid #E2E8F0",
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                        boxShadow: isActive ? "0 4px 20px rgba(79, 70, 229, 0.12)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            color: isActive ? "#3730A3" : "#64748B",
                            letterSpacing: "0.05em",
                          }}
                        >
                          CARD 0{card.sequence} · {card.badge}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "#4338CA",
                            background: "#E0E7FF",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "6px",
                            fontWeight: 700,
                          }}
                        >
                          {card.visualLabel}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0F172A", margin: "0 0 0.35rem" }}>
                        {card.title}
                      </h3>

                      <p style={{ fontSize: "0.85rem", color: "#334155", margin: 0, lineHeight: 1.5 }}>
                        "{card.narration}"
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Live Video Playback & Metadata */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#F8FAFC",
                  borderRadius: "18px",
                  padding: "1.5rem",
                  border: "1px solid #E2E8F0",
                }}
              >
                {/* 9:16 Video Stage */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "280px",
                    aspectRatio: "9/16",
                    borderRadius: "14px",
                    overflow: "hidden",
                    boxShadow: "0 16px 45px rgba(15, 23, 42, 0.18)",
                    border: "2px solid #CBD5E1",
                    background: "#000",
                    position: "relative",
                  }}
                >
                  <video
                    src="/videos/test_binary_search_remotion.mp4"
                    controls
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                {/* Video Info Badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#0F172A", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "0.3rem 0.65rem", borderRadius: "10px", fontWeight: 600 }}>
                    🎙️ Voice: Christopher Neural
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#0F172A", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "0.3rem 0.65rem", borderRadius: "10px", fontWeight: 600 }}>
                    ⏱️ Duration: 48s
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#065F46", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "0.3rem 0.65rem", borderRadius: "10px", fontWeight: 700 }}>
                    1080x1920 MP4
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENTO GRID: CAPABILITIES */}
        <section id="bento" style={{ marginBottom: "6rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ fontSize: "0.78125rem", color: "#4F46E5", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              ✦ A COMPLETE MOTION KNOWLEDGE ENGINE
            </span>
            <h2 style={{ fontSize: "clamp(1.85rem, 3.5vw, 2.75rem)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.025em", margin: "0.5rem 0 0.75rem" }}>
              Built for deep conceptual clarity.
            </h2>
            <p style={{ color: "#334155", fontSize: "1.05rem", maxWidth: "650px", margin: "0 auto", lineHeight: 1.6 }}>
              Everything needed to turn technical documentation, algorithmic logic, and science principles into engaging motion graphics.
            </p>
          </div>

          {/* Bento Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {BENTO_FEATURES.map((bento, idx) => (
              <div
                key={idx}
                style={{
                  background: bento.bg,
                  border: `1.5px solid ${bento.border}`,
                  borderRadius: "20px",
                  padding: "1.85rem",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(15, 23, 42, 0.1)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(15, 23, 42, 0.04)";
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: bento.iconBg,
                        display: "grid",
                        placeItems: "center",
                        fontSize: "1.15rem",
                        color: "#FFFFFF",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      {bento.icon}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: "#0F172A",
                        background: "rgba(255, 255, 255, 0.8)",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "10px",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      {bento.tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0F172A", margin: "0 0 0.6rem", letterSpacing: "-0.01em" }}>
                    {bento.title}
                  </h3>

                  <p style={{ fontSize: "0.9375rem", color: "#334155", lineHeight: 1.6, margin: 0 }}>
                    {bento.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3-STEP WORKFLOW */}
        <section id="how-it-works" style={{ marginBottom: "6rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ fontSize: "0.78125rem", color: "#4F46E5", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              ✦ SIMPLE 3-STEP CREATOR WORKFLOW
            </span>
            <h2 style={{ fontSize: "clamp(1.85rem, 3.5vw, 2.75rem)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.025em", margin: "0.5rem 0 0.75rem" }}>
              From idea to finished presentation in minutes.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                step: "01",
                title: "Start with an Idea or Question",
                description: "Type a prompt or dictate hands-free via your microphone in English or Hinglish. AI organizes the explanation into clear visual cards.",
              },
              {
                step: "02",
                title: "Refine with AI Co-Pilot",
                description: "Review scenes side-by-side. Request changes in plain English: simplify definitions, reword for kids, or redraw vector graphics on demand.",
              },
              {
                step: "03",
                title: "Present, Export & Share",
                description: "Launch full-screen Presentation Mode, export as a crisp 1080p MP4 with burned-in captions, or share the interactive web deck with a link.",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "20px",
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.05)",
                }}
              >
                <span
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 900,
                    color: "#4F46E5",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {step.step}
                </span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "#334155", lineHeight: 1.6, margin: 0 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED DECKS GALLERY */}
        <section id="examples" style={{ marginBottom: "6rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
            <div>
              <span style={{ fontSize: "0.78125rem", color: "#4F46E5", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                ✦ CURATED PRESENTATION SHOWCASE
              </span>
              <h2 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0F172A", margin: "0.35rem 0 0" }}>
                Explore live animated explainer decks
              </h2>
            </div>

            <Link
              href="/dashboard"
              style={{
                color: "#4F46E5",
                fontSize: "0.875rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              Open Creator Studio →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {[
              {
                title: "Computer Memory Hierarchy",
                topic: "Registers vs L1/L2 Cache vs RAM vs NVMe SSD",
                videoUrl: "/videos/6ae8a6752f03352ee47aeafd.mp4",
                duration: "58s",
                voice: "Madhur (Hinglish 🇮🇳)",
              },
              {
                title: "Science of Besan Ladoo",
                topic: "Maillard reaction and lipid matrix during roasting",
                videoUrl: "/videos/6ae626b3333adce4e02df89d.mp4",
                duration: "64s",
                voice: "Swara (Hinglish 🇮🇳)",
              },
              {
                title: "Binary Search in O(log n)",
                topic: "Logarithmic midpoint pivot in sorted arrays",
                videoUrl: "/videos/test_binary_search_remotion.mp4",
                duration: "48s",
                voice: "Christopher (English 🇺🇸)",
              },
              {
                title: "Why Wings Have Curved Tips",
                topic: "Bernoulli lift pressure and wingtip vortex drag",
                videoUrl: "/videos/test_airplane_flight_remotion.mp4",
                duration: "52s",
                voice: "Jenny (English 🇺🇸)",
              },
            ].map((deck, idx) => (
              <div
                key={idx}
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "18px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div style={{ position: "relative", aspectRatio: "16/9", background: "#000" }}>
                  <video
                    src={deck.videoUrl}
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
                  <span
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      background: "rgba(0,0,0,0.75)",
                      color: "#FFFFFF",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "6px",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    ⏱️ {deck.duration}
                  </span>
                </div>

                <div style={{ padding: "1.15rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                  <span style={{ fontSize: "0.72rem", color: "#4F46E5", fontWeight: 700 }}>
                    {deck.voice}
                  </span>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                    {deck.title}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    {deck.topic}
                  </p>

                  <div style={{ marginTop: "auto", paddingTop: "0.85rem" }}>
                    <Link
                      href="/dashboard"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0",
                        borderRadius: "10px",
                        background: "#F8FAFC",
                        color: "#0F172A",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        textAlign: "center",
                        display: "block",
                        border: "1px solid #CBD5E1",
                      }}
                    >
                      Open in Studio →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BIG BOTTOM CALL TO ACTION */}
        <section
          style={{
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
            borderRadius: "28px",
            padding: "4.5rem 2rem",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(79, 70, 229, 0.25)",
            marginBottom: "6rem",
            color: "#FFFFFF",
          }}
        >
          <span
            style={{
              fontSize: "0.78125rem",
              fontWeight: 800,
              color: "#FFFFFF",
              background: "rgba(255, 255, 255, 0.2)",
              padding: "0.35rem 0.95rem",
              borderRadius: "20px",
              display: "inline-block",
              marginBottom: "1.25rem",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            ✦ START CREATING TODAY
          </span>

          <h2
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
              margin: "0 auto 1.25rem",
              maxWidth: "750px",
              lineHeight: 1.15,
            }}
          >
            Ready to bring your ideas into motion?
          </h2>

          <p
            style={{
              fontSize: "1.15rem",
              color: "rgba(255, 255, 255, 0.9)",
              maxWidth: "600px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.6,
            }}
          >
            Join educators, engineers, and creators who generate clear animated explainer presentations with AI.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              href="/sign-up"
              style={{
                background: "#FFFFFF",
                color: "#4F46E5",
                fontSize: "1rem",
                fontWeight: 800,
                padding: "0.95rem 2.25rem",
                borderRadius: "12px",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>Create an Explainer Deck Free</span>
              <span>✦</span>
            </Link>

            <Link
              href="/dashboard"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#FFFFFF",
                fontSize: "1rem",
                fontWeight: 700,
                padding: "0.95rem 1.85rem",
                borderRadius: "12px",
                textDecoration: "none",
              }}
            >
              Open Studio ↗
            </Link>
          </div>
        </section>
      </main>

      {/* MODERN SLATE FOOTER */}
      <footer
        style={{
          borderTop: "1px solid #E2E8F0",
          background: "#FFFFFF",
          padding: "3.5rem 1.5rem 2.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <BrandLogo
            href="/"
            size="small"
            className="footer-brand-logo"
            tagline="Educational motion decks made clear."
          />

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", fontSize: "0.85rem", color: "#64748B" }}>
            <Link href="/dashboard" style={{ color: "#334155", textDecoration: "none", fontWeight: 600 }}>
              Studio
            </Link>
            <Link href="/sign-in" style={{ color: "#334155", textDecoration: "none", fontWeight: 600 }}>
              Sign In
            </Link>
            <Link href="/sign-up" style={{ color: "#334155", textDecoration: "none", fontWeight: 600 }}>
              Get Started
            </Link>
            <span>© {new Date().getFullYear()} VidyaMotion</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
