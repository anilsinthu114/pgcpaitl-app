import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Submission Successful - PGCPAITL",
    description: "Documents uploaded successfully",
};

export default function UploadSuccessPage() {
    return (
        <div className="success-wrapper">
            <div className="success-card">
                <div className="animation-circle">
                    <span className="checkmark">✓</span>
                </div>

                <h1 className="success-title">Application Completed!</h1>

                <p className="message">
                    Congratulations! Your application process is now complete. We have successfully received your course fee payment and all required documents.
                </p>

                <div className="status-timeline">
                    <div className="step">
                        <div className="step-icon">✓</div>
                        <span className="step-label">Registered</span>
                    </div>
                    <div className="step">
                        <div className="step-icon">✓</div>
                        <span className="step-label">Paid Fee</span>
                    </div>
                    <div className="step">
                        <div className="step-icon">✓</div>
                        <span className="step-label">Documents</span>
                    </div>
                </div>

                <div className="action-area">
                    <p style={{ margin: '0 0 20px', color: '#666', fontSize: '0.95rem' }}>
                        Our admissions team will now review your application. You will receive an official confirmation email shortly.
                    </p>
                    <a href="/" className="btn-home">Return to Homepage</a>
                </div>
            </div>

            <div className="footer">
                <p>&copy; 2025 JNTU-GV. All Rights Reserved.</p>
            </div>
        </div>
    );
}
