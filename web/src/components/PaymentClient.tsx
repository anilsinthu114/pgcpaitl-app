"use client";

import { api } from "@/lib/api";
import "@/styles/gateway.css";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

interface PaymentValues {
    application_id: string; // Encrypted ID
    utr: string;
    screenshot: FileList;
    amount: string;
}

export default function PaymentClient() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<PaymentValues>();

    const mutation = useMutation({
        mutationFn: async (data: PaymentValues) => {
            const formData = new FormData();
            formData.append("application_id", id || "");
            formData.append("utr", data.utr);
            formData.append("amount", "1000"); // Fixed reg fee? Or derived from type?
            // Default to registration fee of 1000 based on controller logic fallback
            if (data.screenshot && data.screenshot[0]) {
                formData.append("screenshot", data.screenshot[0]);
            }
            const res = await api.post("/payment/submit", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        },
        onSuccess: (data: any) => {
            setSuccess(true);
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        },
        onError: (err: any) => {
            alert("Payment submission failed: " + (err.response?.data?.error || err.message));
        }
    });

    if (!id) return <div className="p-8 text-center text-red-500">Missing Application ID. Please use link from email.</div>;

    if (success) {
        return (
            <div className="card max-w-md mx-auto p-8 text-center">
                <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Submitted!</h2>
                <p>Your payment details have been uploaded for verification.</p>
                <Link href="/">
                    <Button className="mt-6">Go Home</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="gateway-wrapper flex flex-col md:flex-row gap-8 animate-fade-in">
                {/* Left Panel: Summary */}
                <div className="gateway-left p-8 rounded-lg flex-1 shadow-xl">
                    <h2 className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">Registration</h2>
                    <h1 className="text-3xl font-serif font-bold mb-8">Admission Fee</h1>

                    <div className="mb-8">
                        <div className="text-sm opacity-80">Registration Amount</div>
                        <div className="text-4xl font-bold my-1">₹1,000</div>
                        <div className="text-xs opacity-60">Non-Refundable</div>
                    </div>

                    <div className="space-y-3 text-sm opacity-90 border-t border-white/20 pt-6">
                        <div className="flex justify-between"><span>Application ID</span> <strong className="font-mono">{id}</strong></div>
                        <p className="opacity-80 mt-4 leading-relaxed">
                            This fee is mandatory to process your application and move to the technical evaluation phase.
                        </p>
                    </div>

                    <div className="mt-12 text-xs opacity-50">
                        © 2025 JNTU-GV. Secure Payment Portal.
                    </div>
                </div>

                {/* Right Panel: Form */}
                <div className="bg-white p-8 rounded-lg flex-[1.5] shadow-md border border-gray-200">
                    <div className="flex items-center gap-2 mb-6 text-primary font-bold text-lg border-b pb-4">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.4z" /></svg>
                        Payment Verification
                    </div>

                    <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 mb-6 border border-yellow-200">
                        <strong>Instructions:</strong> Scan the QR code, pay the registration fee, and upload the UTR confirmation screenshot below.
                    </div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="qr-frame mb-2">
                            <img src="/qr/sbi-qr.jpg" alt="SBI QR" className="w-48 h-48 object-contain" />
                        </div>
                        <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">registrarpgcp@sbi</div>
                        <p className="text-xs text-muted-foreground mt-2 italic">Verification takes 24-48 business hours.</p>
                    </div>

                    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                        <div>
                            <Label htmlFor="utr">UTR / Transaction ID</Label>
                            <Input id="utr" {...register("utr", { required: "UTR is required" })} placeholder="Enter 12-digit UTR" />
                            {errors.utr && <p className="text-red-500 text-sm mt-1">{errors.utr.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="screenshot">Upload Screenshot</Label>
                            <Input
                                id="screenshot"
                                type="file"
                                accept="image/*"
                                {...register("screenshot", { required: "Screenshot is required" })}
                                className="pt-1"
                            />
                            {errors.screenshot && <p className="text-red-500 text-sm mt-1">{errors.screenshot.message}</p>}
                        </div>

                        <Button type="submit" isLoading={mutation.isPending} className="w-full mt-4">
                            Submit Payment
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
