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
  const pathname = usePathname();

  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable}`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <nav className="navbar">
              <div className="space-y-0 text-white">
                <p className="font-serif font-bold text-lg leading-tight tracking-wide uppercase">PGCPAITL ADMISSIONS</p>
                <p className="text-[10px] opacity-80 italic max-w-xs leading-none">Post Graduate Certificate Programme in Artificial Intelligence, Technology & Law</p>
              </div>

              <ul className="nav-links">
                <li><Link href="/" className={pathname === "/" ? "active" : ""}>Application Page</Link></li>
                <li><Link href="/status" className={pathname === "/status" ? "active" : ""}>Track Status</Link></li>
                <li><Link href="/rules" className={pathname === "/rules" ? "active" : ""}>Fee Rules</Link></li>
              </ul>
            </nav>

            <main className="flex-1 w-full py-8 px-[2%] md:px-[5%]">
              {children}
            </main>

            <footer className="bg-primary text-white p-10 mt-12 border-t border-white/10">
              <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 px-[5%] text-center md:text-left">
                <div className="space-y-2">
                  <p className="font-serif font-bold text-xl tracking-wide uppercase">PGCPAITL ADMISSIONS</p>
                  <p className="text-xs opacity-60 italic max-w-xs">Post Graduate Certificate Programme in Artificial Intelligence, Technology & Law</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium opacity-90">&copy; {new Date().getFullYear()} PGCPAITL. All rights reserved.</p>
                  <p className="text-xs opacity-70">
                    Designed & Developed by{" "}
                    <a href="https://www.dmc.jntugv.edu.in" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-white transition-colors underline-offset-4 hover:underline">
                      Digital Monitoring Cell
                    </a>
                    {" "} & {" "}
                    <a href="https://www.jntugv.edu.in" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-white transition-colors underline-offset-4 hover:underline">
                      JNTUGV
                    </a>
                  </p>
                </div>

                <div className="flex gap-4 mt-2">
                  <a href="mailto:applicationspgcpaitl@jntugv.edu.in" className="text-xs border border-white/20 px-4 py-2 rounded-full hover:bg-white/10 transition-all font-medium">
                    Support / Contact
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
