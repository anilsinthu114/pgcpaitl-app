"use client";

import React from 'react';
import Link from 'next/link';

export default function RulesContent() {
    return (
        <div className="page">
            <div className="card">
                <div className="form-header">
                    <div className="header-row">
                        <div className="header-logo">
                            <img
                                src="/images/jntugv-logo.png"
                                alt="JNTU-GV Logo"
                                onError={(e) => e.currentTarget.src = 'https://jntugv.edu.in/static/media/jntugvcev.b33bb43b07b2037ab043.jpg'}
                            />
                        </div>

                        <div className="header-title">
                            <h1>PGCPAITL Fee & EMI Policy</h1>
                            <h2>Artificial Intelligence, Technology & Law Program</h2>
                        </div>
                    </div>
                </div>

                <div className="info-banner">
                    <div className="banner-icon">📢</div>
                    <div>
                        <strong>Important Notice:</strong> To support a diverse range of applicants, the University and
                        DSNLU have introduced a two-installment (EMI) plan for the Course Fee payment. Admission
                        confirmation is tied strictly to the adherence of these payment rules.
                    </div>
                </div>

                <div className="rules-section">
                    <h3>1. Comprehensive Fee Structure</h3>
                    <p>The total financial commitment for the PG Certificate Programme (PGCPAITL) is bifurcated as follows:</p>
                    <table className="fee-table">
                        <thead>
                            <tr>
                                <th>Fee Component</th>
                                <th>Amount</th>
                                <th>Nature</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Application Registration Fee</td>
                                <td><strong>₹1,000</strong></td>
                                <td>One-time, Non-Refundable</td>
                            </tr>
                            <tr>
                                <td>Total Tuition/Course Fee</td>
                                <td><strong>₹30,000</strong></td>
                                <td>Refundable only as per Univ. Policy</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="rules-section">
                    <h3>2. Course Fee Payment Options</h3>
                    <p>Candidates can choose one of the following two paths to settle their course fee:</p>

                    <div className="info-grid">
                        <div className="info-card-alt">
                            <h4>Option A: Full Payment</h4>
                            <p>Complete the entire course fee in a single transaction.</p>
                            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)', margin: '10px 0' }}>₹30,000
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#666' }}>Due Date: <strong>06 February 2026</strong></p>
                        </div>
                        <div className="info-card-alt" style={{ borderLeft: '4px solid var(--accent)' }}>
                            <h4>Option B: EMI (Installments)</h4>
                            <p>Pay the fee in two equal installments for convenience.</p>
                            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#d35400', margin: '10px 0' }}>₹15,000 +
                                ₹15,000</div>
                            <p style={{ fontSize: '0.85rem', color: '#666' }}>1st Installment Due: <strong>06 Feb 2026</strong>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rules-section">
                    <h3>3. Installment (EMI) Deadlines</h3>
                    <div className="timeline-box">
                        <div className="timeline-item">
                            <strong>First Installment (₹15,000):</strong> Must be paid by <strong>06 February 2026</strong>.
                            This is mandatory to receive the Admission Confirmation and log-in credentials for class work.
                        </div>
                        <div className="timeline-item">
                            <strong>Second Installment (₹15,000):</strong> Must be paid by <strong>06 May 2026</strong>.
                            Failure to pay the second installment may result in withholding of the final certification and
                            examination results.
                        </div>
                    </div>
                </div>

                <div className="rules-section">
                    <h3>4. Payment Verification Rules</h3>
                    <ul>
                        <li><strong>UTR/Ref No:</strong> Every UPI or Bank Transfer generates a unique transaction reference
                            (UTR) number. This number MUST be entered correctly in the portal.</li>
                        <li><strong>Screenshot Proof:</strong> A clear screenshot of the successful payment showing the UTR,
                            date, and amount must be uploaded.</li>
                        <li><strong>Review Period:</strong> All submissions undergo a manual verification by the admissions
                            team. Verification typically takes 24-48 business hours.</li>
                    </ul>
                </div>

                <div className="rules-section">
                    <h3>5. Refund & Cancellation Policy</h3>
                    <div className="highlight-box">
                        The Application Registration Fee (₹1,000) is strictly <strong>non-refundable</strong> under any
                        circumstances. The Course Fee is also generally non-refundable once admission is confirmed. For
                        exceptional cases, refund requests will be governed by the standard academic refund rules of
                        JNTU-GV.
                    </div>
                </div>

                <div className="rules-section" style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>For queries regarding payments, please email us at:<br />
                        <a href="mailto:applicationspgcpaitl@jntugv.edu.in"
                            style={{ fontWeight: '600', color: 'var(--primary)' }}>applicationspgcpaitl@jntugv.edu.in</a>
                    </p>
                </div>

            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p>© 2025 PGCPAITL Admissions — JNTU-GV & DSNLU</p>
            </div>
        </div>
    );
}
