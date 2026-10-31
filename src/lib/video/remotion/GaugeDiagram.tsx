import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#153c3a";
const teal = "#168779";
const orange = "#e9a64d";
const red = "#e5484d";

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
      <rect x="270" y="25" width="320" height="44" rx="22" fill="#dbe9e6" stroke="#b6d5ce" strokeWidth="1.5" />
      <text x="430" y="53" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="3" fill={teal}>
        THERMAL METRIC GAUGE
      </text>

      {/* Main Gauge Frame */}
      <g transform="translate(430 250)">
        {/* Outer Circular Bezel */}
        <circle r="170" fill="#fbfaf7" stroke="#ced9d1" strokeWidth="3" />
        <circle r="150" fill="none" stroke="#e0e8df" strokeWidth="16" />

        {/* Colored progress arc (Teal to Orange to Red) */}
        <circle
          r="150"
          fill="none"
          stroke={cuePassed ? (metricNum > 115 ? red : orange) : teal}
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
              stroke="#6c827b"
              strokeWidth={i % 2 === 0 ? "3" : "1.5"}
              transform={`rotate(${tickAngle})`}
            />
          );
        })}

        {/* Sweeping Center Needle */}
        <g transform={`rotate(${angle})`}>
          <polygon points="-7,0 0,-138 7,0" fill={cuePassed ? red : ink} />
          <circle r="16" fill={ink} />
          <circle r="6" fill="#ffffff" />
        </g>

        {/* Digital Readout Box */}
        <rect x="-90" y="55" width="180" height="65" rx="16" fill={ink} />
        <text x="0" y="98" textAnchor="middle" fontSize="36" fontWeight="700" fill="#ffffff">
          {metricNum}{metricUnit}
        </text>
        <text x="0" y="145" textAnchor="middle" fontSize="17" fontWeight="700" letterSpacing="2" fill={cuePassed ? orange : teal}>
          {subMetric}
        </text>
      </g>

      {/* Animated steam / pressure particle waves */}
      <g transform="translate(130 460)">
        {Array.from({ length: 6 }).map((_, i) => {
          const t = ((f + i * 18) % 70) / 70;
          return (
            <circle
              key={i}
              cx={70 + i * 85 + Math.sin(t * 4 + i) * 15}
              cy={60 - t * 50}
              r={12 - t * 7}
              fill={teal}
              opacity={cuePassed ? 0.8 * (1 - t) : 0.25}
            />
          );
        })}
      </g>

      {/* Explanatory takeaway banner */}
      <rect
        x="70"
        y="535"
        width="720"
        height="110"
        rx="24"
        fill={cuePassed ? "#cfe4db" : "#ffffff90"}
        stroke={cuePassed ? teal : "#ced9d1"}
        strokeWidth="2"
      />
      <text x="430" y="578" textAnchor="middle" fontSize="26" fontWeight="700" fill={ink}>
        {cuePassed ? "Higher Pressure → Elevated Boiling Ceiling" : "Standard Atmospheric Pressure"}
      </text>
      <text x="430" y="616" textAnchor="middle" fontSize="19" fontWeight="600" fill={teal}>
        {cuePassed ? "Trapped steam accelerates cooking by 70%" : "Heat escapes as vapor at 100°C"}
      </text>
    </>
  );
}
