import PaymentClient from "@/components/PaymentClient";
import { Suspense } from "react";

export default function PaymentPage() {
    return (
        <Suspense fallback={<div>Loading payment...</div>}>
            <PaymentClient />
        </Suspense>
    );
}
