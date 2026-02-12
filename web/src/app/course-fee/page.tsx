import CourseFeeClient from "@/components/CourseFeeClient";
import { Suspense } from "react";

export default function CourseFeePage() {
    return (
        <Suspense fallback={<div>Loading course fee...</div>}>
            <CourseFeeClient />
        </Suspense>
    );
}
