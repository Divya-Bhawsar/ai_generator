import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#FFFFFF";
const cyan = "#38BDF8";
const amber = "#F59E0B";
const red = "#EF4444";
const indigo = "#818CF8";
const slateCard = "#1E293B";

export function AeroDiagram({ scene }: { scene: TimedScene }) {
  const f = useCurrentFrame();

  const isUpsideDown = /upside|invert|roll|reverse/i.test(scene.title + " " + scene.narration);
  const cuePassed = f >= scene.cueFrame;
  const progress = interpolate(f, [scene.cueFrame, scene.cueFrame + 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Angle of attack tilt: -6 deg to +8 deg
  const wingTilt = isUpsideDown ? -8 + progress * 14 : 2 + progress * 6;

  return (
    <>
      {/* Category header */}
      <rect x="250" y="20" width="360" height="46" rx="23" fill="rgba(99, 102, 241, 0.18)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
      <text x="430" y="50" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="3" fill={cyan}>
        ✦ AERODYNAMIC VECTOR ENGINE
      </text>

      {/* Main Airfoil Wind Tunnel Frame */}
      <g transform="translate(100 90)">
        <rect x="0" y="0" width="660" height="380" rx="28" fill={slateCard} stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />

        {/* Dynamic Airflow Streamlines curving past the wing */}
        {Array.from({ length: 6 }).map((_, i) => {
          const y = 60 + i * 48;
          const curveY = y + (i < 3 ? -15 : 20) * (cuePassed ? 1.4 : 0.8);
          return (
            <path
              key={i}
              d={`M 40 ${y} Q 310 ${curveY} 620 ${y + 15}`}
              fill="none"
              stroke={cyan}
              strokeWidth="3.5"
              strokeDasharray="14 16"
              strokeDashoffset={-f * 4.5}
              opacity={0.35 + 0.35 * Math.sin((f + i * 15) / 10)}
            />
          );
        })}

        {/* Tilting Airfoil Wing Profile */}
        <g transform={`translate(330 190) rotate(${wingTilt})`}>
          {/* Airfoil SVG Path (NACA profile cross section) */}
          <path
            d="M -160 0 C -120 -55 50 -60 160 0 C 70 25 -100 20 -160 0 Z"
            fill="rgba(99, 102, 241, 0.25)"
            stroke={indigo}
            strokeWidth="3.5"
          />

          {/* Wing chord reference line */}
          <line x1="-170" y1="0" x2="170" y2="0" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" strokeDasharray="6 6" />

          {/* Center of Lift Vector Indicator */}
          <circle cx="0" cy="-10" r="10" fill={cyan} />

          {/* Upward Net Lift Vector Arrow */}
          <g transform={`rotate(${-wingTilt})`}>
            <line
              x1="0"
              y1="-10"
              x2="0"
              y2={-10 - (80 + progress * 35)}
              stroke={amber}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <polygon
              points={`0,${-10 - (95 + progress * 35)} -9,${-10 - (75 + progress * 35)} 9,${-10 - (75 + progress * 35)}`}
              fill={amber}
            />
            <rect x="15" y="-105" width="75" height="30" rx="8" fill={amber} />
            <text x="52" y="-85" textAnchor="middle" fill="#0F172A" fontSize="15" fontWeight="800">
              LIFT
            </text>

            {/* Downward Weight / Gravity Vector Arrow */}
            <line x1="0" y1="-10" x2="0" y2="90" stroke={red} strokeWidth="5" strokeLinecap="round" />
            <polygon points="0,105 -8,85 8,85" fill={red} />
            <text x="35" y="80" fill={red} fontSize="15" fontWeight="800">
              WEIGHT
            </text>
          </g>
        </g>

        {/* Angle of Attack readout */}
        <rect x="25" y="315" width="230" height="42" rx="12" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255, 255, 255, 0.12)" />
        <text x="140" y="342" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="800" letterSpacing="1">
          ANGLE OF ATTACK: {Math.round(Math.abs(wingTilt))}°
        </text>

        {/* Flight condition label */}
        <rect x="425" y="315" width="210" height="42" rx="12" fill="rgba(15, 23, 42, 0.9)" stroke={cyan} strokeWidth="1.5" />
        <text x="530" y="342" textAnchor="middle" fill={cyan} fontSize="15" fontWeight="800" letterSpacing="1">
          {isUpsideDown ? "INVERTED ATTITUDE" : "LEVEL CRUISE"}
        </text>
      </g>

      {/* Explanatory bottom summary card */}
      <rect
        x="70"
        y="500"
        width="720"
        height="145"
        rx="24"
        fill={cuePassed ? "rgba(99, 102, 241, 0.22)" : "rgba(30, 41, 59, 0.75)"}
        stroke={cuePassed ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.1)"}
        strokeWidth="1.5"
      />
      <text x="430" y="545" textAnchor="middle" fontSize="28" fontWeight="800" fill={ink}>
        {isUpsideDown
          ? "Pilot Pushes Yoke Forward to Tilt Wing Up"
          : "Air Deflection Generates Equal Upward Lift"}
      </text>
      <text x="430" y="585" textAnchor="middle" fontSize="19" fontWeight="600" fill={cyan}>
        {isUpsideDown
          ? "Even upside-down, positive angle of attack deflects air downward"
          : "Newton's 3rd Law: Downward mass displacement pushes plane up"}
      </text>
      <text x="430" y="622" textAnchor="middle" fontSize="15" fontWeight="500" fill="#94A3B8">
        Verified aerodynamic physics: Camber is secondary to angle of attack
      </text>
    </>
  );
}
