import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#153c3a";
const teal = "#168779";
const orange = "#e9a64d";

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
      <rect x="260" y="25" width="340" height="44" rx="22" fill="#dbe9e6" stroke="#b6d5ce" strokeWidth="1.5" />
      <text x="430" y="53" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="3" fill={teal}>
        SCALING & GROWTH CURVE
      </text>

      {/* Main Chart Card */}
      <g transform="translate(100 95)">
        <rect x="0" y="0" width="660" height="380" rx="28" fill="#fcfbf8" stroke="#ced9d1" strokeWidth="2" />

        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="80"
            y1={60 + i * 65}
            x2="600"
            y2={60 + i * 65}
            stroke="#e2e8f0"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        ))}

        {/* Axes */}
        <line x1="80" y1="320" x2="600" y2="320" stroke={ink} strokeWidth="3" />
        <line x1="80" y1="50" x2="80" y2="320" stroke={ink} strokeWidth="3" />

        {/* Axis Labels */}
        <text x="600" y="350" textAnchor="end" fontSize="15" fontWeight="600" fill="#64748b">
          DATA SIZE (N) →
        </text>
        <text x="65" y="45" textAnchor="end" fontSize="15" fontWeight="600" fill="#64748b">
          OPS ↑
        </text>

        {/* Linear O(N) steep red dotted line */}
        <path
          d="M 80 320 L 340 70"
          fill="none"
          stroke="#f87171"
          strokeWidth="3.5"
          strokeDasharray="8 8"
          opacity={0.7}
        />
        <text x="350" y="65" fill="#dc2626" fontSize="16" fontWeight="700">
          Linear O(N)
        </text>

        {/* Logarithmic O(log N) smoothly rising teal curve that animates */}
        <path
          d="M 80 320 C 140 280, 240 230, 580 215"
          fill="none"
          stroke={teal}
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
            <rect x="-60" y="-55" width="120" height="34" rx="8" fill={ink} />
            <text x="0" y="-33" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="700">
              {drawProgress > 0.8 ? "20 CHECKS" : "O(log N)"}
            </text>
          </g>
        )}
      </g>

      {/* Metric comparison cards at bottom */}
      <g transform="translate(100 500)">
        {/* Left card: Linear */}
        <rect x="0" y="0" width="315" height="150" rx="20" fill="#fee2e2" stroke="#fca5a5" strokeWidth="2" />
        <text x="25" y="38" fontSize="20" fontWeight="700" fill="#991b1b">
          Linear Scaling
        </text>
        <text x="25" y="80" fontSize="38" fontWeight="800" fill="#dc2626">
          1,000,000
        </text>
        <text x="25" y="115" fontSize="16" fontWeight="600" fill="#7f1d1d">
          Scans every single record
        </text>

        {/* Right card: Logarithmic */}
        <rect x="345" y="0" width="315" height="150" rx="20" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="2" />
        <text x="370" y="38" fontSize="20" fontWeight="700" fill="#065f46">
          Logarithmic Scaling
        </text>
        <text x="370" y="80" fontSize="38" fontWeight="800" fill={teal}>
          20 Checks
        </text>
        <text x="370" y="115" fontSize="16" fontWeight="600" fill="#047857">
          Halves remaining range
        </text>
      </g>
    </>
  );
}
