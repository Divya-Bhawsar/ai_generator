"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstagramCreateModal } from "./instagram-create-modal";

interface NavItem {
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
}

export function InstagramBottomNav() {
  const pathname = usePathname();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: "Home",
      href: "/dashboard",
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FFFFFF" : "none"} stroke="#FFFFFF" strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22" fill={active ? "#000000" : "none"} stroke={active ? "#000000" : "#FFFFFF"} strokeWidth="2"></polyline>
        </svg>
      ),
    },
    {
      label: "Explore",
      href: "/explore",
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={active ? "3" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      ),
    },
    {
      label: "Reels",
      href: "/reels",
      icon: (active) => (
        <div style={{ position: "relative" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FFFFFF" : "none"} stroke="#FFFFFF" strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <polygon points="10 8 16 12 10 16 10 8" fill={active ? "#000000" : "#FFFFFF"} stroke="none"></polygon>
          </svg>
          {active && (
            <span
              style={{
                position: "absolute",
                bottom: "-6px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: "#DD2A7B",
              }}
            />
          )}
        </div>
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: (active) => (
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            border: active ? "2px solid #FFFFFF" : "1.5px solid rgba(255, 255, 255, 0.4)",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          👤
        </div>
      ),
    },
  ];

  return (
    <>
      <nav
        aria-label="Instagram Mobile Navigation"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "56px",
          background: "rgba(10, 10, 12, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 0.5rem",
          zIndex: 1000,
        }}
      >
        {/* Home */}
        <Link
          href={navItems[0].href}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "50px",
            height: "100%",
            opacity: pathname === navItems[0].href ? 1 : 0.6,
            transition: "opacity 0.15s ease",
          }}
        >
          {navItems[0].icon(pathname === navItems[0].href)}
        </Link>

        {/* Explore */}
        <Link
          href={navItems[1].href}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "50px",
            height: "100%",
            opacity: pathname === navItems[1].href ? 1 : 0.6,
            transition: "opacity 0.15s ease",
          }}
        >
          {navItems[1].icon(pathname === navItems[1].href)}
        </Link>

        {/* Center [+] Create Button */}
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          title="Create Explainer Reel"
          style={{
            width: "42px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)",
            border: "none",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(221, 42, 123, 0.4)",
            color: "#FFFFFF",
            transition: "transform 0.15s ease",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.92)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        {/* Reels */}
        <Link
          href={navItems[2].href}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "50px",
            height: "100%",
            opacity: pathname === navItems[2].href ? 1 : 0.6,
            transition: "opacity 0.15s ease",
          }}
        >
          {navItems[2].icon(pathname === navItems[2].href)}
        </Link>

        {/* Profile */}
        <Link
          href={navItems[3].href}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "50px",
            height: "100%",
            opacity: pathname === navItems[3].href ? 1 : 0.6,
            transition: "opacity 0.15s ease",
          }}
        >
          {navItems[3].icon(pathname === navItems[3].href)}
        </Link>
      </nav>

      {/* Floating Create Modal */}
      <InstagramCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}
