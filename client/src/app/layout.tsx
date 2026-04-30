"use client";

import { useEffect, useState } from "react";
import { Geist } from "next/font/google";
import AdminPortal from "@/components/AdminPortal";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  useEffect(() => {
    const handleOpenPortal = () => setIsPortalOpen(true);

    window.addEventListener("open-admin-portal", handleOpenPortal);

    return () => {
      window.removeEventListener("open-admin-portal", handleOpenPortal);
    };
  }, []);

  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} antialiased`}>
        {/* Admin Portal */}
        {isPortalOpen && <AdminPortal onClose={() => setIsPortalOpen(false)} />}

        {children}
      </body>
    </html>
  );
}
