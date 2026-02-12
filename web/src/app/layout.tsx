"use client";

import "@/styles/modern-student.css";
import "@/styles/modern-ui.css";
import "@/styles/toast.css";
// import type { Metadata } from "next"; // Cannot have metadata in client component
import { Inter, Merriweather } from "next/font/google"; // Use built-in next fonts
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css"; // Ensure globals is imported
import Providers from "./providers"; // Import the provider
import { ToastProvider } from "@/components/ui/Toast";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";


const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-serif",
});

// export const metadata: Metadata = {
//   title: "PGCPAITL - Admission Portal",
//   description: "Official portal for Applications of PGCPAITL",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable}`}>
        <Providers>
          <ToastProvider>
            <div className="flex flex-col min-h-screen">

              <GlobalHeader />


              <main className="flex-1 w-full py-8 px-[2%] md:px-[5%]">
                {children}
              </main>

              <GlobalFooter />
            </div>
          </ToastProvider>
        </Providers>

      </body>
    </html>
  );
}
