import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/components/contexts/SettingsContext";
import { AuthProvider } from "@/components/contexts/AuthProvider";
import { OfficesProvider } from "@/components/contexts/OfficesContext";
import { DepartmentsProvider } from "@/components/contexts/DepartmentsContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CJC Student Clearance System",
  description: "Track your clearance across departments, offices, and organizations at Cor Jesu College — all in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-background">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=Geist:wght@500&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols Icons */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} h-full`} suppressHydrationWarning>
        <AuthProvider>
          <SettingsProvider>
            <OfficesProvider>
              <DepartmentsProvider>
                {children}
              </DepartmentsProvider>
            </OfficesProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
