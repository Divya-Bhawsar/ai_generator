"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.push("/sign-in");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      style={{
        background: "transparent",
        border: "1px solid #E8E5DF",
        borderRadius: "6px",
        padding: "0.4rem 0.75rem",
        fontSize: "0.8125rem",
        color: "#666B73",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = "#F25F4C";
        e.currentTarget.style.color = "#F25F4C";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = "#E8E5DF";
        e.currentTarget.style.color = "#666B73";
      }}
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
