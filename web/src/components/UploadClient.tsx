"use client";

import { api } from "@/lib/api";
import "@/styles/gateway.css";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

interface UploadValues {
    application_id: string; // Numeric ID
    photo: FileList;
    id_proof: FileList;
    degree: FileList;
    marks: FileList;
    other?: FileList;
}

export default function UploadClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prettyId = searchParams.get("id");
    const [numericId, setNumericId] = useState<number | null>(null);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<UploadValues>();

    useEffect(() => {
        if (!prettyId) return;
        api.get(`/resolve-id?pretty=${encodeURIComponent(prettyId)}`).then(res => {
            if (res.data.ok) {
                setNumericId(res.data.id);
                setValue("application_id", String(res.data.id));
            } else {
                alert("Invalid ID");
            }
        }).catch(err => alert("Error resolving ID"));
    }, [prettyId, setValue]);

    const mutation = useMutation({
        mutationFn: async (data: UploadValues) => {
            const formData = new FormData();
            formData.append("application_id", String(numericId));

            if (data.photo?.[0]) formData.append("photo", data.photo[0]);
            if (data.id_proof?.[0]) formData.append("id_proof", data.id_proof[0]);
            if (data.degree?.[0]) formData.append("degree", data.degree[0]);
            if (data.marks?.[0]) formData.append("marks", data.marks[0]);

            if (data.other) {
                Array.from(data.other).forEach(file => {
                    formData.append("other", file);
                });
            }

            const res = await api.post("/application/upload-documents", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        },
        onSuccess: (data) => {
            alert("Documents Uploaded Successfully!");
            // window.location.href = `/payment/success?id=${prettyId}&upload=true`;
            router.push(`/payment/success?id=${prettyId}&upload=true`);
        },
        onError: (err: any) => {
            alert("Upload failed: " + (err.response?.data?.error || err.message));
        }
    });

    if (!prettyId) return <div className="p-8 text-center text-red-500">Missing Application ID.</div>;

    return (
        <div className="page">
            <div className="gateway-wrapper flex flex-col md:flex-row gap-8 animate-fade-in">
                {/* Left Panel */}
                <div className="gateway-left p-8 rounded-lg flex-1 shadow-xl">
                    <h2 className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">Next Steps</h2>
                    <h1 className="text-3xl font-serif font-bold mb-8">Document Upload</h1>

                    <div className="mb-8">
                        <div className="text-green-400 font-bold mb-1">✓ Payment Verified</div>
                        <div className="text-4xl font-bold my-1">₹30,000.00</div>
                        <div className="text-xs opacity-60">Transaction Recorded</div>
                    </div>

                    <div className="space-y-3 text-sm opacity-90 border-t border-white/20 pt-6">
                        <div><span>Application ID:</span> <strong className="font-mono ml-2">{prettyId}</strong></div>
                        <p className="opacity-80 mt-4 leading-relaxed">
                            Please upload the required documents to finalize your admission.
                            Ensure all scans are clear and readable (PDF/JPG, Max 2MB).
                        </p>
                    </div>

                    <div className="mt-12 text-xs opacity-50">
                        © 2025 JNTU-GV. Secure Portal.
                    </div>
                </div>

                {/* Right Panel */}
                <div className="bg-white p-8 rounded-lg flex-[1.5] shadow-md border border-gray-200">
                    <div className="flex items-center gap-2 mb-6 text-primary font-bold text-lg border-b pb-4">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        Upload Certificates
                    </div>

                    <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 mb-6 border border-yellow-200">
                        <strong>Required:</strong> Clear scans of Photo, ID, Degree, Marks.
                    </div>

                    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">

                        <div>
                            <Label htmlFor="photo">1. Recent Passport Photo <span className="text-red-500">*</span></Label>
                            <Input id="photo" type="file" accept="image/*" {...register("photo", { required: "Photo is required" })} className="pt-1" />
                            {errors.photo && <p className="text-red-500 text-sm mt-1">{errors.photo.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="id_proof">2. ID Proof (Aadhaar/PAN) <span className="text-red-500">*</span></Label>
                            <Input id="id_proof" type="file" accept=".pdf,image/*" {...register("id_proof", { required: "ID Proof is required" })} className="pt-1" />
                        </div>

                        <div>
                            <Label htmlFor="degree">3. Degree Certificate <span className="text-red-500">*</span></Label>
                            <Input id="degree" type="file" accept=".pdf,image/*" {...register("degree", { required: "Degree is required" })} className="pt-1" />
                        </div>

                        <div>
                            <Label htmlFor="marks">4. UG Mark Sheet <span className="text-red-500">*</span></Label>
                            <Input id="marks" type="file" accept=".pdf,image/*" {...register("marks", { required: "Marks sheet is required" })} className="pt-1" />
                        </div>

                        <div>
                            <Label htmlFor="other">5. Supporting Docs (Optional)</Label>
                            <Input id="other" type="file" multiple accept=".pdf,image/*" {...register("other")} className="pt-1" />
                            <p className="text-xs text-gray-500 mt-1">Experience certificates, etc. (Max 5 files)</p>
                        </div>

                        <Button type="submit" isLoading={mutation.isPending} className="w-full text-lg py-3 mt-6">
                            Submit Documents & Finish
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
