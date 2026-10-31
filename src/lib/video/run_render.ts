import fs from "fs";
import { parseArgs } from "util";
import { runRemotionRenderJob } from "./render_engine";

async function main() {
  const { values } = parseArgs({
    options: {
      "project-id": { type: "string" },
      "voice-id": { type: "string" },
      "voice-name": { type: "string" },
      "storyboard-file": { type: "string" },
      "output-mp4": { type: "string" },
      "status-file": { type: "string" },
    },
  });

  const projectId = values["project-id"];
  const storyboardFile = values["storyboard-file"];
  const outputMp4 = values["output-mp4"];
  const statusFile = values["status-file"];

  if (!projectId || !storyboardFile || !outputMp4 || !statusFile) {
    console.error("Missing required arguments");
    process.exit(1);
  }

  const storyboardRaw = fs.readFileSync(storyboardFile, "utf-8");
  const storyboard = JSON.parse(storyboardRaw);

  console.log(`Starting Remotion Render for project ${projectId}...`);

  await runRemotionRenderJob({
    projectId,
    storyboard,
    voiceId: values["voice-id"] || "Q1NHvGuV9SzxtiSnVDEH",
    voiceName: values["voice-name"] || "viraj",
    outputMp4Path: outputMp4,
    statusFilePath: statusFile,
  });

  console.log(`Remotion Render completed for project ${projectId}.`);
}

main().catch((err) => {
  console.error("Render runner error:", err);
  process.exit(1);
});
