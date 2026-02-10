import PaymentClient from "@/components/PaymentClient"; // Fix import path if needed
import { Suspense } from "react";

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="text-center p-8">Loading Payment Interface...</div>}>
            <PaymentClient />
        </Suspense>
    );
}
