import ApplicationForm from "@/components/ApplicationForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Apply Now - PGCPAITL",
    description: "Application Form for PGCPAITL 2026",
};

export default function ApplyPage() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <ApplicationForm />
        </div>
    );
}
