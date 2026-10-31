import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#153c3a";
const teal = "#168779";
const orange = "#e9a64d";
const blue = "#3a7f9e";
const red = "#e5484d";

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
      <rect x="260" y="25" width="340" height="44" rx="22" fill="#dbe9e6" stroke="#b6d5ce" strokeWidth="1.5" />
      <text x="430" y="53" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="3" fill={teal}>
        AERODYNAMIC VECTOR ENGINE
      </text>

      {/* Main Airfoil Wind Tunnel Frame */}
      <g transform="translate(100 100)">
        <rect x="0" y="0" width="660" height="370" rx="28" fill="#fcfbf8" stroke="#ced9d1" strokeWidth="2" />

        {/* Dynamic Airflow Streamlines curving past the wing */}
        {Array.from({ length: 6 }).map((_, i) => {
          const y = 60 + i * 48;
          const curveY = y + (i < 3 ? -15 : 20) * (cuePassed ? 1.4 : 0.8);
          return (
            <path
              key={i}
              d={`M 40 ${y} Q 310 ${curveY} 620 ${y + 15}`}
              fill="none"
              stroke={blue}
              strokeWidth="3.5"
              strokeDasharray="14 16"
              strokeDashoffset={-f * 4.5}
              opacity={0.35 + 0.35 * Math.sin((f + i * 15) / 10)}
            />
          );
        })}

        {/* Tilting Airfoil Wing Profile */}
        <g transform={`translate(330 185) rotate(${wingTilt})`}>
          {/* Airfoil SVG Path (NACA profile cross section) */}
          <path
            d="M -160 0 C -120 -55 50 -60 160 0 C 70 25 -100 20 -160 0 Z"
            fill="#dbe9e6"
            stroke={ink}
            strokeWidth="4"
          />

          {/* Wing chord reference line */}
          <line x1="-170" y1="0" x2="170" y2="0" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 6" />

          {/* Center of Lift Vector Indicator */}
          <circle cx="0" cy="-10" r="10" fill={teal} />

          {/* Upward Net Lift Vector Arrow */}
          <g transform={`rotate(${-wingTilt})`}>
            <line
              x1="0"
              y1="-10"
              x2="0"
              y2={-10 - (80 + progress * 35)}
              stroke={orange}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <polygon
              points={`0,${-10 - (95 + progress * 35)} -9,${-10 - (75 + progress * 35)} 9,${-10 - (75 + progress * 35)}`}
              fill={orange}
            />
            <rect x="15" y="-105" width="75" height="30" rx="8" fill={orange} />
            <text x="52" y="-85" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="700">
              LIFT
            </text>

            {/* Downward Weight / Gravity Vector Arrow */}
            <line x1="0" y1="-10" x2="0" y2="90" stroke={red} strokeWidth="5" strokeLinecap="round" />
            <polygon points="0,105 -8,85 8,85" fill={red} />
            <text x="35" y="80" fill={red} fontSize="16" fontWeight="700">
              WEIGHT
            </text>
          </g>
        </g>

        {/* Angle of Attack readout */}
        <rect x="25" y="305" width="220" height="42" rx="12" fill={ink} />
        <text x="135" y="332" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="700" letterSpacing="1">
          ANGLE OF ATTACK: {Math.round(Math.abs(wingTilt))}°
        </text>

        {/* Flight condition label */}
        <rect x="425" y="305" width="210" height="42" rx="12" fill="#dbe9e6" stroke={teal} strokeWidth="2" />
        <text x="530" y="332" textAnchor="middle" fill={teal} fontSize="16" fontWeight="700" letterSpacing="1">
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
        fill={cuePassed ? "#cfe4db" : "#ffffff90"}
        stroke={cuePassed ? teal : "#ced9d1"}
        strokeWidth="2"
      />
      <text x="430" y="545" textAnchor="middle" fontSize="28" fontWeight="700" fill={ink}>
        {isUpsideDown
          ? "Pilot Pushes Yoke Forward to Tilt Wing Up"
          : "Air Deflection Generates Equal Upward Lift"}
      </text>
      <text x="430" y="585" textAnchor="middle" fontSize="20" fontWeight="600" fill={teal}>
        {isUpsideDown
          ? "Even upside-down, positive angle of attack deflects air downward"
          : "Newton's 3rd Law: Downward mass displacement pushes plane up"}
      </text>
      <text x="430" y="622" textAnchor="middle" fontSize="17" fontWeight="500" fill="#6c827b">
        Verified aerodynamic physics: Camber is secondary to angle of attack
      </text>
    </>
  );
}
