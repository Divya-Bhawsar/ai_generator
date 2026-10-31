import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#153c3a";
const teal = "#168779";
const orange = "#e9a64d";
const blue = "#4a88a9";

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
      <rect x="260" y="30" width="340" height="48" rx="24" fill="#dbe9e6" stroke="#b6d5ce" strokeWidth="1.5" />
      <text x="430" y="61" textAnchor="middle" fontSize="17" fontWeight="700" letterSpacing="3" fill={teal}>
        {badge}
      </text>

      {/* Center illustration & vector diagram */}
      <g transform="translate(130 110)">
        {/* Main interactive science card */}
        <rect
          x="0"
          y="0"
          width="600"
          height="320"
          rx="28"
          fill="#fbfaf7"
          stroke={cuePassed ? teal : "#ced9d1"}
          strokeWidth={cuePassed ? 3 : 2}
        />

        {/* Ambient pulse / airflow vector lines */}
        {Array.from({ length: 4 }).map((_, i) => {
          const t = ((f + i * 22) % 90) / 90;
          return (
            <path
              key={i}
              d={`M40 ${70 + i * 55} C 180 ${60 + i * 50}, 380 ${80 + i * 60}, 560 ${70 + i * 55}`}
              fill="none"
              stroke={blue}
              strokeWidth="3.5"
              strokeDasharray="12 14"
              strokeDashoffset={-f * 2.5}
              opacity={0.35 + 0.35 * Math.sin(t * Math.PI)}
            />
          );
        })}

        {/* Dynamic Force Arrow (Lift / Pressure / Vector) */}
        <g
          transform={`translate(300 160) scale(${1 + 0.05 * Math.sin(f / 12)})`}
          opacity={0.3 + 0.7 * cueProgress}
        >
          {/* Circular vector hub */}
          <circle r="36" fill={teal} />
          <circle r="46" fill="none" stroke={orange} strokeWidth="3" strokeDasharray="6 6" />

          {/* Upward force vector */}
          <path
            d="M 0 10 L 0 -85 M -12 -72 L 0 -85 L 12 -72"
            fill="none"
            stroke={cuePassed ? orange : teal}
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
            fontWeight="700"
          >
            F
          </text>
        </g>

        {/* Force / Vector Label */}
        <rect x="210" y="255" width="180" height="38" rx="19" fill="#153c3a" />
        <text x="300" y="280" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="700" letterSpacing="1">
          {cfg.vectorLabel || "RESULTANT FORCE"}
        </text>
      </g>

      {/* Main headline */}
      <text x="430" y="475" textAnchor="middle" fontSize="30" fontWeight="700" fill={ink}>
        {headline}
      </text>

      {/* Explanatory bullet points */}
      <g transform="translate(130 515)">
        {points.map((p, i) => (
          <g key={i} transform={`translate(0 ${i * 48})`}>
            <circle cx="20" cy="10" r="6" fill={teal} />
            <text x="40" y="17" fill={ink} fontSize="22" fontWeight="500">
              {p}
            </text>
          </g>
        ))}
      </g>
    </>
  );
}
