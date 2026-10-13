import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const title = "Concord: visual discharge instructions, verified";
const description =
  "Concord turns a discharge sheet into picture cards in 70 languages and checks every picture by read-back before the patient sees it.";

export const metadata: Metadata = {
  metadataBase: new URL("https://concord-health.vercel.app"),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Concord",
    title,
    description,
    images: [{ url: "/og.png", width: 1280, height: 720, alt: "A Concord medicine card with a checked picture for each instruction" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-accent="mono" data-theme="light" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
