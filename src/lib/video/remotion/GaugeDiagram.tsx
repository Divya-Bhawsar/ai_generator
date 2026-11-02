import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#FFFFFF";
const cyan = "#38BDF8";
const orange = "#F59E0B";
const red = "#EF4444";
const slateCard = "#1E293B";

export function GaugeDiagram({ scene }: { scene: TimedScene }) {
  const f = useCurrentFrame();

  // Needle sweep animation triggers at cueFrame
  const cuePassed = f >= scene.cueFrame;
  const sweep = interpolate(f, [scene.cueFrame, scene.cueFrame + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Calculate needle angle (-110 deg to +40 deg)
  const angle = -110 + sweep * 150;

  // Live readout value: e.g. 100°C -> 121°C or 1.0 -> 2.0 atm
  const isCooking = /cook|boil|temp|heat|100|121/i.test(scene.title + " " + scene.narration);
  const metricNum = isCooking
    ? Math.round(100 + sweep * 21)
    : Math.round(20 + sweep * 75);
  const metricUnit = isCooking ? "°C" : "%";
  const subMetric = isCooking
    ? (1.0 + sweep * 1.0).toFixed(1) + " ATM PRESSURE"
    : "INTENSITY LEVEL";

  return (
    <>
      {/* Top category pill */}
      <rect x="250" y="20" width="360" height="46" rx="23" fill="rgba(99, 102, 241, 0.18)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
      <text x="430" y="50" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="3" fill={cyan}>
        ✦ THERMAL METRIC GAUGE
      </text>

      {/* Main Gauge Frame */}
      <g transform="translate(430 240)">
        {/* Outer Circular Bezel */}
        <circle r="170" fill={slateCard} stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2" />
        <circle r="150" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="16" />

        {/* Colored progress arc (Cyan to Orange to Red) */}
        <circle
          r="150"
          fill="none"
          stroke={cuePassed ? (metricNum > 115 ? red : orange) : cyan}
          strokeWidth="16"
          strokeDasharray="942"
          strokeDashoffset={942 - (sweep * 580)}
          strokeLinecap="round"
          transform="rotate(135)"
        />

        {/* Gauge Tick Marks */}
        {Array.from({ length: 9 }).map((_, i) => {
          const tickAngle = -135 + i * 33.75;
          return (
            <line
              key={i}
              x1="0"
              y1="-132"
              x2="0"
              y2="-146"
              stroke="#64748B"
              strokeWidth={i % 2 === 0 ? "3" : "1.5"}
              transform={`rotate(${tickAngle})`}
            />
          );
        })}

        {/* Sweeping Center Needle */}
        <g transform={`rotate(${angle})`}>
          <polygon points="-7,0 0,-138 7,0" fill={cuePassed ? red : cyan} />
          <circle r="16" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" />
          <circle r="6" fill="#ffffff" />
        </g>

        {/* Digital Readout Box */}
        <rect x="-90" y="55" width="180" height="65" rx="16" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255, 255, 255, 0.12)" />
        <text x="0" y="98" textAnchor="middle" fontSize="36" fontWeight="800" fill="#ffffff">
          {metricNum}{metricUnit}
        </text>
        <text x="0" y="145" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="2" fill={cuePassed ? orange : cyan}>
          {subMetric}
        </text>
      </g>

      {/* Animated steam / pressure particle waves */}
      <g transform="translate(130 450)">
        {Array.from({ length: 6 }).map((_, i) => {
          const t = ((f + i * 18) % 70) / 70;
          return (
            <circle
              key={i}
              cx={70 + i * 85 + Math.sin(t * 4 + i) * 15}
              cy={60 - t * 50}
              r={12 - t * 7}
              fill={cyan}
              opacity={cuePassed ? 0.7 * (1 - t) : 0.2}
            />
          );
        })}
      </g>

      {/* Explanatory takeaway banner */}
      <rect
        x="70"
        y="535"
        width="720"
        height="115"
        rx="24"
        fill={cuePassed ? "rgba(99, 102, 241, 0.22)" : "rgba(30, 41, 59, 0.75)"}
        stroke={cuePassed ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.1)"}
        strokeWidth="1.5"
      />
      <text x="430" y="578" textAnchor="middle" fontSize="26" fontWeight="800" fill={ink}>
        {cuePassed ? "Higher Pressure → Elevated Boiling Ceiling" : "Standard Atmospheric Pressure"}
      </text>
      <text x="430" y="618" textAnchor="middle" fontSize="18" fontWeight="600" fill={cyan}>
        {cuePassed ? "Trapped steam accelerates cooking by 70%" : "Heat escapes as vapor at 100°C"}
      </text>
    </>
  );
}
