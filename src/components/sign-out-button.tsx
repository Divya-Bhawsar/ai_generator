"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      // Hard redirect to landing page (/) so that all session cookies and caches are completely cleared
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="sign-out-btn"
        aria-label="Sign out of your account"
      >
        {loading ? "Signing out..." : "Sign out"}
      </button>
      {error && (
        <span style={{ fontSize: "0.6875rem", color: "#F25F4C", marginTop: "2px" }}>
          {error}
        </span>
      )}
    </div>
  );
}
