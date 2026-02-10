import ApplicationForm from "@/components/ApplicationForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Application Portal - PGCPAITL",
    description: "Online Application Form for Post Graduate Certificate Programme in AI, Technology & Law",
};

export default function IndexPage() {
    return (
        <div className="w-full">
            <ApplicationForm />
        </div>
    );
}
