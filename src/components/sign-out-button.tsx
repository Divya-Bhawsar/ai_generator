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
      const res = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to sign out");
      }
      router.push("/sign-in");
      router.refresh();
    } catch {
      setError("Sign out failed. Try again.");
      setLoading(false);
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
