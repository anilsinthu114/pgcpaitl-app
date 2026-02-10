"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessClient() {
    const searchParams = useSearchParams();
    const prettyId = searchParams.get("id");
    const isUpload = searchParams.get("upload") === "true";

    if (isUpload) {
        return (
            <div className="page">
                <div className="max-w-xl mx-auto mt-12 text-center p-8 bg-white border rounded shadow">
                    <div className="text-4xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold text-green-700 mb-2">Documents Uploaded Successfully</h1>
                    <p className="text-gray-600 mb-6 font-medium">Your application is now under review.</p>

                    <div className="bg-blue-50 text-left p-4 rounded border-l-4 border-blue-500 mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> We will notify you via email once the verification is complete.
                            You can track your status using your Application ID.
                        </p>
                    </div>

                    <div className="flex justify-center gap-4">
                        <Link href={`/status?id=${prettyId || ''}`} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Check Status</Link>
                        <Link href="/" className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50">Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="max-w-2xl mx-auto p-4">
                <div className="card text-center bg-white shadow-lg p-8 rounded-lg mt-8">
                    <div className="text-5xl mb-4 text-green-500">✅</div>

                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Registration Fee Received</h1>

                    <p className="text-gray-600 font-medium text-lg mb-8">
                        We humbly acknowledge the receipt of your registration fee of <strong>₹1,000</strong>.
                        <br /><span className="text-sm opacity-80">You have successfully completed the initial step.</span>
                    </p>

                    {/* Timeline */}
                    <div className="relative text-left pl-8 border-l-2 border-gray-200 space-y-8 mb-8">

                        {/* Step 1 */}
                        <div className="relative">
                            <div className="absolute -left-[41px] w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold border-4 border-white">✓</div>
                            <div>
                                <h3 className="font-bold text-gray-800">Registration & Fee Payment</h3>
                                <p className="text-sm text-gray-500">Completed successfully.</p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative">
                            <div className="absolute -left-[41px] w-10 h-10 rounded-full bg-white text-blue-600 border-2 border-blue-600 flex items-center justify-center font-bold">2</div>
                            <div>
                                <h3 className="font-bold text-gray-800">Course Fee Payment</h3>
                                <p className="text-sm text-gray-500 mb-1">Please proceed to pay the program tuition fee (Full/EMI).</p>
                                <div className="inline-block bg-red-50 text-red-600 px-2 py-1 rounded text-xs border border-red-200 font-bold">Deadline: 06th February 2026</div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative opacity-50">
                            <div className="absolute -left-[41px] w-10 h-10 rounded-full bg-white text-gray-300 border-2 border-gray-300 flex items-center justify-center font-bold">3</div>
                            <div>
                                <h3 className="font-bold text-gray-800">Upload Documents</h3>
                                <p className="text-sm text-gray-500">Submit your academic certificates for verification.</p>
                            </div>
                        </div>

                    </div>

                    <div className="bg-blue-50 p-4 rounded text-left border-l-4 border-blue-500 mb-8">
                        <small className="text-blue-800 font-medium">
                            <strong>Note:</strong> A confirmation email with transaction details has been sent to your registered address.
                            Please keep your UTR number safe.
                        </small>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href={`/course-fee?id=${prettyId || ''}`}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded font-bold hover:opacity-90 transition-opacity"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Pay Course Fee (Secure)
                        </Link>

                        <a
                            href="https://pgcpaitl.jntugv.edu.in"
                            target="_blank"
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded font-bold hover:opacity-90 transition-opacity"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            Visit Course Website
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
