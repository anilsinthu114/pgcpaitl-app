import { z } from "zod";

export const applicationSchema = z.object({
    // Step 1: Personal
    fullName: z.string().min(2, "Full Name is required"),
    parentName: z.string().min(2, "Parent Name is required"),
    dob: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid Date" }),
    gender: z.string().min(1, "Select gender"),
    category: z.string().min(1, "Category is required"),
    nationality: z.string().min(1, "Nationality is required"),
    aadhaar: z.string().optional().refine(val => !val || /^\d{12}$/.test(val), "Aadhaar must be 12 digits"),

    // Step 2: Contact
    mobile: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits"),
    whatsapp: z.string().regex(/^\d{10}$/, "WhatsApp number must be 10 digits"),
    email: z.string().email("Invalid email address"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(2, "City is required"),
    district: z.string().min(2, "District is required"),
    state: z.string().min(2, "State is required"),
    pin: z.string().regex(/^\d{6}$/, "Pin Code must be 6 digits"),
    country: z.string().min(2, "Country is required"),

    // Step 3: Academics
    degreeLevel: z.string().min(1, "Degree Level is required"),
    specialization: z.string().min(1, "Specialization is required"),
    institutionName: z.string().min(1, "Institution Name is required"),
    university: z.string().min(1, "University is required"),
    passingYear: z.string().min(1, "Passing Year is required"),
    studyMode: z.string().min(1, "Study Mode is required"),
    percentage: z.string().min(1, "Percentage is required"),

    // Step 4: Employment
    employmentStatus: z.string().optional(),
    organisation: z.string().optional(),
    designation: z.string().optional(),
    sector: z.string().optional(),
    experience: z.string().optional(),

    // Step 5: SOP
    sop: z.string().min(20, "Please provide a brief Statement of Purpose"),
    commMode: z.array(z.string()).optional(),

    // Step 6: Declarations
    declarationTruth: z.boolean().refine(v => v === true, "Mandatory"),
    declarationRules: z.boolean().refine(v => v === true, "Mandatory"),
    declarationFee: z.boolean().refine(v => v === true, "Mandatory"),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;
