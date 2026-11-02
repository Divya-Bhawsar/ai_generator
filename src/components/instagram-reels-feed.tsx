"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ReelItem } from "@/lib/video/reel-contracts";

interface InstagramReelsFeedProps {
  initialReels: ReelItem[];
}

export function InstagramReelsFeed({ initialReels }: InstagramReelsFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const [reels, setReels] = useState<ReelItem[]>(initialReels);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeartBurst, setShowHeartBurst] = useState<number | null>(null);
  const [showPlaySplash, setShowPlaySplash] = useState(false);
  const [openScriptDrawer, setOpenScriptDrawer] = useState<ReelItem | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [copiedToast, setCopiedToast] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastTapRef = useRef<number>(0);

  // Jump to specific reel if requested via URL
  useEffect(() => {
    if (initialId) {
      const idx = reels.findIndex((r) => r.id === initialId || r.projectId === initialId);
      if (idx !== -1 && idx !== activeIndex) {
        setActiveIndex(idx);
        const targetEl = containerRef.current?.children[idx] as HTMLElement;
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [initialId, reels]);

  // Handle active video playback based on activeIndex
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === activeIndex) {
        video.muted = isMuted;
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Auto-play was prevented (often due to unmuted audio on mobile browsers)
              video.muted = true;
              setIsMuted(true);
              video.play().catch(() => {});
            });
        }
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
    setExpandedCaption(false);
  }, [activeIndex, isMuted]);

  // Scroll observer to update activeIndex on snap scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    if (height === 0) return;

    const newIndex = Math.round(scrollTop / height);
    if (newIndex >= 0 && newIndex < reels.length && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, reels.length]);

  // Handle tap / double-tap
  function handleVideoTap(e: React.MouseEvent, index: number) {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap -> Like animation
      triggerLike(index);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Single tap -> Play / Pause
      setTimeout(() => {
        if (lastTapRef.current !== 0) {
          togglePlayPause();
          lastTapRef.current = 0;
        }
      }, DOUBLE_TAP_DELAY);
    }
  }

  function togglePlayPause() {
    const currentVideo = videoRefs.current[activeIndex];
    if (!currentVideo) return;

    if (currentVideo.paused) {
      currentVideo.play();
      setIsPlaying(true);
    } else {
      currentVideo.pause();
      setIsPlaying(false);
    }
    setShowPlaySplash(true);
    setTimeout(() => setShowPlaySplash(false), 800);
  }

  function triggerLike(index: number) {
    setReels((prev) =>
      prev.map((reel, idx) => {
        if (idx === index) {
          const wasLiked = reel.isLiked;
          return {
            ...reel,
            isLiked: !wasLiked,
            likes: wasLiked ? reel.likes - 1 : reel.likes + 1,
          };
        }
        return reel;
      })
    );
    setShowHeartBurst(index);
    setTimeout(() => setShowHeartBurst(null), 1000);
  }

  function toggleSave(reelId: string) {
    setSavedMap((prev) => ({ ...prev, [reelId]: !prev[reelId] }));
  }

  function toggleFollow(username: string) {
    setFollowingMap((prev) => ({ ...prev, [username]: !prev[username] }));
  }

  async function handleShare(reel: ReelItem) {
    const url = typeof window !== "undefined" ? `${window.location.origin}/reels?id=${reel.id}` : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: reel.title,
          text: `Check out this AI explainer reel on ${reel.topic}!`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        if (activeIndex < reels.length - 1) {
          const targetEl = containerRef.current?.children[activeIndex + 1] as HTMLElement;
          targetEl?.scrollIntoView({ behavior: "smooth" });
        }
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        if (activeIndex > 0) {
          const targetEl = containerRef.current?.children[activeIndex - 1] as HTMLElement;
          targetEl?.scrollIntoView({ behavior: "smooth" });
        }
      } else if (e.key === " " || e.key === "k") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "m") {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, reels.length]);

  const activeReel = reels[activeIndex] || reels[0];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100dvh",
        background: "#000000",
        overflow: "hidden",
      }}
    >
      {/* Top Overlay Header */}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.25rem",
          zIndex: 40,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <Link
            href="/dashboard"
            style={{
              color: "#FFFFFF",
              fontSize: "1.25rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
            }}
          >
            ←
          </Link>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
            Reels
          </span>
        </div>

        {/* Tab Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem", fontWeight: 700 }}>
          <span style={{ color: "#FFFFFF", borderBottom: "2px solid #FFFFFF", paddingBottom: "2px" }}>
            Explainer Feed
          </span>
        </div>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          title={isMuted ? "Unmute audio" : "Mute audio"}
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            color: "#FFFFFF",
            fontSize: "1rem",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </header>

      {/* Main Reels Snap-Scroll Feed Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          width: "100%",
          height: "100%",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
          scrollbarWidth: "none",
        }}
      >
        {reels.map((reel, index) => {
          const isCurrent = index === activeIndex;
          const isLiked = reel.isLiked;
          const isSaved = !!savedMap[reel.id];
          const isFollowing = !!followingMap[reel.creator.username];

          return (
            <section
              key={reel.id}
              className="reel-slide"
              style={{
                width: "100%",
                height: "100dvh",
                scrollSnapAlign: "start",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#050505",
                overflow: "hidden",
              }}
            >
              {/* Blurred Ambient Video Background */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${reel.posterUrl || ""})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(40px) brightness(0.25)",
                  transform: "scale(1.2)",
                  pointerEvents: "none",
                }}
              />

              {/* Main 9:16 Video Frame */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "460px",
                  height: "100%",
                  maxHeight: "100dvh",
                  aspectRatio: "9/16",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                onClick={(e) => handleVideoTap(e, index)}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  src={reel.videoUrl}
                  poster={reel.posterUrl}
                  loop
                  playsInline
                  muted={isMuted}
                  preload={Math.abs(index - activeIndex) <= 1 ? "auto" : "none"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "0px",
                  }}
                />

                {/* Play / Pause Splash Ripple */}
                {isCurrent && showPlaySplash && (
                  <div
                    style={{
                      position: "absolute",
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(8px)",
                      display: "grid",
                      placeItems: "center",
                      color: "#FFFFFF",
                      fontSize: "2rem",
                      pointerEvents: "none",
                      animation: "pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    {isPlaying ? "▶" : "⏸"}
                  </div>
                )}

                {/* Double-Tap Heart Burst Animation */}
                {showHeartBurst === index && (
                  <div
                    style={{
                      position: "absolute",
                      pointerEvents: "none",
                      fontSize: "6rem",
                      color: "#EF4444",
                      filter: "drop-shadow(0 0 25px rgba(239, 68, 68, 0.8))",
                      animation: "insta-heart-burst 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    }}
                  >
                    ❤️
                  </div>
                )}

                {/* Bottom Scrubbing Progress Bar */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "rgba(255, 255, 255, 0.25)",
                    zIndex: 25,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, #F58529, #DD2A7B)",
                      width: isCurrent ? "100%" : "0%",
                      transition: isCurrent ? `width ${reel.duration}s linear` : "none",
                    }}
                  />
                </div>
              </div>

              {/* Instagram Right Action Bar */}
              <aside
                style={{
                  position: "absolute",
                  right: "12px",
                  bottom: "85px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1.25rem",
                  zIndex: 30,
                }}
              >
                {/* Creator Avatar with Follow Mini-Badge */}
                <div style={{ position: "relative", marginBottom: "0.25rem" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
                      padding: "2px",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "#18181B",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "1.25rem",
                        color: "#FFFFFF",
                      }}
                    >
                      {reel.creator.avatar}
                    </div>
                  </div>
                  {!isFollowing && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollow(reel.creator.username);
                      }}
                      style={{
                        position: "absolute",
                        bottom: "-6px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "#EF4444",
                        color: "#FFFFFF",
                        border: "2px solid #000000",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "12px",
                        fontWeight: 900,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      +
                    </button>
                  )}
                </div>

                {/* Heart / Like Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerLike(index);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "1.65rem",
                      color: isLiked ? "#EF4444" : "#FFFFFF",
                      filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                      transform: isLiked ? "scale(1.15)" : "scale(1)",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    {isLiked ? "❤️" : "🤍"}
                  </div>
                  <span style={{ color: "#FFFFFF", fontSize: "0.75rem", fontWeight: 700, marginTop: "-2px" }}>
                    {reel.likes > 999 ? `${(reel.likes / 1000).toFixed(1)}K` : reel.likes}
                  </span>
                </button>

                {/* Comment / Script Breakdown Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenScriptDrawer(reel);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="View Narration Script & Scene Breakdown"
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "1.6rem",
                      color: "#FFFFFF",
                      filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                    }}
                  >
                    💬
                  </div>
                  <span style={{ color: "#FFFFFF", fontSize: "0.75rem", fontWeight: 700, marginTop: "-2px" }}>
                    {reel.scenes?.length || 4}
                  </span>
                </button>

                {/* Bookmark / Save Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(reel.id);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="Save to Collection"
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "1.55rem",
                      color: isSaved ? "#F59E0B" : "#FFFFFF",
                      filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                    }}
                  >
                    {isSaved ? "🔖" : "📑"}
                  </div>
                  <span style={{ color: "#FFFFFF", fontSize: "0.72rem", fontWeight: 700 }}>
                    {isSaved ? "Saved" : "Save"}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(reel);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="Share Reel"
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "1.55rem",
                      color: "#FFFFFF",
                      filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                    }}
                  >
                    ✈️
                  </div>
                  <span style={{ color: "#FFFFFF", fontSize: "0.72rem", fontWeight: 700 }}>
                    Share
                  </span>
                </button>

                {/* Edit in Studio Button (If has projectId) */}
                {reel.projectId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/project/${reel.projectId}`);
                    }}
                    style={{
                      background: "rgba(255, 255, 255, 0.15)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      color: "#FFFFFF",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}
                    title="Open Storyboard Studio to Revise or Customize"
                  >
                    ✏️
                  </button>
                )}

                {/* Spinning Vinyl Record Disc */}
                <div
                  className="spinning-vinyl"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #27272A 30%, #09090B 70%)",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 0 10px rgba(221, 42, 123, 0.6)",
                    animation: isPlaying && isCurrent ? "spin-vinyl 3s linear infinite" : "none",
                  }}
                >
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#F58529" }} />
                </div>
              </aside>

              {/* Instagram Bottom Video Metadata Overlay */}
              <div
                style={{
                  position: "absolute",
                  left: "12px",
                  right: "75px",
                  bottom: "75px",
                  zIndex: 30,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.45rem",
                  color: "#FFFFFF",
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                  pointerEvents: "auto",
                }}
              >
                {/* Creator Handle + Follow Button */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
                    @{reel.creator.username}
                  </span>
                  {reel.creator.verified && (
                    <span
                      style={{
                        display: "inline-grid",
                        placeItems: "center",
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "#3897F0",
                        color: "#FFFFFF",
                        fontSize: "9px",
                        fontWeight: 900,
                      }}
                    >
                      ✓
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(reel.creator.username);
                    }}
                    style={{
                      background: isFollowing ? "rgba(255,255,255,0.15)" : "transparent",
                      border: "1px solid #FFFFFF",
                      borderRadius: "6px",
                      padding: "0.15rem 0.55rem",
                      color: "#FFFFFF",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      marginLeft: "0.25rem",
                    }}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>

                {/* Reel Title */}
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    margin: 0,
                    lineHeight: 1.25,
                    color: "#FFFFFF",
                  }}
                >
                  {reel.title}
                </h3>

                {/* Reel Caption with Expandable Toggle */}
                <p
                  style={{
                    fontSize: "0.8125rem",
                    margin: 0,
                    color: "#E2E8F0",
                    lineHeight: 1.45,
                    display: expandedCaption ? "block" : "-webkit-box",
                    WebkitLineClamp: expandedCaption ? "unset" : 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {reel.caption}
                </p>
                {reel.caption.length > 90 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCaption((prev) => !prev);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94A3B8",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                      alignSelf: "flex-start",
                    }}
                  >
                    {expandedCaption ? "show less" : "...more"}
                  </button>
                )}

                {/* Audio Marquee Ticker */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    fontSize: "0.75rem",
                    color: "#CBD5E1",
                    marginTop: "0.2rem",
                  }}
                >
                  <span style={{ fontSize: "0.85rem" }}>🎵</span>
                  <div style={{ overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>
                    <div className="audio-marquee">
                      {reel.voiceName} • Original AI Explainer Audio ({reel.duration}s)
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Script Breakdown Bottom Sheet Modal */}
      {openScriptDrawer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setOpenScriptDrawer(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "540px",
              background: "#18181B",
              color: "#FFFFFF",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              padding: "1.25rem 1.25rem 2.5rem",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.6)",
              animation: "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
              <div style={{ width: "42px", height: "4px", borderRadius: "2px", background: "rgba(255, 255, 255, 0.3)" }} />
            </div>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.7rem", color: "#F58529", fontWeight: 800, textTransform: "uppercase" }}>
                  🎬 Scene-by-Scene Script Breakdown
                </span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0.2rem 0 0" }}>
                  {openScriptDrawer.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenScriptDrawer(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  color: "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Voice Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 0.85rem",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.05)",
                fontSize: "0.8125rem",
                marginBottom: "1rem",
              }}
            >
              <span>🎙️ Voice:</span>
              <strong style={{ color: "#45D6B5" }}>{openScriptDrawer.voiceName}</strong>
              <span style={{ color: "#71717A", marginLeft: "auto" }}>{openScriptDrawer.duration}s</span>
            </div>

            {/* Scene List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {openScriptDrawer.scenes && openScriptDrawer.scenes.length > 0 ? (
                openScriptDrawer.scenes.map((scene, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "0.85rem",
                      borderRadius: "12px",
                      background: "#27272A",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "#F58529", fontWeight: 700 }}>
                        SCENE {scene.sequence || i + 1}
                      </span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          background: "rgba(49, 92, 235, 0.2)",
                          color: "#93C5FD",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "10px",
                          fontWeight: 600,
                        }}
                      >
                        {scene.visualLabel}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "0.875rem", fontWeight: 700, margin: "0 0 0.35rem", color: "#FFFFFF" }}>
                      {scene.title}
                    </h4>
                    <p style={{ fontSize: "0.8125rem", color: "#D4D4D8", margin: 0, lineHeight: 1.5 }}>
                      "{scene.narration}"
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ color: "#A1A1AA", fontSize: "0.85rem" }}>
                  Script details for this explainer video.
                </p>
              )}
            </div>

            {/* Studio Action */}
            {openScriptDrawer.projectId && (
              <button
                type="button"
                onClick={() => {
                  setOpenScriptDrawer(null);
                  router.push(`/dashboard/project/${openScriptDrawer.projectId}`);
                }}
                style={{
                  width: "100%",
                  marginTop: "1.25rem",
                  padding: "0.85rem",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                ✏️ Customize or Redraw in Storyboard Studio →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Copied Link Toast */}
      {copiedToast && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(24, 24, 27, 0.95)",
            color: "#FFFFFF",
            padding: "0.6rem 1.25rem",
            borderRadius: "20px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            zIndex: 110,
            boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          ✓ Reel link copied to clipboard!
        </div>
      )}
    </div>
  );
}
