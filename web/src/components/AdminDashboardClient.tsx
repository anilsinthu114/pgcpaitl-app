"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import * as XLSX from "xlsx";
import { useForm } from "react-hook-form";

// UI Components
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { useToast } from "./ui/Toast";

// Icons (Lucide)
import {
    LayoutDashboard, Users, CreditCard, FileText, CheckCircle,
    XCircle, Clock, Search, Download, Mail, Filter
} from "lucide-react";

// Types
interface Application {
    id: number;
    fullName: string;
    email: string;
    mobile: string;
    status: string;
    payment_status?: string;
    payment_type?: string;
    submitted_at?: string;
    created_at: string;
    degreeLevel?: string;
    course_emi_option?: string;
    [key: string]: any;
}

interface Stats {
    total: number;
    submitted: number;
    pending: number;
    reviewing: number;
    accepted: number;
    rejected: number;
    verified: number;
}

export default function AdminDashboardClient() {
    const router = useRouter();
    const { showToast } = useToast();

    // State
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Modals
    const [selectedApp, setSelectedApp] = useState<Application | null>(null); // For Detail Modal
    const [detailLoading, setDetailLoading] = useState(false);
    const [appDetails, setAppDetails] = useState<any>(null); // Full details including files/payments

    const [mailModal, setMailModal] = useState<{ open: boolean, type: 'individual' | 'group', target?: any }>({ open: false, type: 'individual' });

    // Initial Load
    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            router.push("/admin/login");
            return;
        }
        fetchApplications();
    }, [router]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/applications");
            if (res.data.ok) {
                setApps(res.data.items);
            } else {
                showToast("Failed to load applications", "error");
            }
        } catch (err) {
            console.error(err);
            // Handle 401 implicitly via api interceptor logic if added, or manual check
        } finally {
            setLoading(false);
        }
    };

    // Derived State: Filtered Apps
    const filteredApps = useMemo(() => {
        return apps.filter(app => {
            // Search
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                app.fullName?.toLowerCase().includes(searchLower) ||
                app.email?.toLowerCase().includes(searchLower) ||
                String(app.id).includes(searchLower);

            if (!matchesSearch) return false;

            // Status Filter
            let statusMatch = true;
            if (statusFilter !== "all") {
                if (statusFilter === "submitted") statusMatch = (app.status === "submitted" || app.status === "payment_pending");
                else if (statusFilter === "verified") statusMatch = (app.payment_status === "verified");
                else if (statusFilter === "accepted") statusMatch = (app.status === "accepted");
                else if (statusFilter === "rejected") statusMatch = (app.status === "rejected" || app.payment_status === "rejected");
                else if (statusFilter === "reviewing") statusMatch = (app.payment_status === "uploaded" || app.status === "reviewing");
                else statusMatch = (app.status === statusFilter);
            }

            // Payment Filter
            let paymentMatch = true;
            if (paymentFilter !== "all") {
                const pStatus = (app.payment_status || "pending").toLowerCase();
                if (paymentFilter === "pending") paymentMatch = (pStatus !== "verified" && pStatus !== "uploaded" && pStatus !== "rejected");
                else paymentMatch = (pStatus === paymentFilter);
            }

            return statusMatch && paymentMatch;
        });
    }, [apps, statusFilter, paymentFilter, searchQuery]);

    // Derived State: Stats
    const stats: Stats = useMemo(() => {
        return {
            total: apps.length,
            submitted: apps.filter(a => a.status === "submitted" && a.payment_status === "verified").length,
            pending: apps.filter(a => a.status === "payment_pending" || (a.status === "submitted" && a.payment_status !== "verified")).length,
            reviewing: apps.filter(a => a.payment_status === "uploaded" && a.status !== "accepted" && a.status !== "rejected").length,
            accepted: apps.filter(a => a.status === "accepted").length,
            rejected: apps.filter(a => a.status === "rejected").length,
            verified: apps.filter(a => a.payment_status === "verified").length
        };
    }, [apps]);

    // Actions
    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        router.push("/admin/login");
    };

    const handleExport = () => {
        if (filteredApps.length === 0) {
            showToast("No data to export", "info");
            return;
        }

        const data = filteredApps.map(app => ({
            "ID": app.id,
            "Name": app.fullName,
            "Email": app.email,
            "Mobile": app.mobile,
            "Status": app.status,
            "Payment Status": app.payment_status || "Pending",
            "Degree": app.degreeLevel,
            "Applied Date": new Date(app.created_at).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Applications");
        XLSX.writeFile(wb, `PGCPAITL_Applications_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const fetchAppDetails = async (id: number) => {
        setDetailLoading(true);
        try {
            const res = await api.get(`/application/${id}`);
            if (res.data.ok) {
                setAppDetails(res.data);
                setSelectedApp(res.data.application);
            }
        } catch (err) {
            showToast("Failed to fetch details", "error");
        } finally {
            setDetailLoading(false);
        }
    };

    // Sub-components can be extracted later, keeping inline for now to match velocity

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <StatCard label="Total Apps" value={stats.total} color="blue" icon={<Users size={16} />} />
                    <StatCard label="Submitted" value={stats.submitted} color="green" icon={<CheckCircle size={16} />} />
                    <StatCard label="Pending" value={stats.pending} color="amber" icon={<Clock size={16} />} />
                    <StatCard label="Under Review" value={stats.reviewing} color="purple" icon={<FileText size={16} />} />
                    <StatCard label="Accepted" value={stats.accepted} color="indigo" icon={<CheckCircle size={16} />} />
                    <StatCard label="Rejected" value={stats.rejected} color="red" icon={<XCircle size={16} />} />
                </div>

                {/* Toolbar */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 z-10 transition-all">
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                                placeholder="Search applicants..."
                                className="pl-9 w-full md:w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full md:w-40">
                            <option value="all">All Status</option>
                            <option value="submitted">Submitted</option>
                            <option value="verified">Verified</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="reviewing">Under Review</option>
                        </Select>
                        <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="w-full md:w-40">
                            <option value="all">All Payment</option>
                            <option value="verified">Verified</option>
                            <option value="pending">Pending</option>
                            <option value="uploaded">Uploaded</option>
                        </Select>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                        <Button variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
                            <LayoutDashboard size={16} className="mr-2" />
                            {viewMode === 'table' ? 'Grid View' : 'Table View'}
                        </Button>
                        <Button variant="outline" onClick={handleExport} className="whitespace-nowrap">
                            <Download size={16} className="mr-2" />
                            Export Excel
                        </Button>
                        <Button onClick={() => setMailModal({ open: true, type: 'group' })} className="whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white">
                            <Mail size={16} className="mr-2" />
                            Group Mail
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading applications...</div>
                ) : filteredApps.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
                        <div className="inline-block p-4 bg-gray-100 rounded-full mb-4"><Search className="text-gray-400" size={24} /></div>
                        <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters</p>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Payment</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredApps.map(app => (
                                        <tr key={app.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fetchAppDetails(app.id)}>
                                            <td className="px-4 py-3 font-mono text-gray-500">#{app.id}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{app.fullName}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                <div className="flex flex-col">
                                                    <span>{app.email}</span>
                                                    <span className="text-xs text-gray-400">{app.mobile}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                                            <td className="px-4 py-3"><PaymentBadge status={app.payment_status} /></td>
                                            <td className="px-4 py-3 text-gray-500">{new Date(app.created_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="outline" className="text-blue-600 border-none bg-blue-50 hover:bg-blue-100">View</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                            <span>Showing {filteredApps.length} applications</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredApps.map(app => (
                            <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => fetchAppDetails(app.id)}>
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">#{app.id}</span>
                                    <StatusBadge status={app.status} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1 truncate" title={app.fullName}>{app.fullName}</h3>
                                <p className="text-sm text-gray-500 mb-4 truncate">{app.email}</p>

                                <div className="space-y-2 text-xs text-gray-600 mb-4 border-t border-gray-100 pt-3">
                                    <div className="flex justify-between">
                                        <span>Payment:</span>
                                        <PaymentBadge status={app.payment_status} />
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Applied:</span>
                                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <Button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200">View Details</Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals - Can make these separate components */}
            {selectedApp && (
                <ApplicationDetailModal
                    app={selectedApp}
                    details={appDetails}
                    onClose={() => setSelectedApp(null)}
                    onRefresh={fetchApplications}
                    loading={detailLoading}
                    onSendMail={() => setMailModal({ open: true, type: 'individual', target: selectedApp })}
                />
            )}

            {mailModal.open && (
                <MailModal
                    type={mailModal.type}
                    target={mailModal.target}
                    onClose={() => setMailModal({ ...mailModal, open: false })}
                />
            )}
        </div>
    );
}

// -- SUB COMPONENTS -- //

function StatCard({ label, value, color, icon }: any) {
    const colorClasses: any = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        green: "text-green-600 bg-green-50 border-green-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100",
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        red: "text-red-600 bg-red-50 border-red-100",
    };

    return (
        <div className={`p-4 rounded-lg border ${colorClasses[color]} flex flex-col`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    let color = "bg-gray-100 text-gray-700";
    if (status === "accepted") color = "bg-green-100 text-green-700";
    if (status === "rejected") color = "bg-red-100 text-red-700";
    if (status === "reviewing") color = "bg-purple-100 text-purple-700";
    if (status === "submitted") color = "bg-blue-100 text-blue-700";

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${color} capitalize`}>
            {status?.replace(/_/g, " ") || "Draft"}
        </span>
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

function ApplicationDetailModal({ app, details, onClose, onRefresh, loading, onSendMail }: any) {
    const { showToast } = useToast();
    if (!details && loading) return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg animate-pulse">Loading View...</div>
        </div>
    );
    if (!details) return null;

    const { files = [], payments = [] } = details;

    const handleAction = async (action: string) => {
        if (!confirm(`Are you sure you want to mark this application as ${action}?`)) return;
        try {
            await api.put(`/application/${app.id}/status`, { status: action });
            showToast(`Application marked as ${action}`, "success");
            onRefresh();
            onClose();
        } catch (err) {
            showToast("Action failed", "error");
        }
    };

    const verifyPayment = async (pid: number) => {
        try {
            await api.put(`/admin/payment/${pid}/verify`);
            showToast("Payment Verified", "success");
            // Simple hack: refresh whole app list for now
            onRefresh();
        } catch (err) {
            showToast("Verification failed", "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-lg text-gray-800">Application #{app.id}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><XCircle size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-900 border-b pb-2 mb-2">Personal Details</h3>
                            <DetailRow label="Full Name" value={app.fullName} />
                            <DetailRow label="Email" value={app.email} />
                            <DetailRow label="Mobile" value={app.mobile} />
                            <DetailRow label="Gender" value={app.gender} />
                            <DetailRow label="Category" value={app.category} />
                            <DetailRow label="Address" value={app.address} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-900 border-b pb-2 mb-2">Academic Info</h3>
                            <DetailRow label="Degree Level" value={app.degreeLevel} />
                            <DetailRow label="Institute" value={app.instituteName} />
                            <DetailRow label="Percentage" value={app.passingPercentage} />
                            <DetailRow label="Passing Year" value={app.passingYear} />
                            <DetailRow label="SOP" value={app.sop} isLong />
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">Payment History</h3>
                        {payments.length === 0 ? <p className="text-gray-400 text-sm">No payments recorded.</p> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border border-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                                            <th className="p-2">Date</th>
                                            <th className="p-2">Type</th>
                                            <th className="p-2">UTR</th>
                                            <th className="p-2">Status</th>
                                            <th className="p-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {payments.map((p: any) => (
                                            <tr key={p.id}>
                                                <td className="p-2">{new Date(p.uploaded_at).toLocaleDateString()}</td>
                                                <td className="p-2 font-medium">{p.payment_type}</td>
                                                <td className="p-2">{p.utr}</td>
                                                <td className="p-2"><PaymentBadge status={p.status} /></td>
                                                <td className="p-2 flex gap-2">
                                                    <a href={`/api/payment/screenshot/${p.id}?token=${localStorage.getItem("adminToken")}`} target="_blank" className="text-blue-600 hover:underline text-xs">Screenshot</a>
                                                    {p.status === 'uploaded' && (
                                                        <button onClick={() => verifyPayment(p.id)} className="text-green-600 font-bold text-xs border border-green-200 px-2 py-1 rounded hover:bg-green-50">VERIFY</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">Uploaded Documents</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {files.map((f: any) => (
                                <a
                                    key={f.id}
                                    href={`/api/application/file/${f.id}?token=${localStorage.getItem("adminToken")}`}
                                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all text-center group"
                                    target="_blank"
                                >
                                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📄</div>
                                    <div className="text-sm font-medium text-gray-700 truncate">{f.type}</div>
                                    <div className="text-xs text-gray-400 truncate">{f.original_name}</div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <Button variant="outline" onClick={onSendMail}>Send Message</Button>
                    <div className="w-px bg-gray-300 mx-2"></div>
                    <Button onClick={() => handleAction('rejected')} className="bg-red-600 hover:bg-red-700 text-white">Reject</Button>
                    <Button onClick={() => handleAction('reviewing')} className="bg-purple-600 hover:bg-purple-700 text-white">Reviewing</Button>
                    <Button onClick={() => handleAction('accepted')} className="bg-green-600 hover:bg-green-700 text-white">Accept Application</Button>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value, isLong }: any) {
    return (
        <div className={`text-sm ${isLong ? 'col-span-2' : ''}`}>
            <span className="text-gray-500 block text-xs uppercase tracking-wide">{label}</span>
            <span className="font-medium text-gray-900">{value || '-'}</span>
        </div>
    );
}

function MailModal({ type, target, onClose }: any) {
    const { register, handleSubmit } = useForm();
    const { showToast } = useToast();
    const [sending, setSending] = useState(false);

    const onSubmit = async (data: any) => {
        setSending(true);
        try {
            // Implement API call for mail
            showToast("Mail functionality placeholder", "info");
            onClose();
        } catch (err) {
            showToast("Failed to send mail", "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                <h2 className="text-lg font-bold mb-4">{type === 'group' ? 'Send Broadcast Email' : 'Send Individual Email'}</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {type === 'individual' && <div className="text-sm text-gray-600">To: <strong>{target.fullName}</strong> ({target.email})</div>}

                    {type === 'group' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Target Group</label>
                            <Select {...register("group")} className="w-full">
                                <option value="all">All Applicants</option>
                                <option value="accepted">Accepted</option>
                                <option value="pending">Pending</option>
                            </Select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Subject</label>
                        <Input {...register("subject", { required: true })} className="w-full" placeholder="Email Subject" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Message</label>
                        <Textarea {...register("message", { required: true })} className="w-full h-32" placeholder="Write your message..." />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={sending}>Send Mail</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
