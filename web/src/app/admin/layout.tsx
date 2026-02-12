"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("adminToken");
            router.push("/admin/login");
        }
    };

    // If login page, don't show layout
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/images/jntugv-logo.png" alt="Logo" className="h-10 w-10 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">Admin Console</h1>
                            <p className="text-xs text-gray-500">PGCPAITL Application Management</p>
                        </div>
                    </div>

                    <nav className="hidden md:flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <Link href="/admin/dashboard" className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${pathname === '/admin/dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                            Applications
                        </Link>
                        <Link href="/admin/payments" className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${pathname === '/admin/payments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                            Payments
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-9 px-4 text-sm">
                            Logout
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
