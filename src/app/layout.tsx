import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Modern expense tracking application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${geist.className} h-full`}>
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gray-50 px-8 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
