import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClientLayout } from "@/components/ui/ClientLayout";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DocuWiki.AI — Deterministic PDF Knowledge Management",
  description:
    "Convert PDFs into interconnected, structured knowledge graphs using the Open Knowledge Format (OKF v0.1). Zero hallucination, 100% interoperable, deterministic knowledge management.",
  keywords: [
    "PDF",
    "knowledge graph",
    "OKF",
    "Open Knowledge Format",
    "AI",
    "document processing",
    "markdown",
    "knowledge base",
  ],
  authors: [{ name: "DocuWiki.AI" }],
  openGraph: {
    title: "DocuWiki.AI — Deterministic PDF Knowledge Management",
    description:
      "Convert PDFs into structured, interlinked knowledge using OKF v0.1",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
