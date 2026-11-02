"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InstagramCreateModal } from "./instagram-create-modal";

interface StoryItem {
  id: string;
  name: string;
  topic: string;
  icon: string;
  isAdd?: boolean;
}

const STORIES: StoryItem[] = [
  { id: "add", name: "Your Story", topic: "Create", icon: "➕", isAdd: true },
  { id: "reel-memory-arch", name: "Memory Arch", topic: "RAM vs SSD", icon: "⚡" },
  { id: "reel-besan-ladoo", name: "Besan Ladoo", topic: "Food Chemistry", icon: "🍲" },
  { id: "reel-binary-search", name: "Binary Search", topic: "O(log n) DSA", icon: "🌳" },
  { id: "reel-airplane-wings", name: "Aerodynamics", topic: "Winglets Lift", icon: "✈️" },
  { id: "reel-leetcode-puzzle", name: "LeetCode Prep", topic: "14 Patterns", icon: "🚀" },
  { id: "story-cloud", name: "Cloud Infra", topic: "AWS vs Edge", icon: "☁️" },
];

export function InstagramStoriesTray() {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      <section
        aria-label="Instagram Stories"
        style={{
          display: "flex",
          gap: "1.1rem",
          overflowX: "auto",
          padding: "0.85rem 0.5rem 1rem",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          background: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        {STORIES.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => {
              if (story.isAdd) {
                setCreateModalOpen(true);
              } else {
                router.push(`/reels?id=${story.id}`);
              }
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.35rem",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
              width: "68px",
            }}
          >
            {/* Ring */}
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                padding: "2.5px",
                background: story.isAdd
                  ? "#E2E8F0"
                  : "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
                display: "grid",
                placeItems: "center",
                transition: "transform 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.06)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.5rem",
                  border: "2px solid #FFFFFF",
                  position: "relative",
                }}
              >
                {story.icon}

                {story.isAdd && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      right: "-2px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#315CEB",
                      color: "#FFFFFF",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "12px",
                      fontWeight: 800,
                      border: "2px solid #FFFFFF",
                    }}
                  >
                    +
                  </span>
                )}
              </div>
            </div>

            {/* Label */}
            <span
              style={{
                fontSize: "0.6875rem",
                color: "#262626",
                fontWeight: 600,
                textAlign: "center",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {story.name}
            </span>
          </button>
        ))}
      </section>

      <InstagramCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}
