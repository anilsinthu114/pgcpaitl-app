import UploadClient from "@/components/UploadClient";
import { Suspense } from "react";

export default function UploadPage() {
    return (
        <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
            <UploadClient />
        </Suspense>
    );
}
