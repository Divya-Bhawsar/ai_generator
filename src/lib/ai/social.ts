import { SceneRecord, SocialPackage } from "../db/projects";

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
];

const SOCIAL_PACKAGE_SCHEMA = {
  type: "OBJECT",
  properties: {
    hook: {
      type: "STRING",
      description: "A high-curiosity 1-sentence opening question or bold statement that stops the scroll.",
    },
    takeaways: {
      type: "ARRAY",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "STRING",
        description: "A punchy key takeaway or core insight (max 12 words).",
      },
    },
    call_to_action: {
      type: "STRING",
      description: "An engaging CTA asking viewers to save the Reel, share, or follow for daily insights.",
    },
    hashtags: {
      type: "ARRAY",
      minItems: 6,
      maxItems: 8,
      items: {
        type: "STRING",
        description: "A high-ranking niche hashtag without the '#' symbol.",
      },
    },
  },
  required: ["hook", "takeaways", "call_to_action", "hashtags"],
};

export function formatFullCaption(
  hook: string,
  takeaways: string[],
  callToAction: string,
  hashtags: string[]
): string {
  const formattedHashtags = hashtags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`))
    .join(" ");

  const bullets = takeaways.map((t) => `✦ ${t.trim()}`).join("\n");

  return `${hook.trim()}

Key Takeaways:
${bullets}

${callToAction.trim()}

${formattedHashtags}`;
}

export function synthesizeFallbackSocialPackage(
  topic: string,
  title: string,
  scenes: SceneRecord[]
): SocialPackage {
  const cleanTopic = topic.trim().replace(/[.?]+$/, "");
  const lower = cleanTopic.toLowerCase();

  let hook = `Ever wondered how ${cleanTopic} actually works in real life? Here is the complete breakdown! 💡`;
  let callToAction = "Save this Reel for later & follow for daily animated educational explainers! 🚀";
  let hashtags = ["education", "learning", "explainervideo", "reelsviral", "dailyknowledge", "motiongraphics"];

  // Domain specific tags
  if (/search|algorithm|binary|coding|python|git|cache|cpu|database|dsa/i.test(lower)) {
    hook = `How does ${cleanTopic} work? Here is the step-by-step breakdown you wish you learned earlier! 💻`;
    callToAction = "Save this Reel for your next tech interview & follow for daily computer science breakdowns! 🚀";
    hashtags = ["coding", "computerscience", "algorithms", "datastructures", "developer", "softwareengineer", "learntocode"];
  } else if (/ladoo|besan|cook|ghee|food|tea|baking|pressure cooker/i.test(lower)) {
    hook = `The hidden molecular science behind ${cleanTopic} explained in 60 seconds! 🍲`;
    callToAction = "Save this Reel for your kitchen adventures & follow for daily food chemistry insights! ✨";
    hashtags = ["foodscience", "kitchenchemistry", "cookinghacks", "sciencefacts", "curiosity", "culinary"];
  } else if (/airplane|flight|wing|aerodynamic|physics|quantum|noise|sound|ice|salt/i.test(lower)) {
    hook = `Why does ${cleanTopic} happen? The physics principle explained visually in 60 seconds! ✈️`;
    callToAction = "Save this Reel for later & follow for daily fascinating science breakdowns! 🔬";
    hashtags = ["physics", "sciencefacts", "aerodynamics", "stem", "engineering", "howitworks", "curiosity"];
  }

  // Extract 3 takeaways from scenes if present
  const takeaways: string[] = [];
  if (scenes && scenes.length >= 3) {
    takeaways.push(scenes[0].title || "The Initial Problem & Core Context");
    takeaways.push(scenes[1].title || "The Fundamental Mechanism in Action");
    takeaways.push(scenes[scenes.length - 1].title || "The Real-World Scaling Takeaway");
  } else {
    takeaways.push("The core underlying principle and counter-intuitive mechanism.");
    takeaways.push("Step-by-step cause and effect breakdown.");
    takeaways.push("Why it scales effortlessly in practical real-world applications.");
  }

  return {
    hook,
    takeaways,
    callToAction,
    hashtags,
    fullCaption: formatFullCaption(hook, takeaways, callToAction, hashtags),
    generatedAt: new Date().toISOString(),
  };
}

export async function generateSocialPackageAI(
  topic: string,
  title: string,
  scenes: SceneRecord[],
  targetAudience: string = "general"
): Promise<SocialPackage> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return synthesizeFallbackSocialPackage(topic, title, scenes);
  }

  const scenesContext = scenes
    .map((s, idx) => `Scene ${idx + 1} (${s.title}): "${s.narration}"`)
    .join("\n");

  const prompt = `You are a viral social media strategist and educational video director for Instagram Reels, YouTube Shorts, and TikTok.

Generate an engaging, high-retention social media package for this 60-second educational explainer reel:
Topic: "${topic}"
Video Title: "${title}"
Target Audience: "${targetAudience}"

Scenes & Narration Script:
${scenesContext}

Requirements:
1. Hook: 1-sentence curiosity-provoking opening question or mind-blowing statement (use 1 relevant emoji).
2. Takeaways: Exactly 3 punchy, high-value bullet takeaways explaining the core insight (max 12 words per takeaway).
3. Call-To-Action: 1 friendly CTA asking the viewer to save the reel for later and follow for daily explainers.
4. Hashtags: Exactly 6 to 8 relevant, high-traffic niche hashtags (WITHOUT the '#' symbol in the array).
`;

  const preferredModel = process.env.GEMINI_MODEL;
  const modelsToTry = preferredModel
    ? [preferredModel, ...CANDIDATE_MODELS.filter((m) => m !== preferredModel)]
    : CANDIDATE_MODELS;

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
            responseSchema: SOCIAL_PACKAGE_SCHEMA,
            temperature: 0.7,
          },
        }),
        signal: AbortSignal.timeout(15000),
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn(`Gemini social model ${model} failed: ${res.status}`);
        continue;
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const hook = parsed.hook || `How ${topic} actually works! 💡`;
      const takeaways = Array.isArray(parsed.takeaways) && parsed.takeaways.length >= 3
        ? parsed.takeaways.slice(0, 3)
        : ["The Core Mechanism", "Step-by-step logic", "Practical takeaway"];
      const callToAction = parsed.call_to_action || "Save this Reel for later & follow for daily insights! 🚀";
      const hashtags = Array.isArray(parsed.hashtags) && parsed.hashtags.length >= 4
        ? parsed.hashtags
        : ["learning", "science", "coding", "education", "reels"];

      return {
        hook,
        takeaways,
        callToAction,
        hashtags,
        fullCaption: formatFullCaption(hook, takeaways, callToAction, hashtags),
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn(`Gemini social generation error with model ${model}:`, err);
    }
  }

  // Graceful fallback if Gemini quota is reached
  return synthesizeFallbackSocialPackage(topic, title, scenes);
}
