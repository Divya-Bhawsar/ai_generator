#!/usr/bin/env python3
"""HTML5/CSS3/SVG Frame Generator for VidyaMotion Explainer Videos.

Generates high-resolution (1080x1920) modern glassmorphic motion graphic frames with:
- Unified visual identity and continuous narrative stepper across all scenes
- Fully dynamic, context-aware diagrams powered by the actual scene data
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
    topic_clean = clean_text(topic or "Explainer Deep Dive")
    narration = str(scene.get("narration", "")).strip()

    # Unified brand color scheme across entire video for visual continuity
    primary_color = "#38BDF8"      # Electric Cyan
    secondary_color = "#60A5FA"    # Neon Sky Blue
    accent_gold = "#FBBF24"        # Highlight Amber
    glow_color = "rgba(56, 189, 248, 0.22)"

    # Scene phase name for narrative cohesion
    phase_names = [
        "Phase 1: The Bottleneck",
        "Phase 2: Core Architecture",
        "Phase 3: System Workflow",
        "Phase 4: Key Comparison",
        "Phase 5: Mastered Takeaway",
        "Phase 6: Conclusion",
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

    # Dynamic, context-driven diagrams based on actual scene content
    if visual_type in ("hook", "problem"):
        lead_stat = "KEY DILEMMA"
        metric_highlight = accent_words[0].upper() if accent_words else "BOTTLENECK"
        diagram_html = f"""
        <div class="card-interior hook-style">
            <div class="phase-badge badge-warning">
                <span class="warning-icon">⚠</span>
                <span>{lead_stat}: THE CORE FRICTION</span>
            </div>
            <div class="dynamic-focal-box">
                <div class="focal-headline">{metric_highlight}</div>
                <div class="focal-sub">Critical drag limiting velocity & team throughput</div>
            </div>
            <div class="meter-track">
                <div class="meter-bar" style="width: 78%;"></div>
            </div>
            <div class="scene-summary-box">
                <p class="scene-summary-text">{visual_label}</p>
            </div>
        </div>
        """
    elif visual_type in ("comparison", "bars"):
        left_label = accent_words[0].upper() if len(accent_words) > 0 else "CONVENTIONAL"
        right_label = accent_words[1].upper() if len(accent_words) > 1 else "OPTIMIZED"
        diagram_html = f"""
        <div class="card-interior">
            <div class="phase-badge badge-compare">
                <span>⚖️ ARCHITECTURAL COMPARISON</span>
            </div>
            <div class="comparison-grid">
                <div class="compare-col col-left">
                    <span class="col-badge">CONVENTIONAL</span>
                    <div class="col-title">{left_label}</div>
                    <div class="stat-bar-dim">
                        <div class="stat-fill-dim" style="width: 38%;"></div>
                    </div>
                    <p class="col-desc">Surface-level manual glue code & high friction</p>
                </div>
                <div class="compare-col col-right">
                    <span class="col-badge active-col-badge">NEXT-GENERATION</span>
                    <div class="col-title" style="color: {primary_color};">{right_label}</div>
                    <div class="stat-bar-bright">
                        <div class="stat-fill-bright" style="width: 95%;"></div>
                    </div>
                    <p class="col-desc">Autonomous multi-step execution & zero friction</p>
                </div>
            </div>
            <div class="scene-summary-box">
                <p class="scene-summary-text">{visual_label}</p>
            </div>
        </div>
        """
    elif visual_type in ("flow", "process_steps"):
        # Derive 3 steps from accent words or scene data
        s1 = accent_words[0].upper() if len(accent_words) > 0 else "INGESTION"
        s2 = accent_words[1].upper() if len(accent_words) > 1 else "REASONING"
        s3 = accent_words[2].upper() if len(accent_words) > 2 else "EXECUTION"
        diagram_html = f"""
        <div class="card-interior">
            <div class="phase-badge badge-process">
                <span>⚡ EXECUTION PIPELINE</span>
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
        # Extract sentence takeaways
        sentences = [s.strip() for s in re.split(r"[.!?]", narration) if len(s.strip()) > 10]
        b1 = clean_text(sentences[0]) if len(sentences) > 0 else "Lifts developer friction into effortless flow"
        b2 = clean_text(sentences[1]) if len(sentences) > 1 else "Autonomous end-to-end task delegation"
        b3 = clean_text(sentences[2]) if len(sentences) > 2 else "10x shipping velocity without cognitive drag"
        diagram_html = f"""
        <div class="card-interior takeaway-style">
            <div class="phase-badge badge-takeaway">
                <span class="check-mark">✓</span>
                <span>CORE LESSON MASTERED</span>
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
        node_1 = accent_words[0] if len(accent_words) > 0 else "Core Engine"
        node_2 = accent_words[1] if len(accent_words) > 1 else "Semantic Graph"
        node_3 = accent_words[2] if len(accent_words) > 2 else "Agent Logic"
        diagram_html = f"""
        <div class="card-interior">
            <div class="phase-badge badge-concept">
                <span>💡 ARCHITECTURE OVERVIEW</span>
            </div>
            <div class="concept-center">
                <div class="radar-outer">
                    <div class="radar-core">
                        <span>AI</span>
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

    /* Ambient Cinematic Glowing Lights (Consistent across all scenes) */
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

    /* Segmented Narrative Stepper (Keeps context unified across scenes) */
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
        font-size: 58px;
        font-weight: 800;
        line-height: 1.16;
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

    /* Card Interior Base */
    .card-interior {{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        width: 100%;
        text-align: center;
    }}

    /* Phase Badge */
    .phase-badge {{
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 22px;
        border-radius: 20px;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: rgba(56, 189, 248, 0.12);
        color: {primary_color};
        border: 1px solid rgba(56, 189, 248, 0.35);
    }}
    .badge-warning {{
        background: rgba(244, 63, 94, 0.12);
        color: #FB7185;
        border-color: rgba(244, 63, 94, 0.35);
    }}
    .badge-compare {{
        background: rgba(56, 189, 248, 0.12);
        color: {primary_color};
        border-color: rgba(56, 189, 248, 0.35);
    }}

    /* Dynamic Focal Box (Hook) */
    .dynamic-focal-box {{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }}
    .focal-headline {{
        font-size: 82px;
        font-weight: 900;
        letter-spacing: -0.02em;
        color: #FB7185;
        text-shadow: 0 0 40px rgba(244, 63, 94, 0.35);
    }}
    .focal-sub {{
        font-size: 22px;
        font-weight: 600;
        color: #CBD5E1;
    }}
    .meter-track {{
        width: 100%;
        height: 16px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        overflow: hidden;
    }}
    .meter-bar {{
        height: 100%;
        border-radius: 8px;
        background: linear-gradient(90deg, #F43F5E, #FB7185);
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
        justify-content: center;
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
        width: 200px;
        height: 200px;
        border-radius: 50%;
        border: 2px dashed rgba(56, 189, 248, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
    }}
    .radar-core {{
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: radial-gradient(circle, {secondary_color} 0%, {primary_color} 80%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
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
        <!-- Top Series & Narrative Stepper (Unifies entire video into one coherent story) -->
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
