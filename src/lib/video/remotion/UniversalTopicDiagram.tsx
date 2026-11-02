import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#FFFFFF";
const cyan = "#38BDF8";
const indigo = "#818CF8";
const amber = "#F59E0B";
const slateCard = "#1E293B";
const slateCardBg = "rgba(30, 41, 59, 0.75)";
const subtext = "#94A3B8";

const reveal = (frame: number, start: number, dur = 16) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export function UniversalTopicDiagram({ scene }: { scene: TimedScene }) {
  const f = useCurrentFrame();
  const d = scene.diagram;

  const cuePassed = f >= scene.cueFrame;
  const animProgress = interpolate(f, [scene.cueFrame, scene.cueFrame + 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headline = d?.headline || scene.title;
  const badge = d?.badge || "SYSTEM MECHANISM";
  const diagType = d?.diagram_type || "vector_system";

  // 1. SPLIT COMPARISON (Left vs Right)
  if (diagType === "split_comparison" && d?.comparison) {
    const comp = d.comparison;
    const leftTitle = comp.left_title || "Standard State";
    const rightTitle = comp.right_title || "Transformed State";
    const leftPoints = comp.left_points || ["Initial condition", "Standard behavior"];
    const rightPoints = comp.right_points || ["Reaction triggered", "Core transformation"];

    return (
      <>
        {/* Top category pill */}
        <rect x="250" y="20" width="360" height="46" rx="23" fill="rgba(99, 102, 241, 0.18)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
        <text x="430" y="50" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="3" fill={cyan}>
          ✦ {badge}
        </text>

        {/* Two Cinema Cards */}
        <g transform="translate(45 85)">
          {/* Left Card */}
          <g opacity={reveal(f, 6)} transform={`translate(0 ${(1 - reveal(f, 6)) * 14})`}>
            <rect width="365" height="430" rx="26" fill={slateCard} stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1.5" />
            <rect x="24" y="28" width="50" height="6" rx="3" fill={cyan} />
            <text x="24" y="76" fontSize="24" fontWeight="800" fill={ink}>
              {leftTitle.slice(0, 22)}
            </text>
            <line x1="24" y1="96" x2="341" y2="96" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />

            {leftPoints.slice(0, 3).map((pt, j) => {
              const show = reveal(f, scene.cueFrame + j * 14);
              return (
                <g key={j} opacity={show} transform={`translate(0 ${(1 - show) * 10})`}>
                  <circle cx="34" cy={140 + j * 85} r="6" fill={cyan} />
                  <text x="52" y={146 + j * 85} fill="#E2E8F0" fontSize="20" fontWeight="600">
                    {pt.length > 25 ? pt.slice(0, 24) + "…" : pt}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Right Card */}
          <g opacity={reveal(f, 14)} transform={`translate(405 ${(1 - reveal(f, 14)) * 14})`}>
            <rect width="365" height="430" rx="26" fill={slateCard} stroke="rgba(245, 158, 11, 0.35)" strokeWidth="1.5" />
            <rect x="24" y="28" width="50" height="6" rx="3" fill={amber} />
            <text x="24" y="76" fontSize="24" fontWeight="800" fill={ink}>
              {rightTitle.slice(0, 22)}
            </text>
            <line x1="24" y1="96" x2="341" y2="96" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />

            {rightPoints.slice(0, 3).map((pt, j) => {
              const show = reveal(f, scene.cueFrame + 18 + j * 14);
              return (
                <g key={j} opacity={show} transform={`translate(0 ${(1 - show) * 10})`}>
                  <circle cx="34" cy={140 + j * 85} r="6" fill={amber} />
                  <text x="52" y={146 + j * 85} fill="#E2E8F0" fontSize="20" fontWeight="600">
                    {pt.length > 25 ? pt.slice(0, 24) + "…" : pt}
                  </text>
                </g>
              );
            })}
          </g>
        </g>

        {/* Bottom Headline Banner */}
        <rect
          x="70"
          y="545"
          width="720"
          height="115"
          rx="24"
          fill={cuePassed ? "rgba(99, 102, 241, 0.22)" : slateCardBg}
          stroke={cuePassed ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.1)"}
          strokeWidth="1.5"
        />
        <text x="430" y="590" textAnchor="middle" fontSize="26" fontWeight="800" fill={ink}>
          {headline}
        </text>
        <text x="430" y="628" textAnchor="middle" fontSize="18" fontWeight="600" fill={cyan}>
          Direct comparative mechanism observed in real-time
        </text>
      </>
    );
  }

  // 2. METRIC CARD (Scientific Values, Temperatures, Multipliers, Units)
  if (diagType === "metric_card" && d?.metric) {
    const met = d.metric;
    return (
      <>
        <rect x="250" y="20" width="360" height="46" rx="23" fill="rgba(99, 102, 241, 0.18)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
        <text x="430" y="50" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="3" fill={cyan}>
          ✦ {badge}
        </text>

        {/* Circular Gauge / Radial Value Display */}
        <g transform="translate(430 240)">
          <circle r="150" fill={slateCard} stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2" />
          <circle r="130" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="14" />
          <circle
            r="130"
            fill="none"
            stroke={cuePassed ? amber : cyan}
            strokeWidth="14"
            strokeDasharray="816"
            strokeDashoffset={816 - animProgress * 540}
            strokeLinecap="round"
            transform="rotate(135)"
          />

          {/* Metric Value & Unit */}
          <text x="0" y="-10" textAnchor="middle" fontSize={met.value && met.value.length > 5 ? 46 : 64} fontWeight="800" fill={ink}>
            {met.value || "100"}
            <tspan fontSize="32" fontWeight="700" fill={cyan}>
              {met.unit ? ` ${met.unit}` : ""}
            </tspan>
          </text>

          <rect x="-110" y="30" width="220" height="38" rx="14" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255, 255, 255, 0.1)" />
          <text x="0" y="55" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FFFFFF" letterSpacing="1">
            {(met.label || headline || "KEY METRIC").toUpperCase().slice(0, 18)}
          </text>
          <text x="0" y="95" textAnchor="middle" fontSize="16" fontWeight="600" fill={cuePassed ? amber : subtext}>
            {met.subtext || "Observed physical threshold"}
          </text>
        </g>

        {/* Bottom Headline Card */}
        <rect
          x="70"
          y="475"
          width="720"
          height="155"
          rx="24"
          fill={cuePassed ? "rgba(99, 102, 241, 0.22)" : slateCardBg}
          stroke={cuePassed ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.1)"}
          strokeWidth="1.5"
        />
        <text x="430" y="525" textAnchor="middle" fontSize="28" fontWeight="800" fill={ink}>
          {headline}
        </text>
        <text x="430" y="568" textAnchor="middle" fontSize="20" fontWeight="600" fill={cyan}>
          {met.subtext || "Measurable cause-and-effect transition"}
        </text>
        <text x="430" y="605" textAnchor="middle" fontSize="16" fontWeight="500" fill={subtext}>
          Governed by thermodynamic and physical equilibrium
        </text>
      </>
    );
  }

  // 3. FLOW PIPELINE (Sequential Process Stages)
  if (diagType === "flow_pipeline" && d?.flow_steps && d.flow_steps.length > 0) {
    const steps = d.flow_steps.slice(0, 3);
    return (
      <>
        <rect x="250" y="20" width="360" height="46" rx="23" fill="rgba(99, 102, 241, 0.18)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
        <text x="430" y="50" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="3" fill={cyan}>
          ✦ {badge}
        </text>

        {/* 3 Step Pipeline Cards */}
        <g transform="translate(90 90)">
          {steps.map((st, i) => {
            const show = reveal(f, scene.cueFrame + i * 14);
            const y = i * 135;
            return (
              <g key={i} opacity={show} transform={`translate(${(1 - show) * -20} ${y})`}>
                <rect width="680" height="105" rx="22" fill={slateCard} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />
                <circle cx="55" cy="52" r="26" fill={indigo} />
                <text x="55" y="60" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="800">
                  {st.step_number || i + 1}
                </text>
                <text x="105" y="48" fill={ink} fontSize="24" fontWeight="800">
                  {st.title}
                </text>
                {st.detail && (
                  <text x="105" y="78" fill="#94A3B8" fontSize="17" fontWeight="500">
                    {st.detail}
                  </text>
                )}

                {/* Animated connector arrow */}
                {i < steps.length - 1 && (
                  <path
                    d={`M 340 108 L 340 130 M 333 123 L 340 130 L 347 123`}
                    fill="none"
                    stroke={cyan}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Bottom Headline */}
        <rect
          x="70"
          y="535"
          width="720"
          height="115"
          rx="24"
          fill={cuePassed ? "rgba(99, 102, 241, 0.22)" : slateCardBg}
          stroke={cuePassed ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.1)"}
          strokeWidth="1.5"
        />
        <text x="430" y="580" textAnchor="middle" fontSize="26" fontWeight="800" fill={ink}>
          {headline}
        </text>
        <text x="430" y="618" textAnchor="middle" fontSize="18" fontWeight="600" fill={cyan}>
          Progressive chain of action: each phase triggers the next
        </text>
      </>
    );
  }

  // 4. ORBITAL CYCLE (Feedback Loops, Biochemical & Physical Cycles)
  if (diagType === "orbital_cycle") {
    const cycleLabels =
      d?.flow_steps && d.flow_steps.length > 0
        ? d.flow_steps.slice(0, 4).map((s) => s.title)
        : d?.key_takeaways && d.key_takeaways.length > 0
        ? d.key_takeaways.slice(0, 4)
        : scene.labels.length >= 2
        ? scene.labels.slice(0, 4)
        : ["Initiation", "Reaction", "Equilibrium", "Regeneration"];

    return (
      <>
        <rect x="250" y="20" width="360" height="46" rx="23" fill="rgba(99, 102, 241, 0.18)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
        <text x="430" y="50" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="3" fill={cyan}>
          ✦ {badge}
        </text>

        {/* Main Orbital Track Frame */}
        <g transform="translate(430 270)">
          {/* Orbital Circle */}
          <circle r="150" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2.5" strokeDasharray="8 8" />

          {/* Circulating Orbiting Pulse Particles */}
          <g transform={`rotate(${f * 2.2})`}>
            <circle cx="150" cy="0" r="11" fill={cyan} />
            <circle cx="-150" cy="0" r="11" fill={amber} />
            <circle cx="0" cy="150" r="7" fill={indigo} opacity={0.8} />
            <circle cx="0" cy="-150" r="7" fill={indigo} opacity={0.8} />
          </g>

          {/* Central Core Hub */}
          <circle r="72" fill="#0F172A" stroke={cyan} strokeWidth="2.5" />
          <circle r="56" fill="rgba(99, 102, 241, 0.25)" />
          <text x="0" y="6" textAnchor="middle" fontSize="18" fontWeight="800" fill={ink}>
            {(d?.vector_system?.center_label || "FEEDBACK").slice(0, 12)}
          </text>
          <text x="0" y="24" textAnchor="middle" fontSize="12" fontWeight="700" fill={cyan} letterSpacing="1">
            CYCLE
          </text>

          {/* Phase Nodes around the circumference */}
          {cycleLabels.map((lbl, idx) => {
            const count = cycleLabels.length;
            const angleRad = (idx * 2 * Math.PI) / count - Math.PI / 2;
            const x = Math.cos(angleRad) * 150;
            const y = Math.sin(angleRad) * 150;
            const isActive = cuePassed && idx === 0;

            return (
              <g key={idx} transform={`translate(${x} ${y})`}>
                <circle
                  r={isActive ? "36" : "30"}
                  fill={isActive ? amber : slateCard}
                  stroke={isActive ? "#FBBF24" : cyan}
                  strokeWidth={isActive ? "3.5" : "2"}
                />
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  fill={isActive ? "#0F172A" : ink}
                  fontSize="14"
                  fontWeight="700"
                >
                  {lbl.length > 10 ? lbl.slice(0, 9) + "…" : lbl}
                </text>
              </g>
            );
          })}
        </g>

        {/* Bottom Headline Banner */}
        <rect
          x="70"
          y="530"
          width="720"
          height="115"
          rx="24"
          fill={cuePassed ? "rgba(99, 102, 241, 0.22)" : slateCardBg}
          stroke={cuePassed ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.1)"}
          strokeWidth="1.5"
        />
        <text x="430" y="575" textAnchor="middle" fontSize="26" fontWeight="800" fill={ink}>
          {headline}
        </text>
        <text x="430" y="612" textAnchor="middle" fontSize="18" fontWeight="600" fill={cyan}>
          Continuous closed-loop transformation cycle
        </text>
      </>
    );
  }

  // 5. VECTOR / FOCAL SYSTEM (Default universal focal hub)
  const vecSys = d?.vector_system;
  const centerLabel = vecSys?.center_label || scene.labels[0] || "Primary Agent";
  const forceLabel = vecSys?.force_label || "RESULTANT ACTION";
  const vectors = vecSys?.vectors || [{ name: "Dynamic Interaction", direction: "up" }];

  return (
    <>
      <rect x="250" y="20" width="360" height="46" rx="23" fill="rgba(99, 102, 241, 0.18)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
      <text x="430" y="50" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="3" fill={cyan}>
        ✦ {badge}
      </text>

      {/* Main Vector Wind/Force Frame */}
      <g transform="translate(100 90)">
        <rect width="660" height="380" rx="28" fill={slateCard} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />

        {/* Streamlines / Field lines */}
        {Array.from({ length: 5 }).map((_, i) => (
          <path
            key={i}
            d={`M 40 ${65 + i * 60} Q 330 ${45 + i * 55} 620 ${65 + i * 60}`}
            fill="none"
            stroke={cyan}
            strokeWidth="3"
            strokeDasharray="12 14"
            strokeDashoffset={-f * 3.5}
            opacity={0.35 + 0.3 * Math.sin((f + i * 18) / 10)}
          />
        ))}

        {/* Center Focal Hub */}
        <g transform={`translate(330 190) scale(${1 + 0.04 * Math.sin(f / 12)})`}>
          <circle r="72" fill="#0F172A" stroke={indigo} strokeWidth="3" />
          <circle r="86" fill="none" stroke={amber} strokeWidth="2.5" strokeDasharray="6 6" />
          <text x="0" y="8" textAnchor="middle" fontSize="22" fontWeight="800" fill={ink}>
            {centerLabel.slice(0, 14)}
          </text>

          {/* Directional Force Arrows */}
          <g opacity={0.3 + 0.7 * animProgress}>
            <line x1="0" y1="-86" x2="0" y2="-150" stroke={amber} strokeWidth="6" strokeLinecap="round" />
            <polygon points="0,-165 -9,-145 9,-145" fill={amber} />
            <rect x="18" y="-160" width="130" height="34" rx="10" fill={amber} />
            <text x="83" y="-138" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="800">
              {forceLabel.slice(0, 14)}
            </text>
          </g>
        </g>
      </g>

      {/* Headline & Takeaway Card */}
      <rect
        x="70"
        y="500"
        width="720"
        height="145"
        rx="24"
        fill={cuePassed ? "rgba(99, 102, 241, 0.22)" : slateCardBg}
        stroke={cuePassed ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.1)"}
        strokeWidth="1.5"
      />
      <text x="430" y="546" textAnchor="middle" fontSize="28" fontWeight="800" fill={ink}>
        {headline}
      </text>
      <text x="430" y="588" textAnchor="middle" fontSize="19" fontWeight="600" fill={cyan}>
        Dynamic physical interaction governed by topic principles
      </text>
      <text x="430" y="622" textAnchor="middle" fontSize="15" fontWeight="500" fill={subtext}>
        {vectors[0]?.name ? `Focus: ${vectors[0].name}` : "Universal reactive diagram"}
      </text>
    </>
  );
}
