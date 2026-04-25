import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPT Image 2",
  description: "A personal browser-only GPT Image 2 generator."
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
