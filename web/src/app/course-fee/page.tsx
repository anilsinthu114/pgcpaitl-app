import CourseFeeClient from "@/components/CourseFeeClient";
import { Suspense } from "react";

export default function CourseFeePage() {
    return (
        <Suspense fallback={<div className="text-center p-8">Loading Payment Gateway...</div>}>
            <CourseFeeClient />
        </Suspense>
    );
}
