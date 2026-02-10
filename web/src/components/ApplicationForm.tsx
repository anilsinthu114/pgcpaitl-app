"use client";

import { api } from "@/lib/api";
import { ApplicationFormValues, applicationSchema } from "@/lib/schemas";
import "@/styles/student-form.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";

const STEPS = [
    { id: 1, label: "Personal Details" },
    { id: 2, label: "Contact Info" },
    { id: 3, label: "Academics" },
    { id: 4, label: "Employment (Optional)" },
    { id: 5, label: "SOP" },
    { id: 6, label: "Declarations" },
];

export default function ApplicationForm() {
    const [step, setStep] = useState(1);
    const {
        register,
        handleSubmit,
        trigger,
        formState: { errors },
    } = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            nationality: "Indian",
            country: "India",
            commMode: ["Email"]
        }
    });

    const mutation = useMutation({
        mutationFn: async (data: ApplicationFormValues) => {
            const response = await api.post("/draft", data);
            return response.data;
        },
        onSuccess: (data: any) => {
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                alert(`Application Submitted Successfully! Application ID: ${data.application_id || 'Pending'}`);
            }
        },
        onError: (error: any) => {
            alert(`Submission Failed: ${error.response?.data?.error || error.message}`);
        },
    });

    const onSubmit = (data: ApplicationFormValues) => {
        mutation.mutate(data);
    };

    const nextStep = async () => {
        // Validate current step fields
        let fieldsToValidate: (keyof ApplicationFormValues)[] = [];
        if (step === 1) fieldsToValidate = ["fullName", "parentName", "dob", "gender", "category", "nationality", "aadhaar"];
        if (step === 2) fieldsToValidate = ["mobile", "whatsapp", "email", "address", "city", "district", "state", "pin", "country"];
        if (step === 3) fieldsToValidate = ["degreeLevel", "specialization", "institutionName", "university", "passingYear", "studyMode", "percentage"];
        if (step === 4) fieldsToValidate = ["employmentStatus", "organisation", "designation", "sector", "experience"];
        if (step === 5) fieldsToValidate = ["sop", "commMode"];

        const result = await trigger(fieldsToValidate);
        if (result) {
            setStep(s => Math.min(s + 1, 6));
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        setStep(s => Math.max(s - 1, 1));
        window.scrollTo(0, 0);
    };

    return (
        <div className="page page-wide">
            <div className="card animate-fade-in">
                {/* Header Replication */}
                <header className="form-header">
                    <div className="header-row">
                        {/* LEFT LOGO */}
                        <div className="header-logo left">
                            <img src="/images/jntugv-logo.png" alt="JNTUGV"
                                onError={(e) => (e.currentTarget.src = "https://jntugv.edu.in/static/media/jntugvcev.b33bb43b07b2037ab043.jpg")} />
                        </div>

                        {/* CENTER TEXT */}
                        <div className="header-title">
                            <h1>PGCPAITL – Online Application Form</h1>
                            <h2>Post Graduate Certificate Programme in Artificial Intelligence, Technology & Law</h2>
                            <p>Offered by JNTU-GV in collaboration with DSNLU</p>
                        </div>

                        {/* RIGHT LOGO */}
                        <div className="header-logo right">
                            <img src="/images/dsnlu-logo.png" alt="DSNLU"
                                onError={(e) => (e.currentTarget.src = "https://dsnlu.ac.in/wp-content/uploads/2019/12/dsnlu-logo-new.png")} />
                        </div>
                    </div>
                </header>

                {/* Marquee */}
                <div className="marquee-container">
                    <div className="marquee-content text-sm">
                        📢 PGCPAITL Admission Fee Update: Total fee ₹30,000 — Pay ₹15,000 on or before 06-02-2026 and the remaining ₹15,000 on or before 06-05-2026 under the two-installment (EMI) option. | Application Registration Fee ends on 6th February 2026. | Class Work Commencement is postponed to 09 February 2026 (Tentatively).
                    </div>
                </div>

                {/* Info Grid */}
                <div className="modern-info-grid">
                    <div className="modern-info-card card-alert">
                        <div className="card-icon">📅</div>
                        <div className="card-info">
                            <span className="card-label">Reg. Deadline</span>
                            <span className="card-value text-red-600">6 Feb 2026</span>
                        </div>
                    </div>
                    <div className="modern-info-card card-alert">
                        <div className="card-icon">💸</div>
                        <div className="card-info">
                            <span className="card-label">1st Installment</span>
                            <span className="card-value text-red-600">₹15,000</span>
                        </div>
                    </div>
                    <div className="modern-info-card">
                        <div className="card-icon">🚀</div>
                        <div className="card-info">
                            <span className="card-label">Commencement</span>
                            <span className="card-value">09 Feb 2026</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${((step - 1) / 5) * 100}%` }}></div>
                </div>

                {/* Multi-step Indicators */}
                <ul className="steps">
                    {STEPS.map((s) => (
                        <li
                            key={s.id}
                            className={clsx(step === s.id && "active", step > s.id && "completed", step < s.id && "unactive")}
                            onClick={() => {
                                // Allow jumping back only (match original JS: index < current)
                                if (s.id < step) {
                                    setStep(s.id);
                                    window.scrollTo(0, 0);
                                }
                            }}
                            style={{ cursor: s.id < step ? 'pointer' : 'default' }}
                        >
                            <span>Step {s.id}</span>
                            {s.label}
                        </li>
                    ))}
                </ul>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
                    {/* STEP 1: Personal Details */}
                    <div className={clsx("form-step", step === 1 && "active")}>
                        <fieldset className="border p-6 rounded-lg">
                            <legend className="px-3 font-bold text-lg text-primary">1. Personal Details</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <Label>Full Name <span className="text-red-500">*</span></Label>
                                    <Input {...register("fullName")} placeholder="As per official records" />
                                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                                </div>
                                <div>
                                    <Label>Father’s / Mother’s Name <span className="text-red-500">*</span></Label>
                                    <Input {...register("parentName")} placeholder="Parent Name" />
                                    {errors.parentName && <p className="text-red-500 text-xs mt-1">{errors.parentName.message}</p>}
                                </div>
                                <div>
                                    <Label>Date of Birth <span className="text-red-500">*</span></Label>
                                    <Input type="date" {...register("dob")} />
                                    {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
                                </div>
                                <div>
                                    <Label>Gender <span className="text-red-500">*</span></Label>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        {["Male", "Female", "Other", "Prefer not to say"].map(g => (
                                            <label key={g} className="flex items-center gap-2 cursor-pointer text-sm">
                                                <input type="radio" value={g} {...register("gender")} /> {g}
                                            </label>
                                        ))}
                                    </div>
                                    {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
                                </div>
                                <div>
                                    <Label>Category <span className="text-red-500">*</span></Label>
                                    <Select {...register("category")}>
                                        <option value="">Select Category</option>
                                        <option>General</option><option>SC</option><option>ST</option><option>OBC</option><option>EWS</option>
                                    </Select>
                                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                                </div>
                                <div>
                                    <Label>Nationality <span className="text-red-500">*</span></Label>
                                    <Select {...register("nationality")}>
                                        <option>Indian</option><option>Other</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Aadhaar (Optional)</Label>
                                    <Input {...register("aadhaar")} placeholder="12-digit number" maxLength={12} />
                                    {errors.aadhaar && <p className="text-red-500 text-xs mt-1">{errors.aadhaar.message}</p>}
                                </div>
                            </div>
                        </fieldset>
                    </div>

                    {/* STEP 2: Contact Info */}
                    <div className={clsx("form-step", step === 2 && "active")}>
                        <fieldset className="border p-6 rounded-lg">
                            <legend className="px-3 font-bold text-lg text-primary">2. Contact & Communication</legend>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div>
                                    <Label>Mobile Number <span className="text-red-500">*</span></Label>
                                    <Input {...register("mobile")} type="tel" maxLength={10} placeholder="10-digit mobile" />
                                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
                                </div>
                                <div>
                                    <Label>WhatsApp Number <span className="text-red-500">*</span></Label>
                                    <Input {...register("whatsapp")} type="tel" maxLength={10} placeholder="10-digit WhatsApp" />
                                    {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp.message}</p>}
                                </div>
                                <div>
                                    <Label>Email Address <span className="text-red-500">*</span></Label>
                                    <Input {...register("email")} type="email" placeholder="example@email.com" />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                </div>
                            </div>
                            <div className="mt-6">
                                <Label>Full Address <span className="text-red-500">*</span></Label>
                                <Textarea {...register("address")} rows={3} placeholder="Street, Colony, House No." />
                                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                <div>
                                    <Label>City <span className="text-red-500">*</span></Label>
                                    <Input {...register("city")} />
                                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                                </div>
                                <div>
                                    <Label>District <span className="text-red-500">*</span></Label>
                                    <Input {...register("district")} />
                                    {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
                                </div>
                                <div>
                                    <Label>State <span className="text-red-500">*</span></Label>
                                    <Select {...register("state")}>
                                        <option value="">Select State</option>
                                        <option>Andhra Pradesh</option><option>Telangana</option><option>Karnataka</option>
                                        <option>Tamil Nadu</option><option>Maharashtra</option><option>Delhi</option>
                                        <option>Other</option>
                                    </Select>
                                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                                </div>
                                <div>
                                    <Label>PIN Code <span className="text-red-500">*</span></Label>
                                    <Input {...register("pin")} maxLength={6} />
                                    {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin.message}</p>}
                                </div>
                                <div>
                                    <Label>Country <span className="text-red-500">*</span></Label>
                                    <Select {...register("country")}>
                                        <option>India</option><option>USA</option><option>Canada</option><option>Other</option>
                                    </Select>
                                </div>
                            </div>
                        </fieldset>
                    </div>

                    {/* STEP 3: Academics */}
                    <div className={clsx("form-step", step === 3 && "active")}>
                        <fieldset className="border p-6 rounded-lg">
                            <legend className="px-3 font-bold text-lg text-primary">3. Academic Qualifications</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <Label>Highest Degree <span className="text-red-500">*</span></Label>
                                    <Select {...register("degreeLevel")}>
                                        <option value="">Select Degree</option>
                                        <option>B.A.</option><option>B.Tech.</option><option>LL.B.</option><option>B.Sc.</option><option>Other</option>
                                    </Select>
                                    {errors.degreeLevel && <p className="text-red-500 text-xs mt-1">{errors.degreeLevel.message}</p>}
                                </div>
                                <div>
                                    <Label>Specialization <span className="text-red-500">*</span></Label>
                                    <Input {...register("specialization")} placeholder="e.g. Computer Science / Corporate Law" />
                                    {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization.message}</p>}
                                </div>
                                <div>
                                    <Label>Institution / College Name <span className="text-red-500">*</span></Label>
                                    <Input {...register("institutionName")} />
                                    {errors.institutionName && <p className="text-red-500 text-xs mt-1">{errors.institutionName.message}</p>}
                                </div>
                                <div>
                                    <Label>University <span className="text-red-500">*</span></Label>
                                    <Input {...register("university")} />
                                    {errors.university && <p className="text-red-500 text-xs mt-1">{errors.university.message}</p>}
                                </div>
                                <div>
                                    <Label>Passing Year <span className="text-red-500">*</span></Label>
                                    <Select {...register("passingYear")}>
                                        <option value="">Select Year</option>
                                        {Array.from({ length: 30 }, (_, i) => 2025 - i).map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </Select>
                                    {errors.passingYear && <p className="text-red-500 text-xs mt-1">{errors.passingYear.message}</p>}
                                </div>
                                <div>
                                    <Label>Study Mode <span className="text-red-500">*</span></Label>
                                    <Select {...register("studyMode")}>
                                        <option value="">Select</option>
                                        <option>Regular</option><option>Part-time</option><option>Distance</option>
                                    </Select>
                                    {errors.studyMode && <p className="text-red-500 text-xs mt-1">{errors.studyMode.message}</p>}
                                </div>
                                <div>
                                    <Label>Percentage / CGPA <span className="text-red-500">*</span></Label>
                                    <Input {...register("percentage")} placeholder="e.g. 85% or 8.5 CGPA" />
                                    {errors.percentage && <p className="text-red-500 text-xs mt-1">{errors.percentage.message}</p>}
                                </div>
                            </div>
                        </fieldset>
                    </div>

                    {/* STEP 4: Employment */}
                    <div className={clsx("form-step", step === 4 && "active")}>
                        <fieldset className="border p-6 rounded-lg">
                            <legend className="px-3 font-bold text-lg text-primary">4. Employment Details (Optional)</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <Label>Employment Status</Label>
                                    <Select {...register("employmentStatus")}>
                                        <option value="">Select</option>
                                        <option>Employed</option><option>Self-Employed</option><option>Student</option><option>Not Employed</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Organisation Name</Label>
                                    <Input {...register("organisation")} />
                                </div>
                                <div>
                                    <Label>Designation</Label>
                                    <Input {...register("designation")} />
                                </div>
                                <div>
                                    <Label>Core Sector</Label>
                                    <Select {...register("sector")}>
                                        <option value="">Select Sector</option>
                                        <option>Judiciary</option><option>Law Firm</option><option>Corporate</option><option>IT / Tech</option><option>Academia</option><option>Other</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Total Experience</Label>
                                    <Select {...register("experience")}>
                                        <option value="">Select</option>
                                        <option>0–1 years</option><option>1–3 years</option><option>3–5 years</option><option>5+ years</option>
                                    </Select>
                                </div>
                            </div>
                        </fieldset>
                    </div>

                    {/* STEP 5: SOP */}
                    <div className={clsx("form-step", step === 5 && "active")}>
                        <fieldset className="border p-6 rounded-lg">
                            <legend className="px-3 font-bold text-lg text-primary">5. Statement of Purpose</legend>
                            <div className="mt-4">
                                <Label>Why do you want to join this program? <span className="text-red-500">*</span></Label>
                                <Textarea {...register("sop")} rows={6} placeholder="Describe your motivation and career goals..." />
                                {errors.sop && <p className="text-red-500 text-xs mt-1">{errors.sop.message}</p>}
                            </div>
                            <div className="mt-6">
                                <Label>Preferred Communication Mode</Label>
                                <div className="flex gap-6 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input type="checkbox" value="Email" {...register("commMode")} /> Email
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input type="checkbox" value="WhatsApp" {...register("commMode")} /> WhatsApp
                                    </label>
                                </div>
                            </div>
                        </fieldset>
                    </div>

                    {/* STEP 6: Declarations */}
                    <div className={clsx("form-step", step === 6 && "active")}>
                        <fieldset className="border p-6 rounded-lg">
                            <legend className="px-3 font-bold text-lg text-primary">6. Declarations & Payment</legend>
                            <div className="space-y-4 mt-4">
                                <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                                    <input type="checkbox" className="mt-1" {...register("declarationTruth")} />
                                    <span className="text-sm">I declare that all information furnished in this application is true and complete to the best of my knowledge.</span>
                                </label>
                                {errors.declarationTruth && <p className="text-red-500 text-xs ml-10">Verification required</p>}

                                <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                                    <input type="checkbox" className="mt-1" {...register("declarationRules")} />
                                    <span className="text-sm">I agree to abide by the programme rules and university regulations governing the certificate course.</span>
                                </label>
                                {errors.declarationRules && <p className="text-red-500 text-xs ml-10">Agreement required</p>}

                                <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                                    <input type="checkbox" className="mt-1" {...register("declarationFee")} />
                                    <span className="text-sm">I understand that the application registration fee (₹1,000) is non-refundable.</span>
                                </label>
                                {errors.declarationFee && <p className="text-red-500 text-xs ml-10">Acknowledgment required</p>}
                            </div>

                            <div className="mt-8 p-6 bg-blue-50 rounded-lg border-l-4 border-primary shadow-inner">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-primary">Application Registration Fee</h4>
                                        <p className="text-sm text-gray-600">Secure Payment via UPI/Bank Transfer</p>
                                    </div>
                                    <div className="text-2xl font-bold text-primary">₹1,000</div>
                                </div>
                            </div>
                        </fieldset>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="step-nav">
                        <button
                            type="button"
                            onClick={prevStep}
                            className={clsx("step-btn", step === 1 && "disabled invisible")}
                            disabled={step === 1}
                        >
                            ← Back
                        </button>

                        {step < 6 && (
                            <button type="button" onClick={nextStep} className="step-btn">
                                Next →
                            </button>
                        )}
                    </div>

                    {/* Final Submit Bar */}
                    {step === 6 && (
                        <div className="btn-bar">
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="btn-primary flex items-center gap-2"
                                style={{ background: "#004c97" }}
                            >
                                {mutation.isPending ? "Submitting..." : "Proceed to Payment"}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
