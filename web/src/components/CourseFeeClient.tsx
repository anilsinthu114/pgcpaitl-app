"use client";

import { api } from "@/lib/api";
import "@/styles/gateway.css";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

interface PaymentValues {
    application_id: string; // Numeric ID from resolution
    utr: string;
    screenshot: FileList;
    amount: string;
    fee_opt: string;
    payment_type: string;
}

export default function CourseFeeClient() {
    const searchParams = useSearchParams();
    const prettyId = searchParams.get("id");
    const [numericId, setNumericId] = useState<number | null>(null);
    const [feeOption, setFeeOption] = useState<'full' | 'emi'>('full');
    const [isSecondInstallment, setIsSecondInstallment] = useState(false);
    const [isFullyPaid, setIsFullyPaid] = useState(false);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<PaymentValues>();

    useEffect(() => {
        if (!prettyId) return;
        api.get(`/resolve-id?pretty=${encodeURIComponent(prettyId)}`).then(res => {
            if (res.data.ok) {
                setNumericId(res.data.id);
                setValue("application_id", String(res.data.id));

                const coursePaid = Number(res.data.coursePaid || 0);
                if (coursePaid >= 30000) {
                    setIsFullyPaid(true);
                } else if (coursePaid >= 15000) {
                    setIsSecondInstallment(true);
                    setFeeOption('emi');
                }
            }
        }).catch(err => console.error("ID Resolution failed", err));
    }, [prettyId, setValue]);

    const mutation = useMutation({
        mutationFn: async (data: PaymentValues) => {
            const formData = new FormData();
            formData.append("application_id", String(numericId));
            formData.append("utr", data.utr);
            // We set payment_type to course_fee to match backend handling for course vs registration
            formData.append("payment_type", "course_fee");

            let amount = "30000";
            if (feeOption === 'emi') amount = "15000";

            formData.append("amount", amount);
            formData.append("fee_opt", feeOption);

            if (data.screenshot && data.screenshot[0]) {
                formData.append("screenshot", data.screenshot[0]);
            }

            // Override baseURL to empty string to hit the proxy rewrite handling /payment/submit
            const res = await api.post("/payment/submit", formData, {
                baseURL: "",
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        },
        onSuccess: (data: any) => {
            alert(data.message || "Payment Submitted Successfully");
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                window.location.href = `/upload?id=${prettyId}`;
            }
        },
        onError: (err: any) => {
            alert("Payment submission failed: " + (err.response?.data?.error || err.message));
        }
    });

    if (!prettyId) return <div className="p-8 text-center text-red-500">Missing Application ID.</div>;
    if (isFullyPaid) {
        return (
            <div className="max-w-md mx-auto mt-8 p-8 bg-green-50 border border-green-200 rounded-lg text-center">
                <h2 className="text-2xl font-bold text-green-700 mb-2">Course Fee Fully Paid</h2>
                <p className="text-green-600 mb-6">You have already completed the full course fee payment of ₹30,000.</p>
                <Button onClick={() => window.location.href = `/upload?id=${prettyId}`}>Proceed to Document Upload</Button>
            </div>
        );
    }

    const currentAmount = feeOption === 'full' ? "30,000" : "15,000";
    const label = feeOption === 'full' ? "Full Payment" : (isSecondInstallment ? "Second Installment (EMI)" : "First Installment (EMI)");

    return (
        <div className="page">
            <div className="gateway-wrapper flex flex-col md:flex-row gap-8 animate-fade-in">
                {/* Left Panel */}
                <div className="gateway-left p-8 rounded-lg flex-1 shadow-xl">
                    <h2 className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">Secure Checkout</h2>
                    <h1 className="text-3xl font-serif font-bold mb-8">PGCPAITL Course Fee</h1>

                    <div className="mb-8">
                        <div className="text-sm opacity-80">Total Amount Due</div>
                        <div className="text-4xl font-bold my-1">₹{currentAmount}</div>
                        <div className="text-xs opacity-60">{label}</div>
                    </div>

                    <div className="space-y-3 text-sm opacity-90 border-t border-white/20 pt-6">
                        <div className="flex justify-between"><span>Application ID</span> <strong className="font-mono">{prettyId}</strong></div>
                        <div className="flex justify-between"><span>Program</span> <strong>PG Certificate in AI & Law</strong></div>
                        <div className="flex justify-between"><span>Session</span> <strong>2025-2026</strong></div>
                    </div>

                    <div className="mt-12 text-xs opacity-50">
                        © 2025 JNTU-GV. Secure Payment Portal.
                    </div>
                </div>

                {/* Right Panel */}
                <div className="bg-white p-8 rounded-lg flex-[1.5] shadow-md border border-gray-200">
                    <div className="flex items-center gap-2 mb-6 text-primary font-bold text-lg border-b pb-4">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.4z" /></svg>
                        Complete Your Payment
                    </div>

                    {/* EMI Selection */}
                    {!isSecondInstallment && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-blue-900">Select Payment Option</h4>
                                <a href="/rules" target="_blank" className="text-xs text-blue-600 underline">View Rules</a>
                            </div>
                            <div className="flex gap-4">
                                <label className={clsx("flex-1 p-3 border-2 rounded cursor-pointer text-center bg-white transition-all", {
                                    "border-blue-500 bg-blue-50": feeOption === 'full',
                                    "border-gray-200": feeOption !== 'full'
                                })}>
                                    <input type="radio" name="opt" className="hidden" checked={feeOption === 'full'} onChange={() => setFeeOption('full')} />
                                    <div className="font-bold">Full Payment</div>
                                    <div className="text-sm">₹30,000</div>
                                </label>
                                <label className={clsx("flex-1 p-3 border-2 rounded cursor-pointer text-center bg-white transition-all", {
                                    "border-blue-500 bg-blue-50": feeOption === 'emi',
                                    "border-gray-200": feeOption !== 'emi'
                                })}>
                                    <input type="radio" name="opt" className="hidden" checked={feeOption === 'emi'} onChange={() => setFeeOption('emi')} />
                                    <div className="font-bold">Installment (EMI)</div>
                                    <div className="text-sm">₹15,000</div>
                                </label>
                            </div>
                        </div>
                    )}

                    {isSecondInstallment && (
                        <div className="bg-green-50 p-4 rounded mb-6 text-center border border-green-200 text-green-800 text-sm font-bold">
                            Paying 2nd Installment: ₹15,000
                        </div>
                    )}

                    <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 mb-6 border border-yellow-200">
                        1. Scan QR Code via UPI App.<br />
                        2. Enter UTR Number & Upload Screenshot.
                    </div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="qr-frame mb-2">
                            {/* QR Code Image */}
                            <img src="/qr/sbi-qr.jpg" alt="SBI QR" className="w-48 h-48 object-contain" />
                        </div>
                        <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">registrarpgcp@sbi</div>
                        <div className="text-xs text-gray-500 mt-1">State Bank of India</div>
                    </div>

                    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                        <div>
                            <Label htmlFor="utr">UTR / Reference Number</Label>
                            <Input id="utr" {...register("utr", { required: "UTR is required" })} placeholder="Enter 12-digit UTR" />
                            {errors.utr && <p className="text-red-500 text-sm mt-1">{errors.utr.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="screenshot">Upload Payment Screenshot</Label>
                            <Input
                                id="screenshot"
                                type="file"
                                accept="image/*"
                                {...register("screenshot", { required: "Screenshot is required" })}
                                className="pt-1"
                            />
                            {errors.screenshot && <p className="text-red-500 text-sm mt-1">{errors.screenshot.message}</p>}
                        </div>

                        <Button type="submit" isLoading={mutation.isPending} className="w-full text-lg py-6 mt-4">
                            Verify & Submit ₹{currentAmount}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
