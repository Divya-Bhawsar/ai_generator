import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { binaryTrace } from "./search";
import type { TimedScene } from "./contracts";

const ink = "#153c3a";
const teal = "#168779";
const orange = "#e9a64d";
const red = "#e5484d";

export function SearchDiagram({ scene }: { scene: TimedScene }) {
  const f = useCurrentFrame();
  const s = scene.search || {
    values: [3, 8, 14, 27, 39, 52, 68, 91],
    target: 52,
    step: 0,
    mode: "setup",
  };

  const trace = binaryTrace(s.values, s.target);
  const stepIndex = Math.min(Math.max(0, s.step), trace.length - 1);
  const step = trace[stepIndex] || trace[0];

  const setup = s.mode === "setup";
  const result = s.mode === "result";

  // Focus trigger: when speech cue is reached
  const checked = !setup && f >= scene.cueFrame;

  // Decision trigger: when decisionCue is reached (or default after 25 frames from cue)
  const decisionFrame = scene.decisionFrame ?? (scene.cueFrame + 25);
  const decided = !setup && (result ? checked : f >= decisionFrame);

  const found = (result && checked) || (decided && step.outcome === "found");
  const absent = decided && step.nextLow > step.nextHigh;

  const animStart = result ? scene.cueFrame : decisionFrame;
  const progress = decided
    ? interpolate(f, [animStart, animStart + 18], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const cell = Math.min(86, Math.floor(720 / s.values.length - 10));
  const gap = 10;
  const total = s.values.length * (cell + gap) - gap;
  const left = (860 - total) / 2;

  const low = setup ? 0 : decided ? step.nextLow : step.low;
  const high = setup ? s.values.length - 1 : decided ? step.nextHigh : step.high;

  let note = "Start with a sorted list";
  if (found) note = "Match found!";
  else if (absent) note = "No candidates remain";
  else if (decided) {
    note = step.outcome === "right" ? "Keep the larger values" : "Keep the smaller values";
  } else if (checked) {
    const midVal = s.values[step.mid];
    const op = midVal < s.target ? "<" : midVal > s.target ? ">" : "=";
    note = `Compare: ${midVal} ${op} ${s.target}`;
  } else {
    note = "Inspect the middle element";
  }

  const remaining = Math.max(0, high - low + 1);

  return (
    <>
      {/* Target display card */}
      <rect x="290" y="30" width="280" height="95" rx="22" fill="#dbe9e6" stroke="#b6d5ce" strokeWidth="2" />
      <text x="430" y="65" textAnchor="middle" fontSize="18" letterSpacing="3" fontWeight="700" fill={teal}>
        SEARCH TARGET
      </text>
      <text x="430" y="106" textAnchor="middle" fontSize="36" fontWeight="700" fill={ink}>
        {s.target}
      </text>

      {/* Operation subtitle */}
      <text x="430" y="185" textAnchor="middle" fontSize="22" fontWeight="600" fill="#6c827b">
        {setup ? "SORTED ARRAY · INDEX 0 TO " + (s.values.length - 1) : `STEP ${stepIndex + 1} OF ${trace.length}`}
      </text>

      {/* Array elements */}
      {s.values.map((value, i) => {
        const inActiveRange = setup || (i >= step.low && i <= step.high);
        const retained = i >= low && i <= high;
        const opacity = !inActiveRange ? 0.2 : decided && !retained ? 1 - 0.78 * progress : 1;
        const isMid = checked && i === step.mid;
        const isMatched = (found || (decided && step.outcome === "found")) && i === step.mid;
        const x = left + i * (cell + gap);

        const fillColor = isMatched ? teal : isMid ? "#f5dfbb" : "#e0e8df";
        const strokeColor = isMatched ? teal : isMid ? orange : "#c3d5ce";
        const strokeW = isMid || isMatched ? 4 : 2;

        return (
          <g key={i} opacity={opacity}>
            <rect
              x={x}
              y="235"
              width={cell}
              height="95"
              rx="16"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeW}
            />
            <text
              x={x + cell / 2}
              y="295"
              textAnchor="middle"
              fill={isMatched ? "#ffffff" : ink}
              fontSize="32"
              fontWeight="700"
            >
              {value}
            </text>

            {/* Red elimination strike-through slash */}
            {!retained && decided && (
              <path
                d={`M${x + 10} 250 L${x + cell - 10} 315`}
                stroke={red}
                strokeWidth="4"
                strokeLinecap="round"
                opacity={progress * 0.9}
              />
            )}
          </g>
        );
      })}

      {/* Upward midpoint pointer */}
      {checked && (
        <g transform={`translate(${left + step.mid * (cell + gap) + cell / 2} 355)`}>
          <path
            d="M0 24 V0 M-8 8 L0 0 L8 8"
            fill="none"
            stroke={found ? teal : orange}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <text
            x="0"
            y="54"
            textAnchor="middle"
            fontSize="18"
            fontWeight="700"
            letterSpacing="1"
            fill={found ? teal : orange}
          >
            {found ? "MATCH" : "MIDPOINT"}
          </text>
        </g>
      )}

      {/* Bottom status & insight card */}
      <rect
        x="70"
        y="450"
        width="720"
        height="115"
        rx="24"
        fill={found ? "#cfe4db" : "#ffffff90"}
        stroke={found ? teal : "#d0dcd4"}
        strokeWidth="2"
      />
      <text x="430" y="495" textAnchor="middle" fontSize="28" fontWeight="700" fill={ink}>
        {note}
      </text>
      <text x="430" y="534" textAnchor="middle" fontSize="20" fontWeight="600" fill={teal}>
        {found
          ? "Target located in O(log N) time"
          : absent
          ? "Value not found in search space"
          : `${remaining} candidate${remaining === 1 ? "" : "s"} remaining in active range`}
      </text>

      {/* Legend */}
      <g transform="translate(285 625)">
        <rect width="16" height="16" rx="4" fill={teal} />
        <text x="26" y="14" fontSize="18" fontWeight="600" fill={ink}>
          Candidates
        </text>
        <rect x="180" width="16" height="16" rx="4" fill="#c0c9c3" />
        <text x="206" y="14" fontSize="18" fontWeight="600" fill="#6c827b">
          Eliminated
        </text>
      </g>
    </>
  );
}
