"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import "@/styles/modern-student.css";

export default function GlobalHeader() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="navbar !h-auto !py-4 !px-4 md:!px-[5%]" style={{ flexDirection: 'column' }}>
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 relative">
                {/* Left: Logo & Title */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-3">
                        <img src="/images/jntugv-logo.png" alt="JNTU-GV Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                        <div className="text-white text-left">
                            <p className="font-serif font-bold text-sm md:text-lg leading-tight tracking-wide uppercase">PGCPAITL ADMISSIONS</p>
                            <p className="text-[10px] opacity-80 italic max-w-xs leading-none hidden md:block">Post Graduate Certificate Programme in Artificial Intelligence, Technology & Law</p>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden absolute right-0 top-2 text-white/90 hover:text-white hover:bg-white/10 p-2 rounded transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle Menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>

                {/* Center: Navigation Links */}
                <div className={clsx("w-full md:w-auto overflow-hidden transition-all duration-300 ease-in-out", {
                    "max-h-0 opacity-0 md:max-h-full md:opacity-100": !isMenuOpen,
                    "max-h-96 opacity-100 mt-4 md:mt-0": isMenuOpen
                })}>
                    <ul className="nav-links !flex-col md:!flex-row items-center gap-4 md:gap-8 !m-0 !p-0 w-full">
                        <li className="w-full md:w-auto text-center"><Link href="/" className={clsx("block py-2 md:py-0 hover:text-white transition-colors", pathname === "/" ? "active !text-accent font-bold" : "text-white/90")} onClick={() => setIsMenuOpen(false)}>Home</Link></li>
                        <li className="w-full md:w-auto text-center"><Link href="/status" className={clsx("block py-2 md:py-0 hover:text-white transition-colors", pathname === "/status" ? "active !text-accent font-bold" : "text-white/90")} onClick={() => setIsMenuOpen(false)}>Track Status</Link></li>
                        <li className="w-full md:w-auto text-center"><Link href="/rules" className={clsx("block py-2 md:py-0 hover:text-white transition-colors", pathname === "/rules" ? "active !text-accent font-bold" : "text-white/90")} onClick={() => setIsMenuOpen(false)}>Fee Rules</Link></li>
                        <li className="w-full md:w-auto text-center"><Link href="/" className="nav-btn block py-2 md:py-1 px-4 rounded-full bg-accent text-primary-dark font-bold hover:bg-orange-600 transition-colors" onClick={() => setIsMenuOpen(false)}>Apply Now</Link></li>
                    </ul>
                </div>

                {/* Right: Partner Logo */}
                <div className="hidden md:flex items-center gap-4">
                    <img src="/images/dsnlu-logo.png" alt="DSNLU Logo" className="w-16 h-16 object-contain" />
                </div>
            </div>
        </nav>
    );
}
