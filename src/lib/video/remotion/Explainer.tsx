import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { Timeline, TimedScene } from "./contracts";
import { cleanSvg } from "../cleanSvg";
import { UniversalTopicDiagram } from "./UniversalTopicDiagram";
import { SearchDiagram } from "./SearchDiagram";
import { ConceptDiagram } from "./ConceptDiagram";
import { ScienceDiagram } from "./ScienceDiagram";
import { GaugeDiagram } from "./GaugeDiagram";
import { AeroDiagram } from "./AeroDiagram";
import { ChartDiagram } from "./ChartDiagram";
import { CycleDiagram } from "./CycleDiagram";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-sans/800.css";

const fade = (f: number, start = 0, duration = 16) =>
  interpolate(f, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

function renderKineticCaption(text: string, accentWords?: string[]) {
  const words = text.split(/\s+/);
  const normalizedAccents = (accentWords || []).map((w) =>
    w.toLowerCase().replace(/[^a-z0-9]/gi, "")
  );

  return words.map((word, idx) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/gi, "");
    const isExplicitAccent = normalizedAccents.includes(cleanWord);
    const isAutoAccent = !accentWords?.length && (/\d/.test(word) || (idx === 0 && words.length > 3));
    const isHighlighted = isExplicitAccent || isAutoAccent;

    if (isHighlighted) {
      return (
        <span
          key={idx}
          style={{
            color: "#FBBF24",
            textShadow: "0 0 20px rgba(251, 191, 36, 0.6)",
            fontWeight: 900,
            display: "inline-block",
            margin: "0 5px",
          }}
        >
          {word}{" "}
        </span>
      );
    }

    return (
      <span key={idx} style={{ color: "#FFFFFF", display: "inline-block", margin: "0 5px" }}>
        {word}{" "}
      </span>
    );
  });
}

function Diagram({ scene }: { scene: TimedScene }) {
  const f = useCurrentFrame();
  const cuePassed = f >= scene.cueFrame;
  const svgArt = scene.svgCode || scene.diagram?.svg_code;

  // 1. Topic-Specific Custom SVG Artwork Illustration
  if (svgArt) {
    const d = scene.diagram;
    const headline = d?.headline || scene.title;
    const badge = d?.badge || "CONCEPT ILLUSTRATION";
    const subtext =
      d?.metric?.subtext ||
      (d?.flow_steps?.[0]?.title ? `Phase: ${d.flow_steps[0].title}` : undefined) ||
      (scene.labels?.[0] ? `Key Concept: ${scene.labels[0]}` : "Interactive conceptual diagram");

    return (
      <div
        style={{
          width: "100%",
          height: 740,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        {/* Top Micro-HUD Bar */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            marginBottom: 10,
          }}
        >
          {/* Terminal indicator dots */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} />
          </div>

          {/* Central Category Badge Pill */}
          <div
            style={{
              padding: "6px 20px",
              borderRadius: 100,
              background: "rgba(99, 102, 241, 0.18)",
              border: "1px solid rgba(129, 140, 248, 0.4)",
              color: "#38BDF8",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            ✦ {badge}
          </div>

          {/* 4K HDR Indicator */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: "#64748B",
            }}
          >
            4K HDR · 60 FPS
          </div>
        </div>

        {/* Central Illustrated SVG Artwork Screen */}
        <div
          style={{
            width: 900,
            height: 540,
            borderRadius: 24,
            background: "linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(10, 15, 29, 0.8) 100%)",
            border: "1.5px solid rgba(255, 255, 255, 0.09)",
            boxShadow: "inset 0 0 50px rgba(0, 0, 0, 0.7), 0 10px 30px rgba(0, 0, 0, 0.5)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
            opacity: interpolate(f, [4, 18], [0, 1], { extrapolateRight: "clamp" }),
            transform: `scale(${interpolate(f, [4, 24], [0.95, 1], { extrapolateRight: "clamp" })})`,
          }}
          dangerouslySetInnerHTML={{ __html: cleanSvg(svgArt) }}
        />

        {/* Bottom Headline & Metric Ribbon */}
        <div
          style={{
            width: 900,
            padding: "16px 30px",
            borderRadius: 20,
            background: cuePassed ? "rgba(99, 102, 241, 0.22)" : "rgba(30, 41, 59, 0.7)",
            border: `1.5px solid ${cuePassed ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.1)"}`,
            boxShadow: cuePassed ? "0 0 30px rgba(99, 102, 241, 0.25)" : "0 10px 25px rgba(0, 0, 0, 0.4)",
            textAlign: "center",
            boxSizing: "border-box",
            transition: "all 0.3s ease",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            {headline}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#38BDF8", marginTop: 4 }}>
            {subtext}
          </div>
        </div>
      </div>
    );
  }

  // 2. AI-Generated Dynamic Topic Blueprint (Universal AI-driven graphics)
  if (scene.diagram) {
    return (
      <svg viewBox="0 0 860 700" style={{ width: "100%", height: 720, overflow: "visible" }}>
        <UniversalTopicDiagram scene={scene} />
      </svg>
    );
  }

  const textContext = `${scene.type} ${scene.title} ${scene.narration} ${scene.labels.join(" ")}`.toLowerCase();

  // 1. Algorithms & Data Structures (Binary Search, Arrays)
  if (scene.type === "binary-search" || Boolean(scene.search) || /\bbinary\s+search\b|\bsorted\s+array\b/i.test(textContext)) {
    return (
      <svg viewBox="0 0 860 700" style={{ width: "100%", height: 720, overflow: "visible" }}>
        <SearchDiagram scene={scene} />
      </svg>
    );
  }

  // 2. Flight & Aerodynamics (Wings, Lift, Airplanes, Upside-down Flight)
  if (/wing|airplane|plane|fly|flight|aerodynamic|airfoil|lift|drag|thrust|yoke/i.test(textContext)) {
    return (
      <svg viewBox="0 0 860 700" style={{ width: "100%", height: 720, overflow: "visible" }}>
        <AeroDiagram scene={scene} />
      </svg>
    );
  }

  // 3. Thermal & Pressure Metrics (Pressure Cooker, Boiling, Heat, Gauges)
  if (/gauge|cook|pressure|boil|heat|temp|100°|121°|atm|steam|vessel/i.test(textContext)) {
    return (
      <svg viewBox="0 0 860 700" style={{ width: "100%", height: 720, overflow: "visible" }}>
        <GaugeDiagram scene={scene} />
      </svg>
    );
  }

  // 4. Growth, Scaling Curves, Complexity & Charts
  if (scene.type === "bars" || /chart|curve|growth|exponential|scaling|o\(n\)|o\(log|graph|metric|billion/i.test(textContext)) {
    return (
      <svg viewBox="0 0 860 700" style={{ width: "100%", height: 720, overflow: "visible" }}>
        <ChartDiagram scene={scene} />
      </svg>
    );
  }

  // 5. Orbital & Biological Cycles (Water Cycle, Photosynthesis, Closed Loops)
  if (/cycle|loop|orbit|water cycle|photosynthesis|recirculat|ecosystem/i.test(textContext)) {
    return (
      <svg viewBox="0 0 860 700" style={{ width: "100%", height: 720, overflow: "visible" }}>
        <CycleDiagram scene={scene} />
      </svg>
    );
  }

  // 6. Paired Comparison Cards
  if (scene.type === "comparison" || scene.comparison) {
    return (
      <svg viewBox="0 0 860 700" style={{ width: "100%", height: 720, overflow: "visible" }}>
        <ConceptDiagram scene={scene} />
      </svg>
    );
  }

  // 7. Sequential Step-by-Step Flow
  if (scene.type === "flow" || scene.type === "process_steps") {
    return (
      <svg viewBox="0 0 860 700" style={{ width: "100%", height: 720, overflow: "visible" }}>
        <ConceptDiagram scene={scene} />
      </svg>
    );
  }

  // 8. General Physical Principle / Vector Hub Engine
  return (
    <svg viewBox="0 0 860 700" style={{ width: "100%", height: 720, overflow: "visible" }}>
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

  // Animated ambient lighting coordinates
  const orb1X = 140 + Math.sin(f / 45) * 60;
  const orb1Y = 280 + Math.cos(f / 50) * 50;
  const orb2X = 920 + Math.cos(f / 40) * 50;
  const orb2Y = 1420 + Math.sin(f / 48) * 60;

  // Video progress fraction
  const sceneProgress = interpolate(f, [0, scene.frames || 1], [0, 100], {
    extrapolateRight: "clamp",
  });
  const overallProgress = Math.min(100, Math.max(0, ((index + sceneProgress / 100) / Math.max(1, total)) * 100));

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #070913 0%, #0B1020 40%, #0D162B 75%, #070A14 100%)",
        color: "#FFFFFF",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "70px 60px 50px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Audio element if provided */}
      {scene.audioFile && <Audio src={staticFile(scene.audioFile)} />}

      {/* Atmospheric Ambient Lighting Aura 1 (Top-Left Electric Indigo) */}
      <div
        style={{
          position: "absolute",
          left: orb1X - 350,
          top: orb1Y - 350,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.24) 0%, rgba(124, 58, 237, 0.08) 50%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />

      {/* Atmospheric Ambient Lighting Aura 2 (Bottom-Right Cyber Cyan) */}
      <div
        style={{
          position: "absolute",
          left: orb2X - 350,
          top: orb2Y - 350,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, rgba(16, 185, 129, 0.06) 50%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />

      {/* Technological Subtle Background Grid Texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Precision Corner Tech Crosshairs */}
      <div style={{ position: "absolute", top: 40, left: 40, color: "rgba(255, 255, 255, 0.15)", fontSize: 16, fontWeight: 300, pointerEvents: "none" }}>+</div>
      <div style={{ position: "absolute", top: 40, right: 40, color: "rgba(255, 255, 255, 0.15)", fontSize: 16, fontWeight: 300, pointerEvents: "none" }}>+</div>
      <div style={{ position: "absolute", bottom: 40, left: 40, color: "rgba(255, 255, 255, 0.15)", fontSize: 16, fontWeight: 300, pointerEvents: "none" }}>+</div>
      <div style={{ position: "absolute", bottom: 40, right: 40, color: "rgba(255, 255, 255, 0.15)", fontSize: 16, fontWeight: 300, pointerEvents: "none" }}>+</div>

      {/* Top Header: Scene counter badge & Kicker */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          zIndex: 10,
        }}
      >
        {/* Left Glowing Scene Counter Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 22px",
            borderRadius: 100,
            background: "rgba(99, 102, 241, 0.14)",
            border: "1px solid rgba(129, 140, 248, 0.35)",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)",
          }}
        >
          {/* Pulsing indicator dot */}
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#818CF8",
              boxShadow: `0 0 ${8 + Math.sin(f / 6) * 4}px #818CF8`,
            }}
          />
          <span style={{ fontSize: 17, fontWeight: 700, color: "#C7D2FE", letterSpacing: 2 }}>
            SCENE {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>

        {/* Right Kicker Hologram Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 100,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#94A3B8",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <span>✦ {scene.kicker || "EXPLAINER"}</span>
        </div>
      </div>

      {/* Scene Title Area */}
      <div
        style={{
          marginTop: 26,
          height: 140,
          display: "flex",
          alignItems: "center",
          opacity: titleFade,
          transform: `translateY(${titleOffset}px)`,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: 60,
            lineHeight: 1.12,
            letterSpacing: "-1.5px",
            margin: 0,
            fontWeight: 800,
            color: "#FFFFFF",
            textShadow: "0 4px 24px rgba(0, 0, 0, 0.8)",
          }}
        >
          {scene.title}
        </h1>
      </div>

      {/* Expansive Cinema-Grade Visual Stage (Replaces cheap phone card) */}
      <div
        style={{
          marginTop: 18,
          width: 960,
          height: 800,
          borderRadius: 36,
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.82) 0%, rgba(10, 15, 30, 0.94) 100%)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1.5px solid rgba(255, 255, 255, 0.12)",
          boxShadow:
            "0 30px 80px -15px rgba(0, 0, 0, 0.85), 0 0 50px -10px rgba(99, 102, 241, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
          padding: "24px 28px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: fade(f, 6, 14),
          zIndex: 10,
        }}
      >
        <Diagram scene={scene} />
      </div>

      {/* Dynamic Keyword Tag Pills */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginTop: 24,
          flexWrap: "wrap",
          zIndex: 10,
        }}
      >
        {scene.labels.map((label, i) => (
          <div
            key={i}
            style={{
              border: "1px solid rgba(129, 140, 248, 0.28)",
              borderRadius: 100,
              padding: "10px 22px",
              fontSize: 20,
              fontWeight: 600,
              background: "rgba(30, 41, 59, 0.65)",
              color: "#E2E8F0",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
              opacity: fade(f, Math.min(scene.frames - 10, scene.cueFrame + i * 5)),
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Kinetic Floating Caption HUD (Alex Hormozi / Vox / Kurzgesagt Style) */}
      <div
        style={{
          position: "absolute",
          bottom: 155,
          left: 60,
          right: 60,
          minHeight: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        {caption && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(20, 27, 45, 0.96) 100%)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1.5px solid rgba(129, 140, 248, 0.38)",
              borderRadius: 30,
              padding: "24px 38px",
              maxWidth: 960,
              boxShadow:
                "0 25px 65px rgba(0, 0, 0, 0.8), 0 0 35px rgba(99, 102, 241, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 22,
            }}
          >
            {/* Animated Speech Soundwave Bars */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              {[0, 1, 2, 3].map((barIdx) => {
                const barHeight = 14 + Math.abs(Math.sin((f + barIdx * 8) / 3)) * 26;
                return (
                  <div
                    key={barIdx}
                    style={{
                      width: 5,
                      height: barHeight,
                      borderRadius: 3,
                      background: "linear-gradient(180deg, #38BDF8 0%, #6366F1 100%)",
                      boxShadow: "0 0 8px rgba(56, 189, 248, 0.6)",
                    }}
                  />
                );
              })}
            </div>

            {/* Kinetic Caption Typography with Accent Highlighting */}
            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                lineHeight: 1.25,
                textAlign: "center",
                flex: 1,
                letterSpacing: "-0.5px",
              }}
            >
              {renderKineticCaption(caption.text, scene.accentWords)}
            </div>
          </div>
        )}
      </div>

      {/* Cinematic Continuous Timeline Footer & Branding */}
      <div
        style={{
          position: "absolute",
          bottom: 55,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          zIndex: 10,
        }}
      >
        {/* Continuous Animated Multi-Color Gradient Progress Bar */}
        <div
          style={{
            width: "100%",
            height: 8,
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.1)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${overallProgress}%`,
              height: "100%",
              borderRadius: 4,
              background: "linear-gradient(90deg, #4F46E5 0%, #7C3AED 40%, #EC4899 80%, #38BDF8 100%)",
              boxShadow: "0 0 14px rgba(99, 102, 241, 0.8)",
              transition: "width 0.1s linear",
            }}
          />
        </div>

        {/* Metadata Footer Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 16,
            fontWeight: 700,
            color: "#94A3B8",
            letterSpacing: 2,
          }}
        >
          <span>✦ MOTION EXPLAINER</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {Array.from({ length: total }, (_, i) => (
              <div
                key={i}
                style={{
                  width: i === index ? 36 : 10,
                  height: 6,
                  borderRadius: 3,
                  background:
                    i === index
                      ? "#818CF8"
                      : i < index
                      ? "rgba(129, 140, 248, 0.4)"
                      : "rgba(255, 255, 255, 0.15)",
                  boxShadow: i === index ? "0 0 10px #818CF8" : "none",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function Explainer({ timeline }: { timeline: Timeline }) {
  return (
    <AbsoluteFill style={{ background: "#070913" }}>
      {timeline.scenes.map((s, i) => (
        <Sequence key={s.id} from={s.start} durationInFrames={s.frames}>
          <SceneView scene={s} index={i} total={timeline.scenes.length} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

