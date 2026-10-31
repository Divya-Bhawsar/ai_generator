"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {error && (
        <div
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            background: "#FEE2E2",
            color: "#991B1B",
            borderRadius: "6px",
            fontSize: "0.875rem",
            border: "1px solid #FCA5A5",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <label htmlFor="signin-email" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#17191F" }}>
          Email address
        </label>
        <input
          id="signin-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="creator@vidyamotion.com"
          disabled={loading}
          style={{
            padding: "0.625rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #E8E5DF",
            background: "#FAF9F6",
            fontSize: "0.9375rem",
            color: "#17191F",
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label htmlFor="signin-password" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#17191F" }}>
            Password
          </label>
        </div>
        <input
          id="signin-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={loading}
          style={{
            padding: "0.625rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #E8E5DF",
            background: "#FAF9F6",
            fontSize: "0.9375rem",
            color: "#17191F",
            outline: "none",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="button"
        style={{
          marginTop: "0.5rem",
          width: "100%",
          padding: "0.75rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.75 : 1,
        }}
      >
        {loading ? "Signing in..." : "Sign in to workspace →"}
      </button>
    </form>
  );
}
