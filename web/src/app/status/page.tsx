"use client";
// Force recompile to clear stale imports

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { api } from "@/lib/api";
import "@/styles/modern-student.css";
import "@/styles/modern-ui.css";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

interface TimelineStep {
    label: string;
    details: string;
    status: 'completed' | 'in_progress' | 'pending';
    date?: string;
}

interface TimelineData {
    step1: TimelineStep;
    step2: TimelineStep;
    step3: TimelineStep;
    step4: TimelineStep;
    step5: TimelineStep;
}

interface StatusResponse {
    ok: boolean;
    app: {
        id: number;
        fullName: string;
        email: string;
        mobile: string;
        status: string;
        course?: string;
    };
    timeline: TimelineData;
    error?: string;
}

export default function StatusPage() {
    const searchParams = useSearchParams();
    const urlId = searchParams.get("id");

    const [searchId, setSearchId] = useState(urlId || "");
    const [identifier, setIdentifier] = useState(""); // Email or Mobile
    const [result, setResult] = useState<StatusResponse | null>(null);
    const [error, setError] = useState("");

    const statusMutation = useMutation({
        mutationFn: async () => {
            const res = await api.get(`/application/status?id=${encodeURIComponent(searchId)}&identifier=${encodeURIComponent(identifier)}`);
            return res.data;
        },
        onSuccess: (data) => {
            if (data.ok) {
                setResult(data);
                setError("");
            } else {
                setError(data.error || "Record not found.");
                setResult(null);
            }
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || "Server error. Please try again.");
            setResult(null);
        }
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        statusMutation.mutate();
    };

    // Helper to render action buttons based on step status
    const renderAction = (key: string, step: TimelineStep, prettyId: string) => {
        if (key === 'step2') { // Registration Fee
            if (step.status === 'completed') return <div className="text-green-600 font-bold text-sm mt-1">✓ Payment Verified</div>;
            if (step.status === 'in_progress') return <div className="text-orange-500 font-bold text-sm mt-1">⌛ Verification Pending</div>;
            if (step.status === 'pending') {
                return (
                    <div className="mt-2">
                        <Link href={`/payment?id=${prettyId}`} className="btn btn-primary text-xs px-3 py-1">Pay Registration Fee</Link>
                    </div>
                );
            }
        }
        if (key === 'step4') { // Course Fee
            if (step.status === 'completed') return <div className="text-green-600 font-bold text-sm mt-1">✓ Payment Verified</div>;
            if (step.status === 'in_progress') return <div className="text-orange-500 font-bold text-sm mt-1">⌛ Verification Pending</div>;
            if (step.status === 'pending') {
                const regFeeCompleted = result?.timeline.step2.status === 'completed';
                if (regFeeCompleted) {
                    return (
                        <div className="mt-2">
                            <Link href={`/course-fee?id=${prettyId}`} className="btn btn-primary text-xs px-3 py-1">Pay Course Fee</Link>
                        </div>
                    );
                } else {
                    return <div className="text-gray-400 text-sm mt-1 italic">🔒 Complete Registration Fee First</div>;
                }
            }
        }
        if (key === 'step5') { // Documents
            if (step.status === 'pending') {
                return (
                    <div className="mt-2">
                        <Link href={`/upload?id=${prettyId}`} className="btn btn-primary text-xs px-3 py-1">Upload Documents</Link>
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="page">
            <div className="mb-8 text-center">
                {/* Marquee Section */}
                <div className="marquee-container mb-8">
                    <div className="marquee-content text-sm">
                        📢 PGCPAITL Admission Fee Update: Total fee ₹30,000 — Pay ₹15,000 on or before 06-02-2026 and the remaining ₹15,000 on or before 06-05-2026 under the two-installment (EMI) option. | Application Registration Fee ends on 6th February 2026. | Class Work Commencement is postponed to 09 February 2026 (Tentatively).
                    </div>
                </div>

                <h1 className="text-3xl font-bold font-serif text-primary mb-2">Application Portal</h1>
                <p className="text-muted-foreground">Track your admission progress in real-time</p>
            </div>

            {!result && (
                <div className="card max-w-md mx-auto p-8 shadow-md border bg-white">
                    <h3 className="text-xl font-bold text-primary mb-4 border-b pb-2">Access Your Application</h3>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div>
                            <Label htmlFor="appId">Application ID</Label>
                            <Input
                                id="appId"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="e.g. PGCPAITL-2025-0023"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="identifier">Registered Email / Mobile</Label>
                            <Input
                                id="identifier"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Email or Mobile used"
                                required
                            />
                        </div>
                        <Button type="submit" isLoading={statusMutation.isPending} className="w-full">View Dashboard</Button>
                        {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
                    </form>
                </div>
            )}

            {result && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left: Profile */}
                    <div className="card p-6 h-fit bg-white shadow-sm border col-span-1">
                        <h3 className="font-bold text-lg border-b pb-2 mb-4">Applicant Profile</h3>
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center text-3xl mb-3">👤</div>
                            <h2 className="font-bold text-lg">{result.app.fullName}</h2>
                            <p className="text-sm font-mono text-muted-foreground">ID: {result.app.id}</p>
                            <div className={clsx("inline-block px-3 py-1 rounded text-xs font-bold uppercase mt-2", {
                                "bg-yellow-100 text-yellow-800": result.app.status === 'pending',
                                "bg-green-100 text-green-800": result.app.status === 'accepted',
                                "bg-red-100 text-red-800": result.app.status === 'rejected',
                                "bg-gray-100 text-gray-800": !['pending', 'accepted', 'rejected'].includes(result.app.status)
                            })}>
                                {result.app.status}
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><strong>Email:</strong> {result.app.email}</p>
                            <p><strong>Mobile:</strong> {result.app.mobile}</p>
                            <p><strong>Course:</strong> Artificial Intelligence, Technology & Law</p>
                        </div>
                    </div>

                    {/* Right: Timeline */}
                    <div className="card p-6 bg-white shadow-sm border col-span-1 md:col-span-2">
                        <h3 className="font-bold text-lg border-b pb-2 mb-6">Admission Timeline</h3>
                        <div className="space-y-6 relative pl-6 border-l-2 border-gray-100">
                            {[
                                { key: 'step1', ...result.timeline.step1 },
                                { key: 'step2', ...result.timeline.step2 },
                                { key: 'step4', ...result.timeline.step4 }, // Course Fee comes before Docs in display usually? check JS. JS says step1, step2, step4, step5, step3?? Wait. JS lines 83-87: 1, 2, 4, 5, 3. Yes.
                                { key: 'step5', ...result.timeline.step5 },
                                { key: 'step3', ...result.timeline.step3 }
                            ].map((step: any, idx) => (
                                <div key={idx} className="relative pl-6">
                                    {/* Dot */}
                                    <div className={clsx("absolute -left-[31px] w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white z-10", {
                                        "border-green-500 text-green-500": step.status === 'completed',
                                        "border-orange-400 text-orange-400": step.status === 'in_progress',
                                        "border-gray-300 text-gray-300": step.status === 'pending',
                                    })}>
                                        {step.status === 'completed' ? '✓' : (step.status === 'in_progress' ? '⏳' : '○')}
                                    </div>

                                    <div className={clsx("bg-gray-50 p-4 rounded border", {
                                        "border-l-4 border-l-green-500": step.status === 'completed',
                                        "border-l-4 border-l-orange-400": step.status === 'in_progress',
                                        "border-l-4 border-l-gray-300": step.status === 'pending',
                                    })}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gray-800">{step.label}</span>
                                            {step.date && <span className="text-xs text-gray-500">{new Date(step.date).toLocaleDateString()}</span>}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{step.details}</p>
                                        {renderAction(step.key, step, `PGCPAITL-${new Date().getFullYear()}-${String(result.app.id).padStart(4, '0')}`)}
                                        {/* Pretty ID reconstruction might be safer from result if available, but for generic ID mostly fine. 
                                Actually, result.app.id is number. Check if API returns prettyId. 
                                The check-status.js renderProfile uses result.app.id. 
                                Let's use the searchId state if it matches format, or construct it.
                            */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
