import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#153c3a";
const teal = "#168779";
const orange = "#e9a64d";
const blue = "#3a7f9e";

export function CycleDiagram({ scene }: { scene: TimedScene }) {
  const f = useCurrentFrame();

  const cuePassed = f >= scene.cueFrame;
  const labels = scene.labels.length >= 3 ? scene.labels.slice(0, 4) : ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];

  return (
    <>
      {/* Category header */}
      <rect x="260" y="25" width="340" height="44" rx="22" fill="#dbe9e6" stroke="#b6d5ce" strokeWidth="1.5" />
      <text x="430" y="53" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="3" fill={teal}>
        CONTINUOUS CYCLE ENGINE
      </text>

      {/* Main Orbital Frame */}
      <g transform="translate(430 280)">
        {/* Orbital Track Circle */}
        <circle r="160" fill="none" stroke="#ced9d1" strokeWidth="3" strokeDasharray="8 8" />

        {/* Circulating Orbit Pulse Particles */}
        <g transform={`rotate(${f * 1.8})`}>
          <circle cx="160" cy="0" r="10" fill={teal} />
          <circle cx="-160" cy="0" r="10" fill={orange} />
        </g>

        {/* Center Hub */}
        <circle r="75" fill="#fcfbf8" stroke={teal} strokeWidth="3" />
        <circle r="60" fill="#dbe9e6" />
        <text x="0" y="8" textAnchor="middle" fontSize="22" fontWeight="700" fill={ink}>
          CYCLE
        </text>

        {/* 4 Orbital Phase Nodes at 0, 90, 180, 270 deg */}
        {labels.map((lbl, idx) => {
          const angleRad = (idx * Math.PI) / 2 - Math.PI / 2;
          const x = Math.cos(angleRad) * 160;
          const y = Math.sin(angleRad) * 160;
          const isActive = cuePassed && idx === 0;

          return (
            <g key={idx} transform={`translate(${x} ${y})`}>
              <circle
                r={isActive ? "38" : "32"}
                fill={isActive ? orange : "#ffffff"}
                stroke={isActive ? orange : teal}
                strokeWidth={isActive ? "4" : "3"}
              />
              <text
                x="0"
                y="6"
                textAnchor="middle"
                fontSize="18"
                fontWeight="800"
                fill={isActive ? "#ffffff" : ink}
              >
                0{idx + 1}
              </text>

              {/* Node Label Card */}
              <rect
                x={x > 0 ? "45" : x < 0 ? "-175" : "-65"}
                y={y > 0 ? "35" : y < 0 ? "-55" : "-18"}
                width="130"
                height="36"
                rx="10"
                fill={ink}
              />
              <text
                x={x > 0 ? "110" : x < 0 ? "-110" : "0"}
                y={y > 0 ? "58" : y < 0 ? "-32" : "5"}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#ffffff"
              >
                {lbl.slice(0, 14)}
              </text>
            </g>
          );
        })}
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
        {scene.title}
      </text>
      <text x="430" y="585" textAnchor="middle" fontSize="20" fontWeight="600" fill={teal}>
        Self-sustaining closed-loop system: energy & mass conserved
      </text>
      <text x="430" y="620" textAnchor="middle" fontSize="17" fontWeight="500" fill="#6c827b">
        Each step feeds directly into the subsequent phase
      </text>
    </>
  );
}
