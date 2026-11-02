import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { binaryTrace } from "./search";
import type { TimedScene } from "./contracts";

const ink = "#FFFFFF";
const cyan = "#38BDF8";
const amber = "#F59E0B";
const emerald = "#10B981";
const red = "#EF4444";
const slateCard = "#1E293B";

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
      <rect x="290" y="25" width="280" height="95" rx="22" fill={slateCard} stroke="rgba(99, 102, 241, 0.4)" strokeWidth="1.5" />
      <text x="430" y="58" textAnchor="middle" fontSize="16" letterSpacing="3" fontWeight="800" fill={cyan}>
        TARGET VALUE
      </text>
      <text x="430" y="100" textAnchor="middle" fontSize="38" fontWeight="800" fill={ink}>
        {s.target}
      </text>

      {/* Operation subtitle */}
      <text x="430" y="175" textAnchor="middle" fontSize="20" fontWeight="700" fill="#94A3B8" letterSpacing="1">
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

        const fillColor = isMatched ? "rgba(16, 185, 129, 0.25)" : isMid ? "rgba(245, 158, 11, 0.2)" : slateCard;
        const strokeColor = isMatched ? emerald : isMid ? amber : "rgba(255, 255, 255, 0.12)";
        const strokeW = isMid || isMatched ? 3 : 1.5;

        return (
          <g key={i} opacity={opacity}>
            <rect
              x={x}
              y="225"
              width={cell}
              height="95"
              rx="16"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeW}
            />
            <text
              x={x + cell / 2}
              y="285"
              textAnchor="middle"
              fill={isMatched ? "#34D399" : isMid ? "#FBBF24" : ink}
              fontSize="30"
              fontWeight="800"
            >
              {value}
            </text>

            {/* Red elimination strike-through slash */}
            {!retained && decided && (
              <path
                d={`M${x + 10} 240 L${x + cell - 10} 305`}
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
        <g transform={`translate(${left + step.mid * (cell + gap) + cell / 2} 350)`}>
          <path
            d="M0 24 V0 M-8 8 L0 0 L8 8"
            fill="none"
            stroke={found ? emerald : amber}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <text
            x="0"
            y="54"
            textAnchor="middle"
            fontSize="18"
            fontWeight="800"
            letterSpacing="1"
            fill={found ? emerald : amber}
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
        height="125"
        rx="24"
        fill={found ? "rgba(16, 185, 129, 0.18)" : "rgba(30, 41, 59, 0.75)"}
        stroke={found ? emerald : "rgba(255, 255, 255, 0.12)"}
        strokeWidth="1.5"
      />
      <text x="430" y="498" textAnchor="middle" fontSize="28" fontWeight="800" fill={ink}>
        {note}
      </text>
      <text x="430" y="540" textAnchor="middle" fontSize="19" fontWeight="600" fill={cyan}>
        {found
          ? "Target located in O(log N) logarithmic time"
          : absent
          ? "Value not found in search space"
          : `${remaining} candidate${remaining === 1 ? "" : "s"} remaining in active range`}
      </text>

      {/* Legend */}
      <g transform="translate(285 630)">
        <rect width="16" height="16" rx="4" fill={cyan} />
        <text x="26" y="14" fontSize="17" fontWeight="600" fill={ink}>
          Active Search
        </text>
        <rect x="180" width="16" height="16" rx="4" fill="rgba(255, 255, 255, 0.2)" />
        <text x="206" y="14" fontSize="17" fontWeight="600" fill="#94A3B8">
          Eliminated
        </text>
      </g>
    </>
  );
}
