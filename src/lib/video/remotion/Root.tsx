import React from "react";
import { Composition, registerRoot } from "remotion";
import { Explainer } from "./Explainer";
import type { Timeline } from "./contracts";

const fallbackTimeline: Timeline = {
  title: "VidyaMotion Explainer",
  fps: 30,
  frames: 300,
  scenes: [],
};

export const RemotionRoot: React.FC<{ timeline?: Timeline }> = ({ timeline = fallbackTimeline }) => {
  return (
    <Composition
      id="Explainer"
      component={Explainer}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={timeline.frames || 300}
      defaultProps={{
        timeline,
      }}
      calculateMetadata={({ props }) => ({
        durationInFrames: props.timeline?.frames || 300,
      })}
    />
  );
};

registerRoot(RemotionRoot);
