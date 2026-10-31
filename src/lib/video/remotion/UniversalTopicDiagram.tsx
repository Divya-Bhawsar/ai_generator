import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TimedScene } from "./contracts";

const ink = "#153c3a";
const teal = "#168779";
const orange = "#e9a64d";
const blue = "#3a7f9e";

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
        <rect x="260" y="25" width="340" height="44" rx="22" fill="#dbe9e6" stroke="#b6d5ce" strokeWidth="1.5" />
        <text x="430" y="53" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="3" fill={teal}>
          {badge}
        </text>

        {/* Two Cinema Cards */}
        <g transform="translate(45 90)">
          {/* Left Card */}
          <g opacity={reveal(f, 6)} transform={`translate(0 ${(1 - reveal(f, 6)) * 14})`}>
            <rect width="365" height="420" rx="26" fill="#dbe9e6" stroke="#bfd4cf" strokeWidth="2" />
            <rect x="24" y="28" width="50" height="7" rx="3.5" fill={teal} />
            <text x="24" y="78" fontSize="26" fontWeight="700" fill={ink}>
              {leftTitle.slice(0, 22)}
            </text>
            <line x1="24" y1="98" x2="341" y2="98" stroke="#bccfc8" strokeWidth="1.5" />

            {leftPoints.slice(0, 3).map((pt, j) => {
              const show = reveal(f, scene.cueFrame + j * 14);
              return (
                <g key={j} opacity={show} transform={`translate(0 ${(1 - show) * 10})`}>
                  <circle cx="34" cy={140 + j * 85} r="6" fill={teal} />
                  <text x="52" y={146 + j * 85} fill={ink} fontSize="21" fontWeight="500">
                    {pt.length > 25 ? pt.slice(0, 24) + "…" : pt}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Right Card */}
          <g opacity={reveal(f, 14)} transform={`translate(405 ${(1 - reveal(f, 14)) * 14})`}>
            <rect width="365" height="420" rx="26" fill="#e8e5d9" stroke="#d7d0ba" strokeWidth="2" />
            <rect x="24" y="28" width="50" height="7" rx="3.5" fill={orange} />
            <text x="24" y="78" fontSize="26" fontWeight="700" fill={ink}>
              {rightTitle.slice(0, 22)}
            </text>
            <line x1="24" y1="98" x2="341" y2="98" stroke="#bccfc8" strokeWidth="1.5" />

            {rightPoints.slice(0, 3).map((pt, j) => {
              const show = reveal(f, scene.cueFrame + 18 + j * 14);
              return (
                <g key={j} opacity={show} transform={`translate(0 ${(1 - show) * 10})`}>
                  <circle cx="34" cy={140 + j * 85} r="6" fill={orange} />
                  <text x="52" y={146 + j * 85} fill={ink} fontSize="21" fontWeight="500">
                    {pt.length > 25 ? pt.slice(0, 24) + "…" : pt}
                  </text>
                </g>
              );
            })}
          </g>
        </g>

        {/* Bottom Headline Banner */}
        <rect x="70" y="540" width="720" height="110" rx="24" fill={cuePassed ? "#cfe4db" : "#ffffff90"} stroke={cuePassed ? teal : "#ced9d1"} strokeWidth="2" />
        <text x="430" y="585" textAnchor="middle" fontSize="26" fontWeight="700" fill={ink}>
          {headline}
        </text>
        <text x="430" y="622" textAnchor="middle" fontSize="19" fontWeight="600" fill={teal}>
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
        <rect x="260" y="25" width="340" height="44" rx="22" fill="#dbe9e6" stroke="#b6d5ce" strokeWidth="1.5" />
        <text x="430" y="53" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="3" fill={teal}>
          {badge}
        </text>

        {/* Circular Gauge / Radial Value Display */}
        <g transform="translate(430 240)">
          <circle r="150" fill="#fcfbf8" stroke="#ced9d1" strokeWidth="3" />
          <circle r="130" fill="none" stroke="#e0e8df" strokeWidth="14" />
          <circle
            r="130"
            fill="none"
            stroke={cuePassed ? orange : teal}
            strokeWidth="14"
            strokeDasharray="816"
            strokeDashoffset={816 - animProgress * 540}
            strokeLinecap="round"
            transform="rotate(135)"
          />

          {/* Metric Value & Unit */}
          <text x="0" y="-10" textAnchor="middle" fontSize={met.value && met.value.length > 5 ? 46 : 62} fontWeight="800" fill={ink}>
            {met.value || "100"}
            <tspan fontSize="32" fontWeight="600" fill={teal}>
              {met.unit ? ` ${met.unit}` : ""}
            </tspan>
          </text>

          <rect x="-110" y="30" width="220" height="38" rx="14" fill={ink} />
          <text x="0" y="55" textAnchor="middle" fontSize="15" fontWeight="700" fill="#ffffff" letterSpacing="1">
            {(met.label || headline || "KEY METRIC").toUpperCase().slice(0, 18)}
          </text>
          <text x="0" y="95" textAnchor="middle" fontSize="17" fontWeight="600" fill={cuePassed ? orange : "#6c827b"}>
            {met.subtext || "Observed physical threshold"}
          </text>
        </g>

        {/* Bottom Headline Card */}
        <rect x="70" y="470" width="720" height="155" rx="24" fill={cuePassed ? "#cfe4db" : "#ffffff90"} stroke={cuePassed ? teal : "#ced9d1"} strokeWidth="2" />
        <text x="430" y="525" textAnchor="middle" fontSize="28" fontWeight="700" fill={ink}>
          {headline}
        </text>
        <text x="430" y="570" textAnchor="middle" fontSize="21" fontWeight="600" fill={teal}>
          {met.subtext || "Measurable cause-and-effect transition"}
        </text>
        <text x="430" y="605" textAnchor="middle" fontSize="17" fontWeight="500" fill="#6c827b">
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
        <rect x="260" y="25" width="340" height="44" rx="22" fill="#dbe9e6" stroke="#b6d5ce" strokeWidth="1.5" />
        <text x="430" y="53" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="3" fill={teal}>
          {badge}
        </text>

        {/* 3 Step Pipeline Cards */}
        <g transform="translate(90 95)">
          {steps.map((st, i) => {
            const show = reveal(f, scene.cueFrame + i * 14);
            const y = i * 135;
            return (
              <g key={i} opacity={show} transform={`translate(${(1 - show) * -20} ${y})`}>
                <rect width="680" height="105" rx="22" fill={i % 2 === 0 ? "#dbe9e6" : "#e0e8df"} stroke="#ced9d1" strokeWidth="2" />
                <circle cx="55" cy="52" r="26" fill={teal} />
                <text x="55" y="60" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="800">
                  {st.step_number || i + 1}
                </text>
                <text x="105" y="48" fill={ink} fontSize="26" fontWeight="700">
                  {st.title}
                </text>
                {st.detail && (
                  <text x="105" y="78" fill="#475569" fontSize="18" fontWeight="500">
                    {st.detail}
                  </text>
                )}

                {/* Animated connector arrow */}
                {i < steps.length - 1 && (
                  <path
                    d={`M 340 108 L 340 130 M 333 123 L 340 130 L 347 123`}
                    fill="none"
                    stroke={teal}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Bottom Headline */}
        <rect x="70" y="530" width="720" height="110" rx="24" fill={cuePassed ? "#cfe4db" : "#ffffff90"} stroke={cuePassed ? teal : "#ced9d1"} strokeWidth="2" />
        <text x="430" y="575" textAnchor="middle" fontSize="26" fontWeight="700" fill={ink}>
          {headline}
        </text>
        <text x="430" y="612" textAnchor="middle" fontSize="19" fontWeight="600" fill={teal}>
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
        <rect x="260" y="25" width="340" height="44" rx="22" fill="#dbe9e6" stroke="#b6d5ce" strokeWidth="1.5" />
        <text x="430" y="53" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="3" fill={teal}>
          {badge}
        </text>

        {/* Main Orbital Track Frame */}
        <g transform="translate(430 270)">
          {/* Orbital Circle */}
          <circle r="150" fill="none" stroke="#ced9d1" strokeWidth="3" strokeDasharray="8 8" />

          {/* Circulating Orbiting Pulse Particles */}
          <g transform={`rotate(${f * 2.2})`}>
            <circle cx="150" cy="0" r="11" fill={teal} />
            <circle cx="-150" cy="0" r="11" fill={orange} />
            <circle cx="0" cy="150" r="7" fill={blue} opacity={0.8} />
            <circle cx="0" cy="-150" r="7" fill={blue} opacity={0.8} />
          </g>

          {/* Central Core Hub */}
          <circle r="72" fill="#fcfbf8" stroke={teal} strokeWidth="3" />
          <circle r="56" fill="#dbe9e6" />
          <text x="0" y="6" textAnchor="middle" fontSize="18" fontWeight="800" fill={ink}>
            {(d?.vector_system?.center_label || "FEEDBACK").slice(0, 12)}
          </text>
          <text x="0" y="24" textAnchor="middle" fontSize="12" fontWeight="700" fill={teal} letterSpacing="1">
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
                  fill={isActive ? orange : "#ffffff"}
                  stroke={isActive ? orange : teal}
                  strokeWidth={isActive ? "4" : "3"}
                />
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  fill={isActive ? "#ffffff" : ink}
                  fontSize="15"
                  fontWeight="700"
                >
                  {lbl.length > 10 ? lbl.slice(0, 9) + "…" : lbl}
                </text>
              </g>
            );
          })}
        </g>

        {/* Bottom Headline Banner */}
        <rect x="70" y="525" width="720" height="115" rx="24" fill={cuePassed ? "#cfe4db" : "#ffffff90"} stroke={cuePassed ? teal : "#ced9d1"} strokeWidth="2" />
        <text x="430" y="570" textAnchor="middle" fontSize="26" fontWeight="700" fill={ink}>
          {headline}
        </text>
        <text x="430" y="608" textAnchor="middle" fontSize="19" fontWeight="600" fill={teal}>
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
      <rect x="260" y="25" width="340" height="44" rx="22" fill="#dbe9e6" stroke="#b6d5ce" strokeWidth="1.5" />
      <text x="430" y="53" textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="3" fill={teal}>
        {badge}
      </text>

      {/* Main Vector Wind/Force Frame */}
      <g transform="translate(100 95)">
        <rect width="660" height="370" rx="28" fill="#fcfbf8" stroke="#ced9d1" strokeWidth="2" />

        {/* Streamlines / Field lines */}
        {Array.from({ length: 5 }).map((_, i) => (
          <path
            key={i}
            d={`M 40 ${65 + i * 60} Q 330 ${45 + i * 55} 620 ${65 + i * 60}`}
            fill="none"
            stroke={blue}
            strokeWidth="3"
            strokeDasharray="12 14"
            strokeDashoffset={-f * 3.5}
            opacity={0.35 + 0.3 * Math.sin((f + i * 18) / 10)}
          />
        ))}

        {/* Center Focal Hub */}
        <g transform={`translate(330 185) scale(${1 + 0.04 * Math.sin(f / 12)})`}>
          <circle r="72" fill="#dbe9e6" stroke={teal} strokeWidth="3" />
          <circle r="86" fill="none" stroke={orange} strokeWidth="2.5" strokeDasharray="6 6" />
          <text x="0" y="8" textAnchor="middle" fontSize="22" fontWeight="800" fill={ink}>
            {centerLabel.slice(0, 14)}
          </text>

          {/* Directional Force Arrows */}
          <g opacity={0.3 + 0.7 * animProgress}>
            <line x1="0" y1="-86" x2="0" y2="-150" stroke={orange} strokeWidth="6" strokeLinecap="round" />
            <polygon points="0,-165 -9,-145 9,-145" fill={orange} />
            <rect x="18" y="-160" width="130" height="34" rx="10" fill={orange} />
            <text x="83" y="-138" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="700">
              {forceLabel.slice(0, 14)}
            </text>
          </g>
        </g>
      </g>

      {/* Headline & Takeaway Card */}
      <rect x="70" y="495" width="720" height="145" rx="24" fill={cuePassed ? "#cfe4db" : "#ffffff90"} stroke={cuePassed ? teal : "#ced9d1"} strokeWidth="2" />
      <text x="430" y="542" textAnchor="middle" fontSize="28" fontWeight="700" fill={ink}>
        {headline}
      </text>
      <text x="430" y="584" textAnchor="middle" fontSize="20" fontWeight="600" fill={teal}>
        Dynamic physical interaction governed by topic principles
      </text>
      <text x="430" y="618" textAnchor="middle" fontSize="16" fontWeight="500" fill="#6c827b">
        {vectors[0]?.name ? `Focus: ${vectors[0].name}` : "Universal reactive diagram"}
      </text>
    </>
  );
}
