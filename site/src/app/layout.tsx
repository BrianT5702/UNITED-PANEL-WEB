import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body-loaded",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display-loaded",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "United Panel-System | Cold Storage Panels Malaysia",
  description:
    "PIR, PU and RockWool insulated panels for cold storage — United Panel-System (M) Sdn Bhd.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${syne.variable}`}>{children}</body>
    </html>
  );
}
