import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#315ceb",
              colorPrimaryForeground: "#ffffff",
              colorForeground: "#17191f",
              colorMutedForeground: "#666b73",
              colorBackground: "#ffffff",
              colorInput: "#faf9f6",
              colorInputForeground: "#17191f",
              borderRadius: "8px",
              fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
