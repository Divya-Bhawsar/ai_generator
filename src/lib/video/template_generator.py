#!/usr/bin/env python3
"""HTML5/CSS3/SVG Frame Generator for VidyaMotion Explainer Videos.

Generates high-resolution (1080x1920) modern glassmorphic motion graphic frames with:
- Unified visual identity and continuous narrative stepper across all scenes
- Realistic, domain-aware visualizations (Algorithm Array Eliminator, Science Gauges, Real Scenarios)
- Zero generic placeholder buzzwords
- Deep midnight backdrop with ambient glowing orbs
- Frosted glass cards with glowing borders
- Captured via headless Google Chrome into pixel-perfect PNGs
"""
from __future__ import annotations

import html as html_lib
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def clean_text(s: str) -> str:
    return html_lib.escape(str(s).strip())

def generate_scene_html(scene: dict, index: int, total_scenes: int, topic: str = "") -> str:
    title = clean_text(scene.get("title", f"Scene {index}"))
    visual_type = str(scene.get("visualType") or scene.get("visual_type") or "concept").lower()
    visual_label = clean_text(scene.get("visualLabel") or scene.get("visual_label") or "")
    accent_words = [clean_text(w) for w in (scene.get("accentWords") or scene.get("accent_words") or [])]
    topic_clean = clean_text(topic or "Educational Explainer")
    narration = str(scene.get("narration", "")).strip()

    # Unified brand color scheme across entire video for visual continuity
    primary_color = "#38BDF8"      # Electric Cyan
    secondary_color = "#60A5FA"    # Neon Sky Blue
    accent_emerald = "#10B981"     # Emerald Green
    accent_amber = "#F59E0B"       # Warm Amber
    accent_rose = "#F43F5E"        # Rose Pink
    glow_color = "rgba(56, 189, 248, 0.22)"

    # Scene phase name for narrative cohesion
    phase_names = [
        "1. The Core Hook",
        "2. The Hidden Principle",
        "3. Step-by-Step Action",
        "4. Practical Contrast",
        "5. Mastered Takeaway",
        "6. Summary",
    ]
    phase_label = phase_names[min(index - 1, len(phase_names) - 1)]

    # Segmented Narrative Stepper HTML (shows progress across scenes)
    stepper_html = ""
    for s_idx in range(1, total_scenes + 1):
        if s_idx < index:
            stepper_html += '<div class="step-segment step-done"></div>'
        elif s_idx == index:
            stepper_html += f'<div class="step-segment step-active"><span class="step-dot"></span></div>'
        else:
            stepper_html += '<div class="step-segment step-todo"></div>'

    # Accent tags HTML
    accent_tags_html = "".join(
        f'<span class="accent-tag">#{w}</span>' for w in accent_words
    )

    combined_text = (narration + " " + topic + " " + title).lower()
    is_algo = bool(re.search(r"binary|search|array|sort|index|algorithm|pointer|target|element", combined_text))
    is_cooking = bool(re.search(r"cook|pressure|pot|boil|heat|temperature|steam|degree|100|121", combined_text))
    is_nature = bool(re.search(r"leaf|leaves|autumn|tree|color|chlorophyll|carotenoid|sunlight|plant", combined_text))

    # 1. ALGORITHM / ARRAY SEARCH DOMAIN (e.g. Binary Search)
    if is_algo:
        # Standard test dataset for visual demonstration
        arr_values = [3, 8, 14, 27, 39, 52, 68, 91]
        target_val = 52

        if index == 1:
            # Scene 1: Initial Array with Target Badge
            cells_html = "".join(
                f'<div class="algo-cell cell-normal"><span class="cell-idx">[{i}]</span><span class="cell-val">{v}</span></div>'
                for i, v in enumerate(arr_values)
            )
            diagram_html = f"""
            <div class="card-interior">
                <div class="phase-badge badge-algo">
                    <span>🎯 TARGET NUMBER = {target_val}</span>
                </div>
                <div class="array-container">
                    <div class="array-strip">
                        {cells_html}
                    </div>
                    <div class="pointer-track">
                        <span class="ptr-tag">▲ LOW (Idx 0)</span>
                        <span class="ptr-line"></span>
                        <span class="ptr-tag">▲ HIGH (Idx 7)</span>
                    </div>
                </div>
                <div class="scene-summary-box">
                    <p class="scene-summary-text">{visual_label}</p>
                </div>
            </div>
            """
        elif index == 2:
            # Scene 2: Middle Element Check
            cells_html = ""
            for i, v in enumerate(arr_values):
                if i == 3:  # Middle element 27
                    cells_html += f'<div class="algo-cell cell-mid"><span class="cell-idx">MID</span><span class="cell-val">{v}</span></div>'
                else:
                    cells_html += f'<div class="algo-cell cell-normal"><span class="cell-idx">[{i}]</span><span class="cell-val">{v}</span></div>'
            diagram_html = f"""
            <div class="card-interior">
                <div class="phase-badge badge-compare">
                    <span>🔍 MID CHECK: 52 &gt; 27</span>
                </div>
                <div class="array-container">
                    <div class="array-strip">
                        {cells_html}
                    </div>
                    <div class="decision-box">
                        <span class="decision-val">Target 52 is Greater than Mid 27</span>
                        <span class="decision-sub">➡ Answer must be in the right half!</span>
                    </div>
                </div>
                <div class="scene-summary-box">
                    <p class="scene-summary-text">{visual_label}</p>
                </div>
            </div>
            """
        elif index == 3:
            # Scene 3: Eliminating the Left Half!
            cells_html = ""
            for i, v in enumerate(arr_values):
                if i <= 3:  # Left half eliminated
                    cells_html += f'<div class="algo-cell cell-eliminated"><span class="cell-idx">CUT</span><span class="cell-val">{v}</span></div>'
                else:
                    cells_html += f'<div class="algo-cell cell-active"><span class="cell-idx">[{i}]</span><span class="cell-val">{v}</span></div>'
            diagram_html = f"""
            <div class="card-interior">
                <div class="phase-badge badge-warning">
                    <span>✂ 50% SEARCH SPACE DISCARDED</span>
                </div>
                <div class="array-container">
                    <div class="array-strip">
                        {cells_html}
                    </div>
                    <div class="decision-box" style="border-color: rgba(244, 63, 94, 0.4); background: rgba(244, 63, 94, 0.1);">
                        <span class="decision-val" style="color: #FB7185;">[3, 8, 14, 27] Eliminated in 1 Step!</span>
                        <span class="decision-sub">Remaining active search window: [39, 52, 68, 91]</span>
                    </div>
                </div>
                <div class="scene-summary-box">
                    <p class="scene-summary-text">{visual_label}</p>
                </div>
            </div>
            """
        elif index == 4:
            # Scene 4: Match Found!
            cells_html = ""
            for i, v in enumerate(arr_values):
                if v == target_val:
                    cells_html += f'<div class="algo-cell cell-found"><span class="cell-idx">MATCH!</span><span class="cell-val">{v}</span></div>'
                elif i <= 3:
                    cells_html += f'<div class="algo-cell cell-eliminated"><span class="cell-idx">CUT</span><span class="cell-val">{v}</span></div>'
                else:
                    cells_html += f'<div class="algo-cell cell-normal"><span class="cell-idx">[{i}]</span><span class="cell-val">{v}</span></div>'
            diagram_html = f"""
            <div class="card-interior">
                <div class="phase-badge badge-success">
                    <span>✓ TARGET FOUND IN 2 COMPARISONS</span>
                </div>
                <div class="array-container">
                    <div class="array-strip">
                        {cells_html}
                    </div>
                    <div class="decision-box" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.15);">
                        <span class="decision-val" style="color: #34D399;">Target 52 Matched at Index 5!</span>
                        <span class="decision-sub">Found in 2 operations instead of 6 linear checks</span>
                    </div>
                </div>
                <div class="scene-summary-box">
                    <p class="scene-summary-text">{visual_label}</p>
                </div>
            </div>
            """
        else:
            # Scene 5: Scale & Complexity Takeaway
            diagram_html = f"""
            <div class="card-interior">
                <div class="phase-badge badge-success">
                    <span>⚡ O(LOG N) LOGARITHMIC POWER</span>
                </div>
                <div class="comparison-grid">
                    <div class="compare-col col-left">
                        <span class="col-badge">LINEAR SCAN</span>
                        <div class="col-title" style="color: #FB7185;">1,000,000</div>
                        <div class="stat-bar-dim">
                            <div class="stat-fill-dim" style="width: 100%; background: #F43F5E;"></div>
                        </div>
                        <p class="col-desc">Checks every element one-by-one</p>
                    </div>
                    <div class="compare-col col-right">
                        <span class="col-badge active-col-badge">BINARY SEARCH</span>
                        <div class="col-title" style="color: #38BDF8;">20 CHECKS</div>
                        <div class="stat-bar-bright">
                            <div class="stat-fill-bright" style="width: 100%; background: linear-gradient(90deg, #38BDF8, #10B981);"></div>
                        </div>
                        <p class="col-desc">Finds any record in 1 million items in 20 steps</p>
                    </div>
                </div>
                <div class="scene-summary-box">
                    <p class="scene-summary-text">{visual_label}</p>
                </div>
            </div>
            """

    # 2. KITCHEN PHYSICS / THERMODYNAMICS (e.g. Pressure Cooker)
    elif is_cooking:
        if index == 1:
            diagram_html = f"""
            <div class="card-interior">
                <div class="phase-badge badge-warning">
                    <span>⚠ OPEN POT BOILING LIMIT</span>
                </div>
                <div class="gauge-display">
                    <div class="gauge-val" style="color: #FB7185;">100°C</div>
                    <div class="gauge-label">Maximum Water Temperature in Open Pot</div>
                </div>
                <div class="decision-box">
                    <span class="decision-val">Extra heat escapes as steam into the air</span>
                    <span class="decision-sub">Water cannot get any hotter, slowing cooking times</span>
                </div>
                <div class="scene-summary-box">
                    <p class="scene-summary-text">{visual_label}</p>
                </div>
            </div>
            """
        elif index == 2 or index == 3:
            diagram_html = f"""
            <div class="card-interior">
                <div class="phase-badge badge-algo">
                    <span>⚡ ELEVATED BOILING POINT</span>
                </div>
                <div class="comparison-grid">
                    <div class="compare-col col-left">
                        <span class="col-badge">OPEN POT</span>
                        <div class="col-title">100°C</div>
                        <div class="stat-bar-dim">
                            <div class="stat-fill-dim" style="width: 70%;"></div>
                        </div>
                        <p class="col-desc">1 Atmosphere of atmospheric pressure</p>
                    </div>
                    <div class="compare-col col-right">
                        <span class="col-badge active-col-badge">SEALED COOKER</span>
                        <div class="col-title" style="color: #38BDF8;">121°C (+21°)</div>
                        <div class="stat-bar-bright">
                            <div class="stat-fill-bright" style="width: 95%;"></div>
                        </div>
                        <p class="col-desc">2 Atmospheres of intense steam pressure</p>
                    </div>
                </div>
                <div class="scene-summary-box">
                    <p class="scene-summary-text">{visual_label}</p>
                </div>
            </div>
            """
        else:
            diagram_html = f"""
            <div class="card-interior">
                <div class="phase-badge badge-success">
                    <span>✓ 70% FASTER COOKING</span>
                </div>
                <div class="comparison-grid">
                    <div class="compare-col col-left">
                        <span class="col-badge">OPEN SIMMER</span>
                        <div class="col-title" style="color: #FB7185;">55 MINS</div>
                        <div class="stat-bar-dim">
                            <div class="stat-fill-dim" style="width: 100%; background: #F43F5E;"></div>
                        </div>
                        <p class="col-desc">Slow heat penetration for tough legumes</p>
                    </div>
                    <div class="compare-col col-right">
                        <span class="col-badge active-col-badge">PRESSURE COOKER</span>
                        <div class="col-title" style="color: #10B981;">14 MINS</div>
                        <div class="stat-bar-bright">
                            <div class="stat-fill-bright" style="width: 25%; background: #10B981;"></div>
                        </div>
                        <p class="col-desc">Superheated steam cuts cooking time by 70%</p>
                    </div>
                </div>
                <div class="scene-summary-box">
                    <p class="scene-summary-text">{visual_label}</p>
                </div>
            </div>
            """

    # 3. NATURE & BIOLOGY (e.g. Autumn Leaves / Chlorophyll)
    elif is_nature:
        diagram_html = f"""
        <div class="card-interior">
            <div class="phase-badge badge-algo">
                <span>🍃 PIGMENT REVELATION</span>
            </div>
            <div class="comparison-grid">
                <div class="compare-col col-left">
                    <span class="col-badge">SUMMER</span>
                    <div class="col-title" style="color: #10B981;">CHLOROPHYLL</div>
                    <div class="stat-bar-dim">
                        <div class="stat-fill-dim" style="width: 100%; background: #10B981;"></div>
                    </div>
                    <p class="col-desc">Green pigment masks yellow & orange pigments</p>
                </div>
                <div class="compare-col col-right">
                    <span class="col-badge active-col-badge">AUTUMN</span>
                    <div class="col-title" style="color: #F59E0B;">CAROTENOIDS</div>
                    <div class="stat-bar-bright">
                        <div class="stat-fill-bright" style="width: 100%; background: linear-gradient(90deg, #F59E0B, #EF4444);"></div>
                    </div>
                    <p class="col-desc">Green fades away, revealing hidden gold & red</p>
                </div>
            </div>
            <div class="scene-summary-box">
                <p class="scene-summary-text">{visual_label}</p>
            </div>
        </div>
        """

    # 4. DEFAULT DYNAMIC PEDAGOGICAL CARDS (Context-derived, zero robotic buzzwords)
    elif visual_type in ("comparison", "bars"):
        l_label = accent_words[0].upper() if len(accent_words) > 0 else "CONVENTIONAL METHOD"
        r_label = accent_words[1].upper() if len(accent_words) > 1 else "OPTIMIZED PRINCIPLE"
        diagram_html = f"""
        <div class="card-interior">
            <div class="phase-badge badge-compare">
                <span>⚖️ CORE COMPARISON</span>
            </div>
            <div class="comparison-grid">
                <div class="compare-col col-left">
                    <span class="col-badge">STANDARD APPROACH</span>
                    <div class="col-title">{l_label}</div>
                    <div class="stat-bar-dim">
                        <div class="stat-fill-dim" style="width: 45%;"></div>
                    </div>
                    <p class="col-desc">High friction & repetitive manual effort</p>
                </div>
                <div class="compare-col col-right">
                    <span class="col-badge active-col-badge">TARGET MECHANISM</span>
                    <div class="col-title" style="color: {primary_color};">{r_label}</div>
                    <div class="stat-bar-bright">
                        <div class="stat-fill-bright" style="width: 95%;"></div>
                    </div>
                    <p class="col-desc">Direct execution delivering predictable velocity</p>
                </div>
            </div>
            <div class="scene-summary-box">
                <p class="scene-summary-text">{visual_label}</p>
            </div>
        </div>
        """
    elif visual_type in ("flow", "process_steps"):
        s1 = accent_words[0].upper() if len(accent_words) > 0 else "START"
        s2 = accent_words[1].upper() if len(accent_words) > 1 else "CORE SHIFT"
        s3 = accent_words[2].upper() if len(accent_words) > 2 else "OUTCOME"
        diagram_html = f"""
        <div class="card-interior">
            <div class="phase-badge badge-algo">
                <span>⚡ STEP-BY-STEP SEQUENCE</span>
            </div>
            <div class="flow-row">
                <div class="flow-card">
                    <div class="flow-num">01</div>
                    <div class="flow-title">{s1}</div>
                </div>
                <div class="flow-arrow">➔</div>
                <div class="flow-card flow-active">
                    <div class="flow-num active-num">02</div>
                    <div class="flow-title" style="color: {primary_color};">{s2}</div>
                </div>
                <div class="flow-arrow">➔</div>
                <div class="flow-card">
                    <div class="flow-num">03</div>
                    <div class="flow-title">{s3}</div>
                </div>
            </div>
            <div class="scene-summary-box">
                <p class="scene-summary-text">{visual_label}</p>
            </div>
        </div>
        """
    elif visual_type == "takeaway":
        sentences = [s.strip() for s in re.split(r"[.!?]", narration) if len(s.strip()) > 10]
        b1 = clean_text(sentences[0]) if len(sentences) > 0 else f"Understanding {title} provides instant clarity"
        b2 = clean_text(sentences[1]) if len(sentences) > 1 else "Turns confusing friction into a clear mental model"
        b3 = clean_text(sentences[2]) if len(sentences) > 2 else "Predictable results every single time"
        diagram_html = f"""
        <div class="card-interior takeaway-style">
            <div class="phase-badge badge-success">
                <span class="check-mark">✓</span>
                <span>CORE CONCEPT MASTERED</span>
            </div>
            <div class="takeaway-list">
                <div class="takeaway-item">
                    <span class="item-check">✓</span>
                    <span>{b1}</span>
                </div>
                <div class="takeaway-item">
                    <span class="item-check">✓</span>
                    <span>{b2}</span>
                </div>
                <div class="takeaway-item">
                    <span class="item-check">✓</span>
                    <span>{b3}</span>
                </div>
            </div>
        </div>
        """
    else:
        # Default concept HUD centerpiece
        node_1 = accent_words[0] if len(accent_words) > 0 else "Trigger"
        node_2 = accent_words[1] if len(accent_words) > 1 else "Mechanism"
        node_3 = accent_words[2] if len(accent_words) > 2 else "Result"
        diagram_html = f"""
        <div class="card-interior">
            <div class="phase-badge badge-algo">
                <span>💡 CONCEPT OVERVIEW</span>
            </div>
            <div class="concept-center">
                <div class="radar-outer">
                    <div class="radar-core">
                        <span>★</span>
                    </div>
                </div>
                <div class="satellite-tags">
                    <span class="sat-node">● {node_1}</span>
                    <span class="sat-node active-node">● {node_2}</span>
                    <span class="sat-node">● {node_3}</span>
                </div>
            </div>
            <div class="scene-summary-box">
                <p class="scene-summary-text">{visual_label}</p>
            </div>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    * {{
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }}
    body {{
        width: 1080px;
        height: 1920px;
        background: #080C16;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #F8FAFC;
        overflow: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
        justifyContent: flex-start;
        padding: 130px 70px 0;
    }}

    /* Ambient Cinematic Glowing Lights */
    .ambient-orb-1 {{
        position: absolute;
        top: 200px;
        left: -120px;
        width: 550px;
        height: 550px;
        background: {primary_color};
        filter: blur(160px);
        opacity: 0.18;
        border-radius: 50%;
        z-index: 1;
    }}
    .ambient-orb-2 {{
        position: absolute;
        top: 550px;
        right: -130px;
        width: 600px;
        height: 600px;
        background: {secondary_color};
        filter: blur(170px);
        opacity: 0.14;
        border-radius: 50%;
        z-index: 1;
    }}

    /* Subtle Grid Background */
    .bg-grid {{
        position: absolute;
        inset: 0;
        background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        background-size: 54px 54px;
        z-index: 2;
    }}

    /* Content Box */
    .content-box {{
        position: relative;
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: 28px;
    }}

    /* Top Series & Topic Banner */
    .top-series-bar {{
        display: flex;
        justifyContent: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }}
    .series-title {{
        font-size: 20px;
        font-weight: 800;
        color: #94A3B8;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }}
    .phase-indicator {{
        font-size: 19px;
        font-weight: 700;
        color: {primary_color};
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }}

    /* Segmented Narrative Stepper */
    .stepper-container {{
        display: flex;
        gap: 10px;
        width: 100%;
        align-items: center;
    }}
    .step-segment {{
        flex: 1;
        height: 8px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.08);
        position: relative;
    }}
    .step-done {{
        background: rgba(56, 189, 248, 0.45);
    }}
    .step-active {{
        background: {primary_color};
        box-shadow: 0 0 16px {primary_color};
    }}
    .step-dot {{
        position: absolute;
        right: 0;
        top: -4px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #FFFFFF;
        box-shadow: 0 0 10px #FFFFFF;
    }}

    /* Scene Headline */
    .scene-headline-box {{
        display: flex;
        flex-direction: column;
        gap: 8px;
    }}
    .scene-number-tag {{
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 0.1em;
        color: {secondary_color};
        text-transform: uppercase;
    }}
    .scene-title {{
        font-size: 54px;
        font-weight: 800;
        line-height: 1.18;
        color: #FFFFFF;
        letter-spacing: -0.02em;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
    }}

    /* Frosted Glass Centerpiece Card */
    .glass-card {{
        background: rgba(15, 23, 42, 0.75);
        border: 2px solid rgba(255, 255, 255, 0.12);
        border-radius: 32px;
        padding: 40px;
        backdrop-filter: blur(35px);
        box-shadow: 0 25px 70px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        display: flex;
        flex-direction: column;
        gap: 28px;
    }}

    .card-interior {{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        width: 100%;
        text-align: center;
    }}

    /* Phase Badges */
    .phase-badge {{
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 24px;
        border-radius: 20px;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }}
    .badge-algo {{
        background: rgba(56, 189, 248, 0.12);
        color: {primary_color};
        border: 1px solid rgba(56, 189, 248, 0.4);
    }}
    .badge-warning {{
        background: rgba(244, 63, 94, 0.12);
        color: #FB7185;
        border: 1px solid rgba(244, 63, 94, 0.4);
    }}
    .badge-compare {{
        background: rgba(245, 158, 11, 0.12);
        color: #FBBF24;
        border: 1px solid rgba(245, 158, 11, 0.4);
    }}
    .badge-success {{
        background: rgba(16, 185, 129, 0.15);
        color: #34D399;
        border: 1px solid rgba(16, 185, 129, 0.4);
    }}

    /* Array Container & Cells */
    .array-container {{
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
        align-items: center;
    }}
    .array-strip {{
        display: flex;
        gap: 10px;
        justify-content: center;
        width: 100%;
        flex-wrap: wrap;
    }}
    .algo-cell {{
        width: 100px;
        height: 110px;
        border-radius: 16px;
        background: rgba(30, 41, 59, 0.85);
        border: 2px solid rgba(255, 255, 255, 0.12);
        display: flex;
        flex-direction: column;
        align-items: center;
        justifyContent: center;
        gap: 6px;
        transition: all 0.2s ease;
    }}
    .cell-idx {{
        font-size: 14px;
        color: #94A3B8;
        font-weight: 700;
    }}
    .cell-val {{
        font-size: 34px;
        font-weight: 900;
        color: #FFFFFF;
    }}
    .cell-mid {{
        border-color: #FBBF24;
        background: rgba(245, 158, 11, 0.18);
        box-shadow: 0 0 25px rgba(245, 158, 11, 0.35);
    }}
    .cell-mid .cell-idx {{
        color: #FBBF24;
    }}
    .cell-active {{
        border-color: {primary_color};
        background: rgba(56, 189, 248, 0.2);
        box-shadow: 0 0 20px {glow_color};
    }}
    .cell-active .cell-idx {{
        color: {primary_color};
    }}
    .cell-eliminated {{
        opacity: 0.35;
        border-color: rgba(244, 63, 94, 0.3);
        background: rgba(244, 63, 94, 0.08);
        position: relative;
    }}
    .cell-eliminated::after {{
        content: "";
        position: absolute;
        width: 80%;
        height: 3px;
        background: #F43F5E;
        transform: rotate(45deg);
    }}
    .cell-found {{
        border-color: #10B981;
        background: rgba(16, 185, 129, 0.25);
        box-shadow: 0 0 35px rgba(16, 185, 129, 0.45);
    }}
    .cell-found .cell-idx {{
        color: #34D399;
    }}
    .cell-found .cell-val {{
        color: #34D399;
    }}

    .pointer-track {{
        display: flex;
        justifyContent: space-between;
        align-items: center;
        width: 100%;
        padding: 4px 10px;
    }}
    .ptr-tag {{
        font-size: 16px;
        font-weight: 800;
        color: {primary_color};
        letter-spacing: 0.04em;
    }}
    .ptr-line {{
        flex: 1;
        height: 2px;
        background: rgba(56, 189, 248, 0.3);
        margin: 0 16px;
    }}

    .decision-box {{
        width: 100%;
        padding: 16px 20px;
        background: rgba(56, 189, 248, 0.08);
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }}
    .decision-val {{
        font-size: 24px;
        font-weight: 800;
        color: #F8FAFC;
    }}
    .decision-sub {{
        font-size: 18px;
        color: #94A3B8;
        font-weight: 600;
    }}

    /* Gauge Display */
    .gauge-display {{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }}
    .gauge-val {{
        font-size: 88px;
        font-weight: 900;
        text-shadow: 0 0 45px rgba(244, 63, 94, 0.4);
    }}
    .gauge-label {{
        font-size: 22px;
        font-weight: 600;
        color: #CBD5E1;
    }}

    /* Comparison Grid */
    .comparison-grid {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 22px;
        width: 100%;
        text-align: left;
    }}
    .compare-col {{
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 28px 22px;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }}
    .col-right {{
        background: rgba(30, 41, 59, 0.95);
        border: 2px solid {primary_color};
        box-shadow: 0 0 30px {glow_color};
    }}
    .col-badge {{
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 0.06em;
        padding: 6px 14px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.08);
        color: #94A3B8;
        align-self: flex-start;
    }}
    .active-col-badge {{
        background: {primary_color};
        color: #080C16;
    }}
    .col-title {{
        font-size: 32px;
        font-weight: 800;
        color: #F8FAFC;
    }}
    .stat-bar-dim, .stat-bar-bright {{
        width: 100%;
        height: 12px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
    }}
    .stat-fill-dim {{
        height: 100%;
        background: #64748B;
    }}
    .stat-fill-bright {{
        height: 100%;
        background: linear-gradient(90deg, {primary_color}, {secondary_color});
    }}
    .col-desc {{
        font-size: 18px;
        color: #CBD5E1;
        line-height: 1.4;
    }}

    /* Flow Row */
    .flow-row {{
        display: flex;
        align-items: center;
        justifyContent: space-between;
        width: 100%;
        gap: 14px;
    }}
    .flow-card {{
        flex: 1;
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 18px;
        padding: 24px 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }}
    .flow-active {{
        background: rgba(30, 41, 59, 0.95);
        border: 2px solid {primary_color};
        box-shadow: 0 0 25px {glow_color};
    }}
    .flow-num {{
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justifyContent: center;
        font-weight: 800;
        font-size: 18px;
        color: #CBD5E1;
    }}
    .active-num {{
        background: {primary_color};
        color: #080C16;
    }}
    .flow-title {{
        font-size: 19px;
        font-weight: 800;
        letter-spacing: 0.04em;
        color: #F8FAFC;
    }}
    .flow-arrow {{
        font-size: 26px;
        color: #64748B;
    }}

    /* Takeaway List */
    .takeaway-list {{
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
        text-align: left;
    }}
    .takeaway-item {{
        display: flex;
        align-items: flex-start;
        gap: 16px;
        font-size: 24px;
        line-height: 1.4;
        color: #E2E8F0;
        background: rgba(255, 255, 255, 0.04);
        padding: 16px 20px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }}
    .item-check {{
        color: {primary_color};
        font-size: 26px;
        font-weight: 900;
    }}

    /* Concept Centerpiece */
    .concept-center {{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
    }}
    .radar-outer {{
        width: 190px;
        height: 190px;
        border-radius: 50%;
        border: 2px dashed rgba(56, 189, 248, 0.4);
        display: flex;
        align-items: center;
        justifyContent: center;
    }}
    .radar-core {{
        width: 110px;
        height: 110px;
        border-radius: 50%;
        background: radial-gradient(circle, {secondary_color} 0%, {primary_color} 80%);
        display: flex;
        align-items: center;
        justifyContent: center;
        font-size: 32px;
        font-weight: 900;
        color: #080C16;
        box-shadow: 0 0 35px {glow_color};
    }}
    .satellite-tags {{
        display: flex;
        gap: 12px;
    }}
    .sat-node {{
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.04);
        border-radius: 20px;
        padding: 8px 18px;
        font-size: 18px;
        font-weight: 700;
        color: #CBD5E1;
    }}
    .active-node {{
        border-color: {primary_color};
        color: {primary_color};
        background: rgba(56, 189, 248, 0.1);
    }}

    /* Scene Summary Box */
    .scene-summary-box {{
        width: 100%;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 16px 20px;
    }}
    .scene-summary-text {{
        font-size: 24px;
        line-height: 1.45;
        color: #CBD5E1;
        font-weight: 500;
    }}

    /* Accent Keywords Row */
    .accents-row {{
        display: flex;
        justifyContent: center;
        gap: 12px;
        flex-wrap: wrap;
    }}
    .accent-tag {{
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 19px;
        font-weight: 700;
        color: {primary_color};
    }}
</style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="ambient-orb-1"></div>
    <div class="ambient-orb-2"></div>

    <div class="content-box">
        <!-- Top Series & Narrative Stepper -->
        <div class="top-series-bar">
            <span class="series-title">VIDYAMOTION • {topic_clean}</span>
            <span class="phase-indicator">{phase_label}</span>
        </div>

        <div class="stepper-container">
            {stepper_html}
        </div>

        <!-- Scene Title -->
        <div class="scene-headline-box">
            <div class="scene-number-tag">SCENE {index:02d} / {total_scenes:02d}</div>
            <h1 class="scene-title">{title}</h1>
        </div>

        <!-- Glassmorphic Context Card -->
        <div class="glass-card">
            {diagram_html}

            {f'<div class="accents-row">{accent_tags_html}</div>' if accent_tags_html else ''}
        </div>
    </div>
</body>
</html>"""
    return html

def render_html_to_png(html_content: str, output_png: Path) -> Path:
    temp_html = output_png.with_suffix(".html")
    temp_html.write_text(html_content, encoding="utf-8")

    tmp_profile = tempfile.mkdtemp(prefix="chrome_shot_")

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        f"--user-data-dir={tmp_profile}",
        f"--screenshot={str(output_png.resolve())}",
        "--window-size=1080,1920",
        "--default-background-color=000000",
        f"file://{str(temp_html.resolve())}",
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
    finally:
        temp_html.unlink(missing_ok=True)
        shutil.rmtree(tmp_profile, ignore_errors=True)

    return output_png
