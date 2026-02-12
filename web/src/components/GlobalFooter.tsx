"use client";

import React from "react";

export default function GlobalFooter() {
    return (
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
    );
}
