#!/usr/bin/env python3
"""HTML5/CSS3/SVG Frame Generator for VidyaMotion Explainer Videos.

Generates high-resolution (1080x1920) modern glassmorphic motion graphic frames:
- Cinematic dark gradient background with ambient glowing orbs
- Frosted glass cards with glowing borders
- Modern typography and anti-aliased hierarchy
- Procedural SVG diagrams (comparison, process flows, metrics, hook cards)
- Captured via headless Google Chrome into pixel-perfect PNGs
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def generate_scene_html(scene: dict, index: int, total_scenes: int, topic: str = "") -> str:
    title = scene.get("title", f"Scene {index}")
    visual_type = str(scene.get("visualType") or scene.get("visual_type") or "concept").lower()
    visual_label = scene.get("visualLabel") or scene.get("visual_label") or ""
    accent_words = scene.get("accentWords") or scene.get("accent_words") or []

    # Choose color palette based on visual type
    theme_colors = {
        "hook": ("#F43F5E", "#FB7185", "rgba(244, 63, 94, 0.3)"),
        "problem": ("#F43F5E", "#FB7185", "rgba(244, 63, 94, 0.3)"),
        "flow": ("#06B6D4", "#38BDF8", "rgba(6, 182, 212, 0.3)"),
        "process_steps": ("#06B6D4", "#38BDF8", "rgba(6, 182, 212, 0.3)"),
        "bars": ("#F59E0B", "#FBBF24", "rgba(245, 158, 11, 0.3)"),
        "comparison": ("#10B981", "#34D399", "rgba(16, 185, 129, 0.3)"),
        "concept": ("#6366F1", "#818CF8", "rgba(99, 102, 241, 0.3)"),
        "takeaway": ("#8B5CF6", "#C084FC", "rgba(139, 92, 246, 0.3)"),
    }
    primary_color, secondary_color, glow_color = theme_colors.get(visual_type, ("#6366F1", "#818CF8", "rgba(99, 102, 241, 0.3)"))

    # Accent tags HTML
    accent_tags_html = "".join(
        f'<span class="accent-tag">#{w}</span>' for w in accent_words
    )

    # Dynamic Diagram Centerpiece
    if visual_type in ("hook", "problem"):
        diagram_html = f"""
        <div class="hook-card">
            <div class="alert-pill">
                <span class="pulse-dot" style="background: {primary_color};"></span>
                <span>CRITICAL FRICTION DETECTED</span>
            </div>
            <div class="hook-metric-box">
                <div class="metric-big" style="color: {primary_color};">70%</div>
                <div class="metric-label">Developer Time Lost to Cognitive Drag</div>
            </div>
            <div class="meter-bar">
                <div class="meter-fill" style="width: 72%; background: linear-gradient(90deg, {primary_color}, {secondary_color});"></div>
            </div>
            <div class="meter-caption">Endless Boilerplate • Grueling Debugging • Context Switching</div>
        </div>
        """
    elif visual_type in ("comparison", "bars"):
        diagram_html = f"""
        <div class="comparison-grid">
            <div class="card-half">
                <span class="half-badge">TRADITIONAL ASSISTANTS</span>
                <div class="metric-val" style="color: #94A3B8;">Single-Line</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: 35%; background: #64748B;"></div>
                </div>
                <p class="half-desc">Surface predictions leaving system orchestration on you</p>
            </div>
            <div class="card-half active-half" style="border-color: {primary_color}; box-shadow: 0 0 35px {glow_color};">
                <span class="half-badge" style="background: {primary_color}; color: #FFF;">ANTIGRAVITY AI</span>
                <div class="metric-val" style="color: {secondary_color};">End-to-End</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: 95%; background: linear-gradient(90deg, {primary_color}, {secondary_color});"></div>
                </div>
                <p class="half-desc">Autonomous multi-file architecture & validated shipping</p>
            </div>
        </div>
        """
    elif visual_type in ("flow", "process_steps"):
        diagram_html = f"""
        <div class="flow-container">
            <div class="flow-step">
                <div class="step-num">01</div>
                <div class="step-title">INGESTION</div>
                <div class="step-desc">Parse Dependencies</div>
            </div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step step-active" style="border-color: {primary_color}; box-shadow: 0 0 25px {glow_color};">
                <div class="step-num" style="background: {primary_color};">02</div>
                <div class="step-title" style="color: {secondary_color};">REASONING</div>
                <div class="step-desc">Draft Code & Tests</div>
            </div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">
                <div class="step-num">03</div>
                <div class="step-title">EXECUTION</div>
                <div class="step-desc">Deploy Workflows</div>
            </div>
        </div>
        """
    elif visual_type == "takeaway":
        diagram_html = f"""
        <div class="takeaway-box">
            <div class="takeaway-header">
                <div class="check-icon" style="background: {primary_color}; box-shadow: 0 0 25px {primary_color};">✓</div>
                <div class="takeaway-title">VELOCITY WITHOUT RESISTANCE</div>
            </div>
            <div class="takeaway-bullets">
                <div class="bullet-item">
                    <span class="bullet-check" style="color: {secondary_color};">✓</span>
                    <span>Turns engineering friction into seamless autonomous flow</span>
                </div>
                <div class="bullet-item">
                    <span class="bullet-check" style="color: {secondary_color};">✓</span>
                    <span>Full-codebase semantic understanding & validation</span>
                </div>
                <div class="bullet-item">
                    <span class="bullet-check" style="color: {secondary_color};">✓</span>
                    <span>10x shipping speed with near-zero operational drag</span>
                </div>
            </div>
        </div>
        """
    else:
        # Modern concept HUD centerpiece
        diagram_html = f"""
        <div class="concept-hud">
            <div class="orbital-system">
                <div class="outer-ring" style="border-color: rgba(99, 102, 241, 0.25);">
                    <div class="orbit-planet planet-1" style="background: {primary_color};"></div>
                    <div class="orbit-planet planet-2" style="background: {secondary_color};"></div>
                </div>
                <div class="inner-ring" style="border-color: {primary_color}; box-shadow: 0 0 40px {glow_color};">
                    <div class="core-glow" style="background: radial-gradient(circle, {secondary_color} 0%, {primary_color} 70%);">
                        <span>AI</span>
                    </div>
                </div>
            </div>
            <div class="hud-nodes-row">
                <span class="hud-node" style="border-color: {primary_color}; color: {secondary_color};">● Full Codebase</span>
                <span class="hud-node" style="border-color: {primary_color}; color: {secondary_color};">● Semantic Memory</span>
                <span class="hud-node" style="border-color: {primary_color}; color: {secondary_color};">● Agent Reasoning</span>
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
        justify-content: flex-start;
        padding: 130px 70px 0;
    }}

    /* Ambient Glowing Orbs Background */
    .orb-1 {{
        position: absolute;
        top: 220px;
        left: -120px;
        width: 550px;
        height: 550px;
        background: {primary_color};
        filter: blur(150px);
        opacity: 0.22;
        border-radius: 50%;
        z-index: 1;
    }}
    .orb-2 {{
        position: absolute;
        top: 600px;
        right: -140px;
        width: 620px;
        height: 620px;
        background: {secondary_color};
        filter: blur(160px);
        opacity: 0.18;
        border-radius: 50%;
        z-index: 1;
    }}

    /* Subtle Grid Overlay */
    .bg-grid {{
        position: absolute;
        inset: 0;
        background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        background-size: 54px 54px;
        z-index: 2;
    }}

    /* Main Content Container */
    .content-box {{
        position: relative;
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: 32px;
    }}

    /* Top Badges Row */
    .top-badge-row {{
        display: flex;
        justifyContent: space-between;
        align-items: center;
    }}
    .scene-pill {{
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 12px 24px;
        border-radius: 40px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(20px);
        font-size: 22px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: {secondary_color};
    }}
    .pulse-dot {{
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: {primary_color};
        box-shadow: 0 0 14px {primary_color};
    }}
    .topic-pill {{
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 10px 22px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.05);
        color: #94A3B8;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }}

    /* Scene Title */
    .scene-title {{
        font-size: 60px;
        font-weight: 800;
        line-height: 1.18;
        color: #FFFFFF;
        letter-spacing: -0.02em;
        text-shadow: 0 4px 24px rgba(0, 0, 0, 0.7);
    }}

    /* Frosted Glass Centerpiece Card */
    .glass-card {{
        background: rgba(15, 23, 42, 0.75);
        border: 2px solid rgba(255, 255, 255, 0.12);
        border-radius: 36px;
        padding: 44px;
        backdrop-filter: blur(35px);
        box-shadow: 0 25px 70px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        display: flex;
        flex-direction: column;
        gap: 32px;
    }}

    /* Diagram Wrap */
    .diagram-wrap {{
        display: flex;
        justifyContent: center;
        align-items: center;
        min-height: 360px;
        width: 100%;
    }}

    /* Hook Alert Card */
    .hook-card {{
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        text-align: center;
    }}
    .alert-pill {{
        display: inline-flex;
        align-items: center;
        gap: 12px;
        background: rgba(244, 63, 94, 0.15);
        border: 1px solid rgba(244, 63, 94, 0.4);
        padding: 10px 24px;
        border-radius: 30px;
        font-size: 20px;
        font-weight: 800;
        color: #FB7185;
        letter-spacing: 0.08em;
    }}
    .hook-metric-box {{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }}
    .metric-big {{
        font-size: 110px;
        font-weight: 900;
        line-height: 1;
        letter-spacing: -0.03em;
        text-shadow: 0 0 35px {glow_color};
    }}
    .metric-label {{
        font-size: 24px;
        font-weight: 600;
        color: #E2E8F0;
    }}
    .meter-bar {{
        width: 100%;
        height: 18px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        overflow: hidden;
    }}
    .meter-fill {{
        height: 100%;
        border-radius: 12px;
    }}
    .meter-caption {{
        font-size: 18px;
        color: #94A3B8;
        font-weight: 500;
        letter-spacing: 0.02em;
    }}

    /* Comparison Grid */
    .comparison-grid {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        width: 100%;
    }}
    .card-half {{
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 32px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }}
    .active-half {{
        background: rgba(30, 41, 59, 0.9);
        border: 2px solid;
    }}
    .half-badge {{
        font-size: 17px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 6px 14px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
        color: #94A3B8;
        align-self: flex-start;
    }}
    .metric-val {{
        font-size: 38px;
        font-weight: 800;
    }}
    .bar-track {{
        width: 100%;
        height: 14px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        overflow: hidden;
    }}
    .bar-fill {{
        height: 100%;
        border-radius: 8px;
    }}
    .half-desc {{
        font-size: 20px;
        color: #CBD5E1;
        line-height: 1.4;
    }}

    /* Flow Steps */
    .flow-container {{
        display: flex;
        align-items: center;
        justifyContent: space-between;
        width: 100%;
        gap: 14px;
    }}
    .flow-step {{
        flex: 1;
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 26px 14px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }}
    .step-active {{
        background: rgba(30, 41, 59, 0.95);
        border: 2px solid;
    }}
    .step-num {{
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        color: #FFF;
        font-weight: 800;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }}
    .step-title {{
        font-size: 20px;
        font-weight: 800;
        color: #FFF;
        letter-spacing: 0.04em;
    }}
    .step-desc {{
        font-size: 16px;
        color: #94A3B8;
    }}
    .flow-arrow {{
        font-size: 28px;
        color: #64748B;
    }}

    /* Takeaway Box */
    .takeaway-box {{
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 22px;
    }}
    .takeaway-header {{
        display: flex;
        align-items: center;
        gap: 18px;
    }}
    .check-icon {{
        width: 52px;
        height: 52px;
        border-radius: 50%;
        color: #FFF;
        font-size: 28px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
    }}
    .takeaway-title {{
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 0.04em;
        color: #FFF;
    }}
    .takeaway-bullets {{
        display: flex;
        flex-direction: column;
        gap: 16px;
    }}
    .bullet-item {{
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 24px;
        color: #E2E8F0;
        background: rgba(255, 255, 255, 0.04);
        padding: 16px 20px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }}
    .bullet-check {{
        font-weight: 900;
        font-size: 26px;
    }}

    /* Concept HUD */
    .concept-hud {{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 28px;
    }}
    .orbital-system {{
        position: relative;
        width: 250px;
        height: 250px;
        display: flex;
        align-items: center;
        justify-content: center;
    }}
    .outer-ring {{
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 2px dashed;
    }}
    .orbit-planet {{
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
    }}
    .planet-1 {{
        top: 20px;
        left: 30px;
    }}
    .planet-2 {{
        bottom: 30px;
        right: 25px;
    }}
    .inner-ring {{
        width: 150px;
        height: 150px;
        border-radius: 50%;
        border: 3px solid;
        display: flex;
        align-items: center;
        justify-content: center;
    }}
    .core-glow {{
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 32px;
        color: #FFF;
        letter-spacing: 0.06em;
    }}
    .hud-nodes-row {{
        display: flex;
        gap: 14px;
    }}
    .hud-node {{
        border: 1px solid;
        border-radius: 20px;
        padding: 8px 18px;
        font-size: 18px;
        font-weight: 700;
        background: rgba(255, 255, 255, 0.03);
    }}

    /* Explanation Text */
    .explanation-text {{
        font-size: 28px;
        line-height: 1.45;
        color: #CBD5E1;
        font-weight: 500;
        text-align: center;
        padding: 0 12px;
    }}

    /* Accents Row */
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
        color: {secondary_color};
    }}
</style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="orb-1"></div>
    <div class="orb-2"></div>

    <div class="content-box">
        <div class="top-badge-row">
            <div class="scene-pill">
                <span class="pulse-dot"></span>
                <span>SCENE {index:02d} / {total_scenes:02d}</span>
            </div>
            <div class="topic-pill">{visual_type.replace('_', ' ')}</div>
        </div>

        <h1 class="scene-title">{title}</h1>

        <div class="glass-card">
            <div class="diagram-wrap">
                {diagram_html}
            </div>

            <p class="explanation-text">{visual_label}</p>

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
