"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReelItem } from "@/lib/video/reel-contracts";

interface InstagramExploreFeedProps {
  initialReels: ReelItem[];
}

const CATEGORIES = [
  { id: "all", label: "🔥 All Trending" },
  { id: "hinglish", label: "🇮🇳 Hinglish Explainer" },
  { id: "tech", label: "💻 Code & Architecture" },
  { id: "science", label: "🔬 Science & Physics" },
  { id: "dsa", label: "🌳 DSA & LeetCode" },
  { id: "my", label: "👤 My Explainers" },
];

export function InstagramExploreFeed({ initialReels }: InstagramExploreFeedProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
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
          setSearch(transcript);
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

  const filteredReels = useMemo(() => {
    return initialReels.filter((reel) => {
      // Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "hinglish") {
          const isHinglish =
            reel.voiceName.toLowerCase().includes("hinglish") ||
            reel.tags.some((t) => t.toLowerCase().includes("hinglish"));
          if (!isHinglish) return false;
        } else if (selectedCategory === "my") {
          if (!reel.id.startsWith("user-")) return false;
        } else {
          const matchTag = reel.tags.some((t) =>
            t.toLowerCase().includes(selectedCategory)
          );
          if (!matchTag) return false;
        }
      }

      // Search query filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          reel.title.toLowerCase().includes(q) ||
          reel.topic.toLowerCase().includes(q) ||
          reel.caption.toLowerCase().includes(q) ||
          reel.tags.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [initialReels, selectedCategory, search]);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem 0.75rem 5rem" }}>
      {/* Top Search Bar */}
      <div style={{ position: "relative", marginBottom: "0.85rem" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isListening ? "Listening... Speak search term..." : "Search explainer reels, topics, code..."}
          style={{
            width: "100%",
            padding: "0.75rem 4rem 0.75rem 2.5rem",
            borderRadius: "12px",
            background: isListening ? "rgba(239, 68, 68, 0.15)" : "#262626",
            border: isListening ? "1px solid #EF4444" : "1px solid rgba(255, 255, 255, 0.1)",
            color: "#FFFFFF",
            fontSize: "0.9375rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {/* Search Icon */}
        <span
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#A8A8A8",
            fontSize: "0.95rem",
          }}
        >
          🔍
        </span>

        {/* Mic Dictation */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          title={isListening ? "Stop listening" : "Search with microphone"}
          style={{
            position: "absolute",
            right: search ? "32px" : "10px",
            top: "50%",
            transform: "translateY(-50%)",
            background: isListening ? "#EF4444" : "rgba(255, 255, 255, 0.12)",
            border: "none",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            fontSize: "0.9rem",
            color: "#FFFFFF",
          }}
        >
          {isListening ? "⏹" : "🎙️"}
        </button>

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
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

      {/* Category Pills */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.85rem",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                whiteSpace: "nowrap",
                padding: "0.45rem 0.85rem",
                borderRadius: "20px",
                background: isSelected ? "#FFFFFF" : "#262626",
                color: isSelected ? "#000000" : "#FFFFFF",
                border: "none",
                fontSize: "0.78125rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Instagram 3-Column Explore Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "3px",
        }}
      >
        {filteredReels.map((reel) => (
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
            {/* Video preview / poster */}
            <video
              src={reel.videoUrl}
              muted
              playsInline
              preload="metadata"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              onMouseOver={(e) => {
                e.currentTarget.play().catch(() => {});
              }}
              onMouseOut={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />

            {/* Reel Badge (Top Right) */}
            <span
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                fontSize: "0.85rem",
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))",
              }}
            >
              🎬
            </span>

            {/* Bottom Meta Overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "1.2rem 0.4rem 0.35rem",
                background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                display: "flex",
                flexDirection: "column",
                gap: "0.15rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {reel.title}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.625rem", color: "#D4D4D8" }}>
                <span>❤️ {reel.likes > 999 ? `${(reel.likes / 1000).toFixed(1)}k` : reel.likes}</span>
                <span>•</span>
                <span>{reel.duration}s</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReels.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#A1A1AA" }}>
          <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" }}>🔍</span>
          <p style={{ margin: 0, fontWeight: 600 }}>No explainer reels found for "{search}"</p>
          <p style={{ fontSize: "0.8125rem", color: "#71717A" }}>
            Try searching for "Binary Search", "RAM", or "Besan Ladoo".
          </p>
        </div>
      )}
    </div>
  );
}
