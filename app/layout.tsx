import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CampusOS — Smart Campus Operating System",
  description:
    "A unified smart campus platform for attendance, complaints, navigation, and student services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
