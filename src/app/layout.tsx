import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VidyaMotion — Clear explainers for visual learning",
  description:
    "Turn educational ideas into clear, narrated animated explainers with VidyaMotion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
