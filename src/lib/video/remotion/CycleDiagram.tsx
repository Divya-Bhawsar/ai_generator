import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#FFFFFF";
const cyan = "#38BDF8";
const orange = "#F59E0B";
const indigo = "#818CF8";
const slateCard = "#1E293B";

export function CycleDiagram({ scene }: { scene: TimedScene }) {
  const f = useCurrentFrame();

  const cuePassed = f >= scene.cueFrame;
  const labels = scene.labels.length >= 3 ? scene.labels.slice(0, 4) : ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];

  return (
    <>
      {/* Category header */}
      <rect x="250" y="20" width="360" height="46" rx="23" fill="rgba(99, 102, 241, 0.18)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
      <text x="430" y="50" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="3" fill={cyan}>
        ✦ CONTINUOUS CYCLE ENGINE
      </text>

      {/* Main Orbital Frame */}
      <g transform="translate(430 270)">
        {/* Orbital Track Circle */}
        <circle r="160" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2.5" strokeDasharray="8 8" />

        {/* Circulating Orbit Pulse Particles */}
        <g transform={`rotate(${f * 1.8})`}>
          <circle cx="160" cy="0" r="10" fill={cyan} />
          <circle cx="-160" cy="0" r="10" fill={orange} />
        </g>

        {/* Center Hub */}
        <circle r="75" fill="#0F172A" stroke={indigo} strokeWidth="3" />
        <circle r="60" fill="rgba(99, 102, 241, 0.2)" />
        <text x="0" y="8" textAnchor="middle" fontSize="22" fontWeight="800" fill={ink}>
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
                fill={isActive ? orange : slateCard}
                stroke={isActive ? "#FBBF24" : cyan}
                strokeWidth={isActive ? "4" : "2"}
              />
              <text
                x="0"
                y="6"
                textAnchor="middle"
                fontSize="18"
                fontWeight="800"
                fill={isActive ? "#0F172A" : ink}
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
                fill="rgba(15, 23, 42, 0.9)"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
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
        fill={cuePassed ? "rgba(99, 102, 241, 0.22)" : "rgba(30, 41, 59, 0.75)"}
        stroke={cuePassed ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.1)"}
        strokeWidth="1.5"
      />
      <text x="430" y="545" textAnchor="middle" fontSize="28" fontWeight="800" fill={ink}>
        {scene.title}
      </text>
      <text x="430" y="585" textAnchor="middle" fontSize="19" fontWeight="600" fill={cyan}>
        Self-sustaining closed-loop system: energy & mass conserved
      </text>
      <text x="430" y="620" textAnchor="middle" fontSize="15" fontWeight="500" fill="#94A3B8">
        Each step feeds directly into the subsequent phase
      </text>
    </>
  );
}
