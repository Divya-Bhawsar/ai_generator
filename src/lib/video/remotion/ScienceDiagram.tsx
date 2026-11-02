import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#FFFFFF";
const cyan = "#38BDF8";
const amber = "#F59E0B";
const indigo = "#818CF8";
const slateCard = "#1E293B";

export function ScienceDiagram({ scene }: { scene: TimedScene }) {
  const f = useCurrentFrame();
  const cuePassed = f >= scene.cueFrame;
  const cueProgress = interpolate(f, [scene.cueFrame, scene.cueFrame + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cfg = scene.science || {};
  const badge = cfg.badge || "PHYSICAL MECHANISM";
  const headline = cfg.headline || scene.labels[0] || "Key Principle";
  const points = cfg.points || (scene.labels.length > 1 ? scene.labels.slice(1) : ["Cause & Effect", "System Output"]);

  return (
    <>
      {/* Top concept badge */}
      <rect x="250" y="20" width="360" height="46" rx="23" fill="rgba(99, 102, 241, 0.18)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
      <text x="430" y="50" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="3" fill={cyan}>
        ✦ {badge}
      </text>

      {/* Center illustration & vector diagram */}
      <g transform="translate(130 95)">
        {/* Main interactive science card */}
        <rect
          x="0"
          y="0"
          width="600"
          height="340"
          rx="28"
          fill={slateCard}
          stroke={cuePassed ? indigo : "rgba(255, 255, 255, 0.12)"}
          strokeWidth={cuePassed ? 2.5 : 1.5}
        />

        {/* Ambient pulse / airflow vector lines */}
        {Array.from({ length: 4 }).map((_, i) => {
          const t = ((f + i * 22) % 90) / 90;
          return (
            <path
              key={i}
              d={`M40 ${70 + i * 58} C 180 ${60 + i * 52}, 380 ${80 + i * 62}, 560 ${70 + i * 58}`}
              fill="none"
              stroke={cyan}
              strokeWidth="3.5"
              strokeDasharray="12 14"
              strokeDashoffset={-f * 2.5}
              opacity={0.35 + 0.35 * Math.sin(t * Math.PI)}
            />
          );
        })}

        {/* Dynamic Force Arrow (Lift / Pressure / Vector) */}
        <g
          transform={`translate(300 165) scale(${1 + 0.05 * Math.sin(f / 12)})`}
          opacity={0.3 + 0.7 * cueProgress}
        >
          {/* Circular vector hub */}
          <circle r="36" fill={indigo} />
          <circle r="46" fill="none" stroke={amber} strokeWidth="3" strokeDasharray="6 6" />

          {/* Upward force vector */}
          <path
            d="M 0 10 L 0 -85 M -12 -72 L 0 -85 L 12 -72"
            fill="none"
            stroke={cuePassed ? amber : cyan}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <text
            x="0"
            y="6"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="18"
            fontWeight="800"
          >
            F
          </text>
        </g>

        {/* Force / Vector Label */}
        <rect x="200" y="270" width="200" height="40" rx="20" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255, 255, 255, 0.12)" />
        <text x="300" y="295" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="800" letterSpacing="1">
          {cfg.vectorLabel || "RESULTANT FORCE"}
        </text>
      </g>

      {/* Main headline banner */}
      <rect x="70" y="470" width="720" height="155" rx="24" fill="rgba(30, 41, 59, 0.75)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />
      <text x="430" y="520" textAnchor="middle" fontSize="28" fontWeight="800" fill={ink}>
        {headline}
      </text>

      {/* Explanatory bullet points */}
      <g transform="translate(140 550)">
        {points.slice(0, 2).map((p, i) => (
          <g key={i} transform={`translate(0 ${i * 38})`}>
            <circle cx="20" cy="10" r="5" fill={cyan} />
            <text x="36" y="17" fill="#E2E8F0" fontSize="20" fontWeight="600">
              {p}
            </text>
          </g>
        ))}
      </g>
    </>
  );
}
