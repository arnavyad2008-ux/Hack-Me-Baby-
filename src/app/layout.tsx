import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hack Me Baby // Adversarial Code Audit Arena",
  description: "Automated Dual-Agent Red vs Blue Security Audit Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen overflow-hidden bg-cyber-bg text-cyber-text antialiased">
        {children}
      </body>
    </html>
  );
}
