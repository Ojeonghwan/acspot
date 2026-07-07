import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACSpot",
  description: "Find nearby cool spots and report air conditioning status."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
