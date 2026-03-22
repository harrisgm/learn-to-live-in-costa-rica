import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Costa Rica Spanish Coach",
  description:
    "A local-first text coaching scaffold for practical Spanish practice and Costa Rica roleplay."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
