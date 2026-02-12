"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Toast";
import { LayoutDashboard, CheckCircle, XCircle, Clock, IndianRupee } from "lucide-react";

interface Payment {
    id: number;
    fullName: string;
    email: string;
    mobile: string;
    amount?: string;
    payment_type: string;
    emi_option?: string;
    utr: string;
    status: string;
    uploaded_at: string;
}

export default function AdminPaymentsClient() {
    const router = useRouter();
    const { showToast } = useToast();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            router.push("/admin/login");
            return;
        }
        fetchPayments();
    }, [router]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/admin/payments/list"); // Correct endpoint check needed, legacy said /api/admin/payments/list
            if (res.data.payments) {
                setPayments(res.data.payments);
            } else {
                showToast("Failed to load payments", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        let regCollected = 0;
        let courseCollected = 0;
        let pendingAmount = 0;
        let pendingCount = 0;
        let rejectedCount = 0;

        payments.forEach(p => {
            const amt = Number(p.amount) || (p.payment_type === 'course_fee' ? 30000 : 1000);

            if (p.status === 'verified') {
                if (p.payment_type === 'course_fee') courseCollected += amt;
                else regCollected += amt;
            } else if (p.status === 'uploaded') {
                pendingAmount += amt;
                pendingCount++;
            } else if (p.status === 'rejected') {
                rejectedCount++;
            }
        });

        return { regCollected, courseCollected, pendingAmount, pendingCount, rejectedCount };
    }, [payments]);

    const handleAction = async (id: number, action: 'verify' | 'reject') => {
        if (!confirm(`${action === 'verify' ? 'Verify' : 'Reject'} this payment?`)) return;
        try {
            // Adjust endpoint to legacy: /admin/payment/:id/:action
            await api.put(`/admin/payment/${id}/${action}`);
            showToast(`Payment ${action}ed`, "success");
            fetchPayments();
        } catch (err) {
            showToast("Action failed", "error");
        }
    };

    return (
        <div className="container mx-auto px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment Management</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <StatCard label="Reg. Fee Collected" value={`₹${stats.regCollected.toLocaleString()}`} color="blue" />
                <StatCard label="Course Fee Collected" value={`₹${stats.courseCollected.toLocaleString()}`} color="green" />
                <StatCard label="Pending Amount" value={`₹${stats.pendingAmount.toLocaleString()}`} color="amber" />
                <StatCard label="Pending Count" value={stats.pendingCount} color="amber" />
                <StatCard label="Rejected" value={stats.rejectedCount} color="red" />
            </div>

            {/* Toolbar */}
            <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
                    <LayoutDashboard size={16} className="mr-2" />
                    {viewMode === 'table' ? 'Grid View' : 'Table View'}
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading payments...</div>
            ) : payments.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No payments found.</div>
            ) : viewMode === 'table' ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Applicant</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">UTR</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments.map(p => {
                                    const amt = Number(p.amount) || (p.payment_type === 'course_fee' ? 30000 : 1000);
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-gray-500">{p.id}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{p.fullName}</div>
                                                <div className="text-xs text-gray-500">{p.email}</div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">₹{amt.toLocaleString()}</td>
                                            <td className="px-4 py-3 capitalize">
                                                {p.payment_type.replace(/_/g, " ")}
                                                {p.emi_option && <span className="text-xs text-gray-500 block">({p.emi_option === 'emi' ? 'EMI' : 'Full'})</span>}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{p.utr}</td>
                                            <td className="px-4 py-3"><PaymentBadge status={p.status} /></td>
                                            <td className="px-4 py-3 text-gray-500">{new Date(p.uploaded_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <a
                                                    href={`/api/payment/screenshot/${p.id}?token=${localStorage.getItem("adminToken")}`}
                                                    target="_blank"
                                                    className="text-blue-600 hover:underline text-xs self-center mr-2"
                                                >
                                                    Screenshot
                                                </a>
                                                {p.status === 'uploaded' && (
                                                    <>
                                                        <Button onClick={() => handleAction(p.id, 'verify')} className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs">Verify</Button>
                                                        <Button onClick={() => handleAction(p.id, 'reject')} className="bg-red-600 hover:bg-red-700 text-white h-7 px-2 text-xs">Reject</Button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {payments.map(p => {
                        const amt = Number(p.amount) || (p.payment_type === 'course_fee' ? 30000 : 1000);
                        return (
                            <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between mb-2">
                                    <span className="font-mono text-xs text-gray-500">#{p.id}</span>
                                    <PaymentBadge status={p.status} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">{p.fullName}</h3>
                                <div className="text-xl font-bold text-gray-800 mb-2">₹{amt.toLocaleString()}</div>
                                <div className="text-sm text-gray-600 mb-4 capitalize">
                                    {p.payment_type.replace(/_/g, " ")}
                                    {p.emi_option && ` - ${p.emi_option === 'emi' ? 'EMI' : 'Full'}`}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <a
                                        href={`/api/payment/screenshot/${p.id}?token=${localStorage.getItem("adminToken")}`}
                                        target="_blank"
                                        className="flex-1 text-center py-2 border rounded text-sm hover:bg-gray-50"
                                    >
                                        Screenshot
                                    </a>
                                    {p.status === 'uploaded' && (
                                        <>
                                            <Button onClick={() => handleAction(p.id, 'verify')} className="bg-green-600 w-full">Verify</Button>
                                            <Button onClick={() => handleAction(p.id, 'reject')} className="bg-red-600 w-full">Reject</Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color }: any) {
    const colorClasses: any = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        green: "text-green-600 bg-green-50 border-green-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        red: "text-red-600 bg-red-50 border-red-100",
    };
    return (
        <div className={`p-4 rounded-lg border ${colorClasses[color]} flex flex-col`}>
            <span className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</span>
            <div className="text-xl font-bold mt-1">{value}</div>
        </div>
    );
}

function PaymentBadge({ status }: { status?: string }) {
    let color = "bg-gray-100 text-gray-500";
    let text = "Pending";

    if (status === "verified") { color = "bg-green-100 text-green-700"; text = "Verified"; }
    else if (status === "uploaded") { color = "bg-amber-100 text-amber-700"; text = "Review"; }
    else if (status === "rejected") { color = "bg-red-100 text-red-700"; text = "Rejected"; }

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${color}`}>
            {text}
        </span>
    );
}
