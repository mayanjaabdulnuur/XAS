import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Xtream Advanced Scholars",
  description: "LEARN • GROW • EXCEL — O Level & A Level study resources",
  robots: { index: false, follow: false }, // no SEO indexing during this build phase
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-xas-navy text-white min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
