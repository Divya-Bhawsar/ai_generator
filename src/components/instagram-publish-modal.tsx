"use client";

import { useState, useEffect } from "react";

interface InstagramPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  videoUrl?: string | null;
  caption?: string;
  initialReelUrl?: string;
}

interface ScheduledPostItem {
  _id: string;
  projectTitle: string;
  scheduledFor: string;
  status: string;
  instagramPermalink?: string;
}

export function InstagramPublishModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  videoUrl,
  caption,
  initialReelUrl,
}: InstagramPublishModalProps) {
  const [activeTab, setActiveTab] = useState<"publish" | "schedule" | "settings">("publish");
  const [publishing, setPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState<string>("");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(initialReelUrl || null);
  const [error, setError] = useState<string | null>(null);

  // Scheduling state
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPostItem[]>([]);

  // Account state
  const [account, setAccount] = useState<{
    accountId: string;
    accountName: string;
    accountUsername: string;
    isSandbox: boolean;
    hasLiveToken: boolean;
  } | null>(null);
  const [customAccountId, setCustomAccountId] = useState("");
  const [customToken, setCustomToken] = useState("");
  const [customUsername, setCustomUsername] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Load account & scheduled posts
  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    // Default scheduled date: tomorrow at 6:00 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledDate(localISOTime);

    fetch("/api/instagram/account")
      .then((r) => r.json())
      .then((data) => {
        if (data.account) {
          setAccount(data.account);
          setCustomAccountId(data.account.accountId || "");
          setCustomUsername(data.account.accountUsername || "");
        }
      })
      .catch(() => {});

    fetchScheduled();
  }, [isOpen]);

  async function fetchScheduled() {
    try {
      const res = await fetch("/api/instagram/schedule");
      const data = await res.json();
      if (data.scheduledPosts) setScheduledPosts(data.scheduledPosts);
    } catch {
      // ignore
    }
  }

  async function handlePublishNow() {
    if (!videoUrl) {
      setError("Please generate the video before publishing to Instagram.");
      return;
    }

    setPublishing(true);
    setError(null);
    setPublishedUrl(null);
    setPublishStep("Step 1/3: Creating Instagram Reels Media Container...");

    try {
      // Step feedback updates
      const t1 = setTimeout(() => {
        setPublishStep("Step 2/3: Transcoding video & verifying 1080x1920 bitrate...");
      }, 1200);

      const t2 = setTimeout(() => {
        setPublishStep("Step 3/3: Publishing Reel to Instagram Grid & Feed...");
      }, 2600);

      const res = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          caption,
        }),
      });

      clearTimeout(t1);
      clearTimeout(t2);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish Reel");

      setPublishedUrl(data.instagramReelUrl);
      setPublishStep("🎉 Reel published successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Publishing error";
      setError(msg);
      setPublishStep("");
    } finally {
      setPublishing(false);
    }
  }

  async function handleSchedulePost() {
    if (!scheduledDate) {
      setError("Please select a valid date and time.");
      return;
    }

    setScheduling(true);
    setError(null);
    setScheduleSuccess(false);

    try {
      const res = await fetch("/api/instagram/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          scheduledTime: new Date(scheduledDate).toISOString(),
          caption,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule post");

      setScheduleSuccess(true);
      fetchScheduled();
      setTimeout(() => setScheduleSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scheduling error");
    } finally {
      setScheduling(false);
    }
  }

  async function handleDeleteSchedule(postId: string) {
    try {
      await fetch(`/api/instagram/schedule?postId=${postId}`, { method: "DELETE" });
      setScheduledPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch {
      // ignore
    }
  }

  async function handleSaveAccountSettings() {
    setSavingAccount(true);
    setError(null);
    try {
      const res = await fetch("/api/instagram/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: customAccountId.trim(),
          accountUsername: customUsername.trim().replace(/^@/, ""),
          accessToken: customToken.trim() || undefined,
          isSandbox: !customToken.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save account settings");
      setAccount(data.account);
      alert("Instagram Account Settings Saved!");
      setActiveTab("publish");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving account");
    } finally {
      setSavingAccount(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(11, 15, 25, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "580px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.35)",
          border: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
                display: "grid",
                placeItems: "center",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(221, 42, 123, 0.3)",
              }}
            >
              ✦
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0F172A" }}>
                Instagram Reels Distribution
              </h3>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748B" }}>
                Meta Graph API v21.0 Content Publishing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#F1F5F9",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "0.9rem",
              color: "#475569",
              display: "grid",
              placeItems: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
          <button
            type="button"
            onClick={() => setActiveTab("publish")}
            style={{
              flex: 1,
              padding: "0.75rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              background: activeTab === "publish" ? "#FFFFFF" : "transparent",
              color: activeTab === "publish" ? "#4F46E5" : "#64748B",
              border: "none",
              borderBottom: activeTab === "publish" ? "2px solid #4F46E5" : "none",
              cursor: "pointer",
            }}
          >
            🚀 Publish Now
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            style={{
              flex: 1,
              padding: "0.75rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              background: activeTab === "schedule" ? "#FFFFFF" : "transparent",
              color: activeTab === "schedule" ? "#4F46E5" : "#64748B",
              border: "none",
              borderBottom: activeTab === "schedule" ? "2px solid #4F46E5" : "none",
              cursor: "pointer",
            }}
          >
            ⏱️ Schedule Post
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            style={{
              flex: 1,
              padding: "0.75rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              background: activeTab === "settings" ? "#FFFFFF" : "transparent",
              color: activeTab === "settings" ? "#4F46E5" : "#64748B",
              border: "none",
              borderBottom: activeTab === "settings" ? "2px solid #4F46E5" : "none",
              cursor: "pointer",
            }}
          >
            ⚙️ Account / API
          </button>
        </div>

        {/* Body Container */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Account Pill */}
          {account && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.65rem 1rem",
                borderRadius: "12px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1rem" }}>📸</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A" }}>
                  @{account.accountUsername || "vidyamotion.reels"}
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    padding: "0.1rem 0.45rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    background: account.isSandbox ? "#FEF3C7" : "#D1FAE5",
                    color: account.isSandbox ? "#92400E" : "#065F46",
                    border: account.isSandbox ? "1px solid #FDE68A" : "1px solid #A7F3D0",
                  }}
                >
                  {account.isSandbox ? "Sandbox Mode" : "● Live Meta Graph"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#4F46E5",
                  fontSize: "0.78125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Change ⚙
              </button>
            </div>
          )}

          {error && (
            <div style={{ padding: "0.75rem 1rem", background: "#FEE2E2", color: "#991B1B", borderRadius: "10px", fontSize: "0.85rem", border: "1px solid #FCA5A5" }}>
              {error}
            </div>
          )}

          {/* TAB 1: PUBLISH NOW */}
          {activeTab === "publish" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#F8FAFC", padding: "1rem", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                  Reel Video & Caption Preview:
                </span>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "85px",
                      borderRadius: "8px",
                      background: "#0F172A",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {videoUrl ? (
                      <video src={videoUrl} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#FFF", fontSize: "10px" }}>No Video</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.9375rem", fontWeight: 700, color: "#0F172A" }}>
                      {projectTitle}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.78125rem", color: "#475569", maxHeight: "65px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {caption || "No caption specified. Will use AI generated caption."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress animation while publishing */}
              {publishing && (
                <div style={{ padding: "1rem", borderRadius: "12px", background: "#EEF2FF", border: "1px solid #C7D2FE", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span className="spinner" style={{ width: 18, height: 18, border: "2px solid #4F46E5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: "0.85rem", color: "#4338CA", fontWeight: 600 }}>{publishStep}</span>
                </div>
              )}

              {/* Published Success Card */}
              {publishedUrl && !publishing && (
                <div
                  style={{
                    padding: "1.25rem",
                    borderRadius: "14px",
                    background: "#ECFDF5",
                    border: "1.5px solid #A7F3D0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>🎉</span>
                    <strong style={{ fontSize: "1rem", color: "#065F46" }}>Your Reel is Live on Instagram!</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "#047857" }}>
                    Container verified and published to Instagram Feed & Reels.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <a
                      href={publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
                        color: "#FFFFFF",
                        padding: "0.55rem 1.15rem",
                        borderRadius: "10px",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        boxShadow: "0 4px 14px rgba(221, 42, 123, 0.35)",
                      }}
                    >
                      <span>View Reel on Instagram</span>
                      <span>↗</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(publishedUrl);
                        alert("Reel link copied to clipboard!");
                      }}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #A7F3D0",
                        color: "#065F46",
                        padding: "0.55rem 0.95rem",
                        borderRadius: "10px",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )}

              {!publishedUrl && (
                <button
                  type="button"
                  disabled={publishing || !videoUrl}
                  onClick={handlePublishNow}
                  style={{
                    background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
                    border: "none",
                    borderRadius: "12px",
                    padding: "0.95rem",
                    color: "#FFFFFF",
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    cursor: publishing || !videoUrl ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 18px rgba(221, 42, 123, 0.35)",
                  }}
                >
                  <span>{publishing ? "Publishing to Instagram..." : "Publish Reel to Instagram 🚀"}</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 2: SCHEDULE POST */}
          {activeTab === "schedule" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0F172A" }}>
                  Select Target Date & Time:
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "10px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "0.9375rem",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>

              {scheduleSuccess && (
                <div style={{ padding: "0.75rem 1rem", background: "#D1FAE5", color: "#065F46", borderRadius: "10px", fontSize: "0.85rem", border: "1px solid #A7F3D0" }}>
                  ✓ Reel scheduled successfully for {new Date(scheduledDate).toLocaleString()}!
                </div>
              )}

              <button
                type="button"
                disabled={scheduling || !videoUrl}
                onClick={handleSchedulePost}
                className="gamma-gradient-btn"
                style={{
                  padding: "0.85rem",
                  fontSize: "0.9375rem",
                  fontWeight: 800,
                  justifyContent: "center",
                }}
              >
                <span>{scheduling ? "Scheduling..." : "Schedule Reel ⏱️"}</span>
              </button>

              {/* Existing Scheduled Queue */}
              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "1rem" }}>
                <h5 style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                  Upcoming Scheduled Reels ({scheduledPosts.length})
                </h5>
                {scheduledPosts.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "0.78125rem", color: "#94A3B8" }}>
                    No upcoming scheduled posts yet.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "150px", overflowY: "auto" }}>
                    {scheduledPosts.map((sp) => (
                      <div
                        key={sp._id}
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderRadius: "8px",
                          background: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.8125rem",
                        }}
                      >
                        <div>
                          <strong style={{ color: "#0F172A", display: "block" }}>{sp.projectTitle}</strong>
                          <span style={{ color: "#64748B", fontSize: "0.75rem" }}>
                            ⏱️ {new Date(sp.scheduledFor).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.6875rem", padding: "0.1rem 0.4rem", borderRadius: "10px", background: "#EEF2FF", color: "#4338CA", fontWeight: 700 }}>
                            {sp.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(sp._id)}
                            style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "0.75rem" }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT & API SETTINGS */}
          {activeTab === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#EEF2FF", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid #C7D2FE", fontSize: "0.8125rem", color: "#3730A3", lineHeight: 1.5 }}>
                ✦ <strong>Zero-Setup Developer Sandbox</strong> is active by default so you can test publishing flows without needing a verified Meta App. To connect a live account, paste your Instagram Professional Account ID and User Access Token below.
              </div>

              {/* Collapsible Step-by-Step Guide */}
              <div
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  background: "#F8FAFC",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "#4338CA",
                    textAlign: "left",
                  }}
                >
                  <span>📖 How to get your live Meta Token & Account ID (3 Steps)</span>
                  <span>{showGuide ? "▲" : "▼"}</span>
                </button>

                {showGuide && (
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      borderTop: "1px solid #E2E8F0",
                      fontSize: "0.78125rem",
                      color: "#334155",
                      lineHeight: 1.6,
                      background: "#FFFFFF",
                    }}
                  >
                    <ol style={{ margin: "0 0 0.75rem 1.2rem", padding: 0 }}>
                      <li style={{ marginBottom: "0.4rem" }}>
                        <strong>Switch Instagram Account:</strong> Open Instagram on your phone → <em>Settings → Account → Switch to Professional Account (Creator or Business)</em>. Connect it to any Facebook Page you manage.
                      </li>
                      <li style={{ marginBottom: "0.4rem" }}>
                        <strong>Meta Developer App:</strong> Go to{" "}
                        <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: "#4F46E5", textDecoration: "underline" }}>
                          developers.facebook.com
                        </a>
                        {" "}→ Create an App (Type: <em>Business</em>) → Add <strong>Instagram Graph API</strong>.
                      </li>
                      <li style={{ marginBottom: "0.4rem" }}>
                        <strong>Get Token & ID via Explorer:</strong> Open{" "}
                        <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: "#4F46E5", textDecoration: "underline" }}>
                          Meta Graph API Explorer
                        </a>
                        . Under <em>Permissions</em>, add <code>instagram_content_publish</code>, <code>instagram_basic</code>, and <code>pages_show_list</code>. Click <strong>Generate Access Token</strong>.
                      </li>
                      <li>
                        <strong>Find Account ID:</strong> Run <code>GET me/accounts?fields=instagram_business_account</code>. Copy the <code>instagram_business_account.id</code> (starts with 1784...) and paste it below with your token.
                      </li>
                    </ol>
                    <div style={{ padding: "0.5rem 0.75rem", background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "6px", color: "#92400E", fontSize: "0.75rem" }}>
                      💡 <strong>Localhost Note:</strong> When testing on your computer, Meta requires a public HTTPS URL to download videos. Use a tunnel like <code>ngrok http 3000</code> or test with the built-in Sandbox Mode.
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0F172A" }}>
                  Instagram Handle:
                </label>
                <input
                  type="text"
                  placeholder="e.g. vidyamotion.reels"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0F172A" }}>
                  Instagram Professional Account ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 17841405309211844"
                  value={customAccountId}
                  onChange={(e) => setCustomAccountId(e.target.value)}
                  style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0F172A" }}>
                  Meta Graph API User Access Token:
                </label>
                <input
                  type="password"
                  placeholder="EAAG... (Leave empty to use Sandbox Mode)"
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                />
              </div>

              <button
                type="button"
                disabled={savingAccount}
                onClick={handleSaveAccountSettings}
                className="gamma-gradient-btn"
                style={{ padding: "0.75rem", fontSize: "0.875rem", justifyContent: "center" }}
              >
                <span>{savingAccount ? "Saving..." : "Save Account Settings"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
