const scenes = [
  {
    step: "01",
    title: "Inspect the middle",
    caption: "Target: 73 · Midpoint: 42",
    values: [12, 24, 31, 42, 56, 73, 88],
    active: 3,
    accent: "gold",
  },
  {
    step: "02",
    title: "Keep the right half",
    caption: "Narrow to 56, 73, 88",
    values: [56, 73, 88],
    active: 1,
    accent: "blue",
  },
  {
    step: "03",
    title: "Find the target",
    caption: "73 found at index 5",
    values: [56, 73, 88],
    active: 1,
    accent: "coral",
  },
] as const;

const workflow = [
  {
    number: "01",
    title: "Start with an idea",
    description:
      "Bring a topic or brainstorm a useful angle. VidyaMotion helps shape it into a clear explanation.",
  },
  {
    number: "02",
    title: "Review the story",
    description:
      "See the script and storyboard together. Ask for changes in plain language before video generation.",
  },
  {
    number: "03",
    title: "Make and share",
    description:
      "Generate motion graphics with synchronized narration and captions, then preview, export, or publish.",
  },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="VidyaMotion home">
          <span className="wordmark-mark" aria-hidden="true">V</span>
          <span>VidyaMotion</span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#examples">Examples</a>
        </nav>
        <div className="header-actions">
          <a className="text-link" href="#get-started">Sign in</a>
          <a className="button button-small" href="#get-started">Create an explainer <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <section className="hero section-wrap" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> EDUCATIONAL MOTION, MADE CLEAR</p>
          <h1>Turn a topic into a <span>clear explainer.</span></h1>
          <p className="hero-description">
            Create a 60–90 second animated explainer with synchronized voiceover and burned-in captions, ready to export or share.
          </p>
          <div className="hero-actions" id="get-started">
            <a className="button" href="#how-it-works">Create an explainer <span aria-hidden="true">↗</span></a>
            <a className="button button-quiet" href="#examples"><span className="play-icon" aria-hidden="true">▶</span> See how it works</a>
          </div>
          <p className="hero-note">Made for clear teaching, not complicated editing.</p>
        </div>

        <div className="story-stage" aria-label="Three-scene binary search storyboard illustration">
          <div className="stage-heading">
            <div>
              <span className="stage-kicker">A TOPIC IN MOTION</span>
              <h2>Binary search</h2>
            </div>
            <span className="format-pill">STORYBOARD · 9:16</span>
          </div>
          <div className="scene-list">
            {scenes.map((scene) => (
              <article className={`scene scene-${scene.accent}`} key={scene.step}>
                <div className="scene-meta">
                  <span className="scene-number">{scene.step}</span>
                  <div>
                    <h3>{scene.title}</h3>
                    <p>{scene.caption}</p>
                  </div>
                  <span className="scene-arrow" aria-hidden="true">↗</span>
                </div>
                <div className="number-row" aria-label={`Array values ${scene.values.join(", ")}`}>
                  {scene.values.map((value, index) => (
                    <span className={index === scene.active ? "number-cell is-active" : "number-cell"} key={`${scene.step}-${value}`}>
                      {value}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="stage-caption">
            <span className="caption-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span>
            <p>“The midpoint is 73. We found the target.”</p>
            <span className="caption-label">VOICE + CAPTIONS</span>
          </div>
          <span className="stage-orbit orbit-one" aria-hidden="true" />
          <span className="stage-orbit orbit-two" aria-hidden="true" />
        </div>
      </section>

      <section className="trust-strip" aria-label="Video capabilities">
        <div><span className="strip-mark">01</span><span>60–90 second explainers</span></div>
        <div><span className="strip-mark">02</span><span>Voiceover in sync with the visuals</span></div>
        <div><span className="strip-mark">03</span><span>Captions burned into the video</span></div>
        <div><span className="strip-mark">04</span><span>MP4 export and Instagram publish</span></div>
      </section>

      <section className="workflow section-wrap" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">A SIMPLE CREATOR FLOW</p>
          <h2>From idea to finished explainer.</h2>
          <p>AI handles the production work. You shape the idea and review the story.</p>
        </div>
        <div className="workflow-grid">
          {workflow.map((item) => (
            <article className="workflow-step" key={item.number}>
              <span className="workflow-number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="examples section-wrap" id="examples">
        <div className="examples-copy">
          <p className="eyebrow">BUILT FOR TEACHING</p>
          <h2>Make the hard part easier to see.</h2>
          <p>From algorithms to everyday science, turn a useful concept into a focused visual explanation.</p>
        </div>
        <div className="topic-list" aria-label="Example educational topics">
          <div><span className="topic-icon topic-blue">{ }</span><span><strong>Binary Search</strong><small>Computer science</small></span><span className="topic-arrow">↗</span></div>
          <div><span className="topic-icon topic-gold">✳</span><span><strong>Photosynthesis</strong><small>Biology</small></span><span className="topic-arrow">↗</span></div>
          <div><span className="topic-icon topic-coral">₹</span><span><strong>UPI Basics</strong><small>Digital payments</small></span><span className="topic-arrow">↗</span></div>
        </div>
      </section>

      <section className="closing section-wrap">
        <div>
          <p className="eyebrow">YOUR NEXT EXPLANATION STARTS HERE</p>
          <h2>Give your idea a clearer shape.</h2>
        </div>
        <a className="button" href="#top">Create an explainer <span aria-hidden="true">↗</span></a>
      </section>

      <footer className="site-footer section-wrap">
        <a className="wordmark" href="#top"><span className="wordmark-mark" aria-hidden="true">V</span><span>VidyaMotion</span></a>
        <p>Clear explainers for visual learning.</p>
        <span>© VidyaMotion</span>
      </footer>
    </main>
  );
}
