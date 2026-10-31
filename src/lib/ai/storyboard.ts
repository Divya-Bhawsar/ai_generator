import { SceneRecord } from "../db/projects";

const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

const SCENE_TYPES = [
  "hook",
  "flow",
  "bars",
  "concept",
  "takeaway",
  "comparison",
  "metric_callout",
  "process_steps",
  "binary_array",
  "binary_mid",
  "binary_narrow",
  "binary_found",
  "binary_complexity",
  "light_ray",
  "droplet",
  "spectrum",
  "rainbow",
];

const STORYBOARD_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    scenes: {
      type: "ARRAY",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          narration: { type: "STRING" },
          visual_label: { type: "STRING" },
          visual_type: { type: "STRING", enum: SCENE_TYPES },
          accent_words: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
        required: ["title", "narration", "visual_label", "visual_type"],
      },
    },
  },
  required: ["title", "scenes"],
};

async function callGemini(prompt: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in .env.local");
  }

  const preferredModel = process.env.GEMINI_MODEL;
  const modelsToTry = preferredModel
    ? [preferredModel, ...CANDIDATE_MODELS.filter((m) => m !== preferredModel)]
    : CANDIDATE_MODELS;

  let lastError = "";

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: STORYBOARD_SCHEMA,
            temperature: 0.7,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        lastError = data.error?.message || `HTTP ${res.status}`;
        console.warn(`Gemini model ${model} failed (${res.status}), trying fallback...`);
        continue;
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        lastError = "Empty response from Gemini model";
        continue;
      }

      return JSON.parse(rawText);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`Gemini model ${model} exception, trying fallback...`, err);
    }
  }

  throw new Error(`Failed to generate storyboard from AI providers: ${lastError}`);
}

export async function generateStoryboardAI(topic: string, sourceNotes: string = ""): Promise<{
  title: string;
  scenes: SceneRecord[];
}> {
  const prompt = `Create an educational explainer storyboard for a video reel.
Topic: ${topic}
Source notes / reference context: ${sourceNotes || "None provided"}
Target narration duration: 60 to 90 seconds. Aim for 150 to 175 spoken words total so the narration lands comfortably within 60-90 seconds at a natural speaking pace.
Language: English. Write clearly for speech. Explain the concept accurately in logical, easy-to-follow steps. Do not invent fake statistics.
Return 4 to 6 scenes.
For each scene:
- title: Short scene heading (e.g. "The Mystery of Air Pressure")
- narration: The exact words spoken aloud by the voiceover narrator in this scene (30-40 words per scene).
- visual_label: A concise 3-line description of the animated diagram, chart, or motion graphic.
- visual_type: Choose from: hook, flow, bars, concept, takeaway, comparison, metric_callout, process_steps.
- accent_words: 2 to 4 key terms from the narration to highlight on screen (e.g. ["pressure", "boiling point", "temperature"]).
End the final scene with a crisp, punchy educational takeaway.`;

  const parsed = (await callGemini(prompt)) as {
    title: string;
    scenes: Array<{
      title: string;
      narration: string;
      visual_label: string;
      visual_type: string;
      accent_words?: string[];
    }>;
  };

  const scenes: SceneRecord[] = parsed.scenes.map((s, idx) => {
    const wordCount = s.narration.trim().split(/\s+/).length;
    const estSeconds = Math.round((wordCount / 2.5) * 10) / 10;
    return {
      sceneId: `scene-${String(idx + 1).padStart(2, "0")}`,
      sequence: idx + 1,
      title: s.title,
      narration: s.narration,
      visualLabel: s.visual_label,
      visualType: s.visual_type || "concept",
      accentWords: s.accent_words || [],
      estimatedSeconds: estSeconds,
    };
  });

  return {
    title: parsed.title || topic,
    scenes,
  };
}

export async function reviseStoryboardAI(
  currentTitle: string,
  currentScenes: SceneRecord[],
  revisionPrompt: string
): Promise<{
  title: string;
  scenes: SceneRecord[];
}> {
  const currentJson = JSON.stringify(
    {
      title: currentTitle,
      scenes: currentScenes.map((s) => ({
        sequence: s.sequence,
        title: s.title,
        narration: s.narration,
        visual_label: s.visualLabel,
        visual_type: s.visualType,
        accent_words: s.accentWords,
      })),
    },
    null,
    2
  );

  const prompt = `You are an AI video director revising an educational explainer storyboard.
Existing Storyboard:
${currentJson}

User Revision Instruction:
"${revisionPrompt}"

Apply the requested changes to improve the script or visual cues. Preserve unaffected scenes where possible. Keep total narration length between 150 to 175 words (60 to 90 seconds total). Return the full updated storyboard matching the schema.`;

  const parsed = (await callGemini(prompt)) as {
    title: string;
    scenes: Array<{
      title: string;
      narration: string;
      visual_label: string;
      visual_type: string;
      accent_words?: string[];
    }>;
  };

  const scenes: SceneRecord[] = parsed.scenes.map((s, idx) => {
    const wordCount = s.narration.trim().split(/\s+/).length;
    const estSeconds = Math.round((wordCount / 2.5) * 10) / 10;
    return {
      sceneId: `scene-${String(idx + 1).padStart(2, "0")}`,
      sequence: idx + 1,
      title: s.title,
      narration: s.narration,
      visualLabel: s.visual_label,
      visualType: s.visual_type || "concept",
      accentWords: s.accent_words || [],
      estimatedSeconds: estSeconds,
    };
  });

  return {
    title: parsed.title || currentTitle,
    scenes,
  };
}
