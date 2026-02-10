"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import styles from './page.module.css';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') || searchParams.get('application_id');

    useEffect(() => {
        // Clear Form Storage
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith("pgcForm_") || k.startsWith("payment_")) {
                localStorage.removeItem(k);
            }
        });
    }, []);

    return (
        <div className="page">
            <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>

                <h1>Registration Fee Received</h1>

                <p style={{ color: '#4a5568', fontSize: '1rem' }}>
                    We humbly acknowledge the receipt of your registration fee of <strong>₹1,000</strong>.
                    <br />You have successfully completed the initial step of the admission process.
                </p>

                {/* Next Steps Timeline */}
                <div className="timeline">
                    {/* Step 1 (Done) */}
                    <div className="timeline-item">
                        <div className="timeline-icon" style={{ background: '#48bb78', borderColor: '#48bb78', color: 'white' }}>✓</div>
                        <div className="timeline-content">
                            <h3>Registration & Fee Payment</h3>
                            <p>Completed successfully.</p>
                        </div>
                    </div>

                    {/* Step 2 (Pending) */}
                    <div className="timeline-item">
                        <div className="timeline-icon">2</div>
                        <div className="timeline-content">
                            <h3>Course Fee Payment</h3>
                            <p>Please proceed to pay the program tuition fee (Full/EMI).</p>
                            <div className="badge-deadline">Deadline: 06th February 2026</div>
                        </div>
                    </div>

                    {/* Step 3 (Future) */}
                    <div className="timeline-item">
                        <div className="timeline-icon" style={{ borderColor: '#cbd5e0', color: '#cbd5e0' }}>3</div>
                        <div className="timeline-content">
                            <h3 style={{ color: '#718096' }}>Upload Documents</h3>
                            <p>Submit your academic certificates for verification.</p>
                        </div>
                    </div>
                </div>

                <div style={{ background: '#ebf8ff', padding: '15px', borderRadius: '8px', marginTop: '20px', borderLeft: '4px solid #4299e1', textAlign: 'left' }}>
                    <small style={{ color: '#2b6cb0' }}>
                        <strong>Note:</strong> A confirmation email with transaction details has been sent to your registered address. Please keep your UTR number safe for future reference.
                    </small>
                </div>

                <div className="action-buttons" style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {/* Left Button: Secure Course Fee Payment */}
                    <Link href={id ? `/course-fee?id=${encodeURIComponent(id)}` : '/status'} className="btn-dashboard" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', padding: '10px 20px', borderRadius: '4px' }}>
                        <svg style={{ width: '16px', height: '16px', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Pay Course Fee (Secure)
                    </Link>

                    {/* Right Button: Visit Course Website */}
                    <a href="https://pgcpaitl.jntugv.edu.in" className="btn-dashboard btn-course-website" target="_blank" rel="noopener noreferrer">
                        <svg style={{ width: '16px', height: '16px', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Visit Course Website
                    </a>
                </div>
            </div>
        </div>
    );
}
