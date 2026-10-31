import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#153c3a";
const teal = "#168779";
const orange = "#e9a64d";

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
          return (
            <g key={index} opacity={appear} transform={`translate(${x} ${(1 - appear) * 16})`}>
              {/* Card background */}
              <rect
                y="40"
                width="385"
                height="560"
                rx="30"
                fill={index === 0 ? "#dbe9e6" : "#e8e5d9"}
                stroke={index === 0 ? "#bfd4cf" : "#d7d0ba"}
                strokeWidth="2"
              />
              {/* Accent header bar */}
              <rect
                x="28"
                y="68"
                width="56"
                height="7"
                rx="3.5"
                fill={index === 0 ? teal : orange}
              />
              <text x="28" y="132" fontSize="32" fontWeight="700" fill={ink}>
                {side.heading}
              </text>
              <line x1="28" y1="164" x2="355" y2="164" stroke="#bccfc8" strokeWidth="2" />

              {/* Bullet points reveal dynamically */}
              {side.points.map((point, j) => {
                const show = reveal(f, scene.cueFrame + index * 10 + j * 18);
                const y = 220 + j * 115;
                return (
                  <g key={j} opacity={show} transform={`translate(0 ${(1 - show) * 12})`}>
                    <circle cx="39" cy={y - 8} r="5" fill={index === 0 ? teal : orange} />
                    <text x="62" y={y} fill={ink} fontSize="25" fontWeight="500">
                      {wrapLabel(point, 22).map((line, k) => (
                        <tspan key={k} x="62" dy={k ? 32 : 0}>
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
          fill={teal}
          fontSize="22"
          fontWeight="600"
          letterSpacing="3"
        >
          COMPARE AT A GLANCE
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
              fill={index % 2 === 0 ? "#dbe9e6" : "#e0e8df"}
              stroke="#ced9d1"
              strokeWidth="2"
            />
            <circle cx="155" cy={y + 52} r="26" fill={teal} />
            <text x="155" y={y + 61} textAnchor="middle" fill="white" fontSize="26" fontWeight="700">
              {index + 1}
            </text>
            <text x="210" y={y + 61} fill={ink} fontSize="30" fontWeight="600">
              {label}
            </text>
            {index < items.length - 1 && (
              <path
                d={`M430 ${y + 112} v22 m-7 -7 l7 7 l7 -7`}
                fill="none"
                stroke={teal}
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
    </>
  );
}
