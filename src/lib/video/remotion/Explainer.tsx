import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { Timeline, TimedScene } from "./contracts";
import { SearchDiagram } from "./SearchDiagram";
import { ConceptDiagram } from "./ConceptDiagram";
import { ScienceDiagram } from "./ScienceDiagram";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";

const ink = "#153c3a";
const teal = "#168779";

const fade = (f: number, start = 0, duration = 16) =>
  interpolate(f, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

function Diagram({ scene }: { scene: TimedScene }) {
  if (scene.type === "binary-search" || scene.search) {
    return (
      <svg viewBox="0 0 860 700" style={{ width: "100%", height: 700, overflow: "visible" }}>
        <SearchDiagram scene={scene} />
      </svg>
    );
  }

  if (scene.type === "comparison" || scene.type === "flow" || scene.comparison) {
    return (
      <svg viewBox="0 0 860 700" style={{ width: "100%", height: 700, overflow: "visible" }}>
        <ConceptDiagram scene={scene} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 860 700" style={{ width: "100%", height: 700, overflow: "visible" }}>
      <ScienceDiagram scene={scene} />
    </svg>
  );
}

function SceneView({
  scene,
  index,
  total,
}: {
  scene: TimedScene;
  index: number;
  total: number;
}) {
  const f = useCurrentFrame();

  // Find active caption chunk for current frame
  const caption = scene.captions?.find((c) => f >= c.start && f < c.end);

  const titleFade = fade(f, 0, 14);
  const titleOffset = (1 - titleFade) * 18;

  return (
    <AbsoluteFill
      style={{
        background: "#f5f3ec",
        color: ink,
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "120px 80px 90px",
        boxSizing: "border-box",
      }}
    >
      {/* Audio element if provided */}
      {scene.audioFile && <Audio src={staticFile(scene.audioFile)} />}

      {/* Top Header: Kicker and scene pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 22,
          letterSpacing: 3,
          fontWeight: 700,
          color: teal,
          textTransform: "uppercase",
        }}
      >
        <span>{scene.kicker || "VIDYAMOTION"}</span>
        <span>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* Scene Title */}
      <div
        style={{
          marginTop: 45,
          height: 190,
          opacity: titleFade,
          transform: `translateY(${titleOffset}px)`,
        }}
      >
        <h1
          style={{
            fontSize: 76,
            lineHeight: 1.08,
            letterSpacing: -2.5,
            margin: 0,
            fontWeight: 700,
            color: ink,
          }}
        >
          {scene.title}
        </h1>
      </div>

      {/* Visual Motion Graphics Centerpiece */}
      <div style={{ marginTop: 10, opacity: fade(f, 6, 14) }}>
        <Diagram scene={scene} />
      </div>

      {/* Dynamic Tag Pills */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 14,
          marginTop: 25,
          flexWrap: "wrap",
        }}
      >
        {scene.labels.map((label, i) => (
          <div
            key={i}
            style={{
              border: "1.5px solid #ced9d1",
              borderRadius: 100,
              padding: "11px 22px",
              fontSize: 22,
              fontWeight: 600,
              background: "#ffffff80",
              opacity: fade(f, Math.min(scene.frames - 10, scene.cueFrame + i * 5)),
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Kinetic Floating Caption Box */}
      <div
        style={{
          position: "absolute",
          bottom: 210,
          left: 80,
          right: 80,
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {caption && (
          <div
            style={{
              background: ink,
              color: "#ffffff",
              borderRadius: 20,
              padding: "20px 32px",
              fontSize: 38,
              fontWeight: 600,
              lineHeight: 1.3,
              textAlign: "center",
              maxWidth: 820,
              boxShadow: "0 10px 30px rgba(21, 60, 58, 0.25)",
            }}
          >
            {caption.text}
          </div>
        )}
      </div>

      {/* Bottom Progress Bar & Branding */}
      <div
        style={{
          position: "absolute",
          bottom: 95,
          left: 80,
          right: 80,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 18,
          fontWeight: 600,
          color: "#6c827b",
          letterSpacing: 1,
        }}
      >
        <span>MOTION EXPLAINER</span>
        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                width: i === index ? 42 : 12,
                height: 8,
                borderRadius: 4,
                background: i <= index ? teal : "#d4ded5",
                transition: "width 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function Explainer({ timeline }: { timeline: Timeline }) {
  return (
    <AbsoluteFill style={{ background: "#f5f3ec" }}>
      {timeline.scenes.map((s, i) => (
        <Sequence key={s.id} from={s.start} durationInFrames={s.frames}>
          <SceneView scene={s} index={i} total={timeline.scenes.length} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
