import React from "react";
import { Composition, registerRoot } from "remotion";
import { Explainer } from "./Explainer";
import type { Timeline } from "./contracts";

const fallbackTimeline: Timeline = {
  title: "VidyaMotion Explainer",
  fps: 30,
  frames: 300,
  aspectRatio: "9:16",
  scenes: [],
};

export function getDimensionsForAspectRatio(aspectRatio?: "9:16" | "16:9" | "1:1"): { width: number; height: number } {
  if (aspectRatio === "16:9") {
    return { width: 1920, height: 1080 };
  }
  if (aspectRatio === "1:1") {
    return { width: 1080, height: 1080 };
  }
  // Default to Vertical 9:16
  return { width: 1080, height: 1920 };
}

export const RemotionRoot: React.FC<{ timeline?: Timeline }> = ({ timeline = fallbackTimeline }) => {
  return (
    <>
      {/* Primary Dynamic Composition that auto-adapts to timeline.aspectRatio */}
      <Composition
        id="Explainer"
        component={Explainer}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={timeline.frames || 300}
        defaultProps={{
          timeline,
        }}
        calculateMetadata={({ props }) => {
          const dims = getDimensionsForAspectRatio(props.timeline?.aspectRatio);
          return {
            width: dims.width,
            height: dims.height,
            durationInFrames: props.timeline?.frames || 300,
          };
        }}
      />

      {/* 9:16 Vertical Reel Composition (Instagram Reels, YouTube Shorts, TikTok) */}
      <Composition
        id="Explainer-Vertical"
        component={Explainer}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={timeline.frames || 300}
        defaultProps={{
          timeline: { ...timeline, aspectRatio: "9:16" },
        }}
      />

      {/* 16:9 Widescreen Landscape Composition (YouTube Explainers, Presentations, TV) */}
      <Composition
        id="Explainer-Landscape"
        component={Explainer}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={timeline.frames || 300}
        defaultProps={{
          timeline: { ...timeline, aspectRatio: "16:9" },
        }}
      />

      {/* 1:1 Square Feed Composition (LinkedIn, Twitter / X, Instagram Square) */}
      <Composition
        id="Explainer-Square"
        component={Explainer}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={timeline.frames || 300}
        defaultProps={{
          timeline: { ...timeline, aspectRatio: "1:1" },
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
