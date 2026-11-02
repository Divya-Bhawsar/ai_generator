import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#FFFFFF";
const cyan = "#38BDF8";
const orange = "#F59E0B";
const red = "#EF4444";
const emerald = "#10B981";
const slateCard = "#1E293B";

export function ChartDiagram({ scene }: { scene: TimedScene }) {
  const f = useCurrentFrame();

  const cuePassed = f >= scene.cueFrame;
  const drawProgress = interpolate(f, [scene.cueFrame, scene.cueFrame + 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Curve path length ~ 550
  const pathLength = 550;
  const dashOffset = pathLength * (1 - drawProgress);

  return (
    <>
      {/* Category header */}
      <rect x="250" y="20" width="360" height="46" rx="23" fill="rgba(99, 102, 241, 0.18)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
      <text x="430" y="50" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="3" fill={cyan}>
        ✦ SCALING & GROWTH CURVE
      </text>

      {/* Main Chart Card */}
      <g transform="translate(100 90)">
        <rect x="0" y="0" width="660" height="380" rx="28" fill={slateCard} stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />

        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="80"
            y1={60 + i * 65}
            x2="600"
            y2={60 + i * 65}
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        ))}

        {/* Axes */}
        <line x1="80" y1="320" x2="600" y2="320" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2.5" />
        <line x1="80" y1="50" x2="80" y2="320" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2.5" />

        {/* Axis Labels */}
        <text x="600" y="350" textAnchor="end" fontSize="14" fontWeight="700" fill="#94A3B8">
          DATA SIZE (N) →
        </text>
        <text x="65" y="45" textAnchor="end" fontSize="14" fontWeight="700" fill="#94A3B8">
          OPS ↑
        </text>

        {/* Linear O(N) steep red dotted line */}
        <path
          d="M 80 320 L 340 70"
          fill="none"
          stroke={red}
          strokeWidth="3.5"
          strokeDasharray="8 8"
          opacity={0.8}
        />
        <text x="350" y="65" fill={red} fontSize="16" fontWeight="800">
          Linear O(N)
        </text>

        {/* Logarithmic O(log N) smoothly rising cyan curve that animates */}
        <path
          d="M 80 320 C 140 280, 240 230, 580 215"
          fill="none"
          stroke={cyan}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
        />

        {/* Animated Data Point on the curve */}
        {cuePassed && (
          <g transform={`translate(${80 + drawProgress * 500} ${320 - drawProgress * 105})`}>
            <circle r="14" fill={orange} />
            <circle r="22" fill="none" stroke={orange} strokeWidth="3" opacity={0.5 + 0.5 * Math.sin(f / 8)} />
            <rect x="-60" y="-55" width="120" height="34" rx="8" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(255, 255, 255, 0.15)" />
            <text x="0" y="-33" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="800">
              {drawProgress > 0.8 ? "20 CHECKS" : "O(log N)"}
            </text>
          </g>
        )}
      </g>

      {/* Metric comparison cards at bottom */}
      <g transform="translate(100 500)">
        {/* Left card: Linear */}
        <rect x="0" y="0" width="315" height="150" rx="20" fill={slateCard} stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" />
        <text x="25" y="38" fontSize="18" fontWeight="700" fill={red}>
          Linear Scaling
        </text>
        <text x="25" y="80" fontSize="36" fontWeight="800" fill="#FFFFFF">
          1,000,000
        </text>
        <text x="25" y="115" fontSize="15" fontWeight="600" fill="#94A3B8">
          Scans every single record
        </text>

        {/* Right card: Logarithmic */}
        <rect x="345" y="0" width="315" height="150" rx="20" fill={slateCard} stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5" />
        <text x="370" y="38" fontSize="18" fontWeight="700" fill={emerald}>
          Logarithmic Scaling
        </text>
        <text x="370" y="80" fontSize="36" fontWeight="800" fill={emerald}>
          20 Checks
        </text>
        <text x="370" y="115" fontSize="15" fontWeight="600" fill="#94A3B8">
          Halves remaining range
        </text>
      </g>
    </>
  );
}
