import Link from "next/link";

type AuthFrameProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function AuthFrame({ title, description, children, footer }: AuthFrameProps) {
  return (
    <main className="auth-shell">
      <Link className="wordmark auth-wordmark" href="/" aria-label="VidyaMotion home">
        <span className="wordmark-mark" aria-hidden="true">V</span>
        <span>VidyaMotion</span>
      </Link>

      <div className="auth-content">
        <section className="auth-story" aria-label="About VidyaMotion">
          <p className="eyebrow"><span className="eyebrow-dot" /> EDUCATIONAL MOTION, MADE CLEAR</p>
          <h1>Make room for <span>clear ideas.</span></h1>
          <p className="auth-story-copy">
            Turn the topics you care about into visual explanations people can follow and remember.
          </p>
          <div className="auth-art" aria-hidden="true">
            <div className="auth-art-orbit orbit-a" />
            <div className="auth-art-orbit orbit-b" />
            <div className="auth-art-card auth-art-card-main">
              <span className="auth-art-label">A good explanation</span>
              <span className="auth-art-line line-one" />
              <span className="auth-art-line line-two" />
              <span className="auth-art-line line-three" />
              <span className="auth-art-node node-one">01</span>
              <span className="auth-art-node node-two">02</span>
              <span className="auth-art-node node-three">03</span>
              <span className="auth-art-connector connector-one" />
              <span className="auth-art-connector connector-two" />
            </div>
            <span className="auth-art-spark spark-one" />
            <span className="auth-art-spark spark-two" />
          </div>
          <div className="auth-proof">
            <span className="auth-proof-mark">✳</span>
            <span>One clear idea at a time.</span>
          </div>
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-heading">
            <p className="auth-card-kicker">YOUR CREATOR WORKSPACE</p>
            <h2 id="auth-title">{title}</h2>
            <p>{description}</p>
          </div>
          {children}
          <div className="auth-card-footer">{footer}</div>
          <p className="auth-privacy">Your ideas and videos stay in your personal workspace.</p>
        </section>
      </div>

      <footer className="auth-footer">
        <span>© VidyaMotion</span>
        <span>Clear explainers for visual learning</span>
      </footer>
    </main>
  );
}
