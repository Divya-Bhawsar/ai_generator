import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#FFFFFF";
const cyan = "#38BDF8";
const amber = "#F59E0B";
const indigo = "#818CF8";
const slateCard = "#1E293B";

const reveal = (frame: number, start: number) =>
  interpolate(frame, [start, start + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export function wrapLabel(text: string, max = 22): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function ConceptDiagram({ scene }: { scene: TimedScene }) {
  const f = useCurrentFrame();

  if (scene.type === "comparison" || scene.comparison) {
    const sides = scene.comparison
      ? [scene.comparison.left, scene.comparison.right]
      : (scene.labels.length >= 2 ? scene.labels.slice(0, 2) : ["Option A", "Option B"]).map(
          (heading) => ({ heading, points: ["Key distinction", "Primary advantage"] })
        );

    return (
      <>
        {sides.map((side, index) => {
          const x = 25 + index * 425;
          const appear = reveal(f, 6 + index * 10);
          const accentColor = index === 0 ? cyan : amber;
          return (
            <g key={index} opacity={appear} transform={`translate(${x} ${(1 - appear) * 16})`}>
              {/* Card background */}
              <rect
                y="35"
                width="385"
                height="565"
                rx="30"
                fill={slateCard}
                stroke={index === 0 ? "rgba(56, 189, 248, 0.35)" : "rgba(245, 158, 11, 0.35)"}
                strokeWidth="1.5"
              />
              {/* Accent header bar */}
              <rect
                x="28"
                y="65"
                width="56"
                height="6"
                rx="3"
                fill={accentColor}
              />
              <text x="28" y="125" fontSize="30" fontWeight="800" fill={ink}>
                {side.heading}
              </text>
              <line x1="28" y1="155" x2="355" y2="155" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />

              {/* Bullet points reveal dynamically */}
              {side.points.map((point, j) => {
                const show = reveal(f, scene.cueFrame + index * 10 + j * 18);
                const y = 210 + j * 115;
                return (
                  <g key={j} opacity={show} transform={`translate(0 ${(1 - show) * 12})`}>
                    <circle cx="39" cy={y - 8} r="5" fill={accentColor} />
                    <text x="62" y={y} fill="#E2E8F0" fontSize="23" fontWeight="600">
                      {wrapLabel(point, 22).map((line, k) => (
                        <tspan key={k} x="62" dy={k ? 30 : 0}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
        <text
          x="430"
          y="650"
          textAnchor="middle"
          fill={cyan}
          fontSize="20"
          fontWeight="800"
          letterSpacing="3"
        >
          ✦ SYSTEM COMPARISON
        </text>
      </>
    );
  }

  // Flow / Process Steps
  const items = scene.labels.length > 0 ? scene.labels : ["Step 1", "Step 2", "Step 3"];
  return (
    <>
      {items.map((label, index) => {
        const y = 45 + index * 145;
        const show = reveal(f, scene.cueFrame + index * 16);
        return (
          <g key={index} opacity={show} transform={`translate(${(1 - show) * -20} 0)`}>
            <rect
              x="95"
              y={y}
              width="670"
              height="105"
              rx="24"
              fill={slateCard}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.5"
            />
            <circle cx="155" cy={y + 52} r="26" fill={indigo} />
            <text x="155" y={y + 61} textAnchor="middle" fill="white" fontSize="24" fontWeight="800">
              {index + 1}
            </text>
            <text x="210" y={y + 61} fill={ink} fontSize="28" fontWeight="800">
              {label}
            </text>
            {index < items.length - 1 && (
              <path
                d={`M430 ${y + 112} v22 m-7 -7 l7 7 l7 -7`}
                fill="none"
                stroke={cyan}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
    </>
  );
}
