import "@/styles/thankyou.css";
import { Metadata } from "next";


export const metadata: Metadata = {
    title: "PGCPAITL – Application Received",
    description: "Application submitted successfully",
};

export default function ThankYouPage() {
    return (
        <div className="page">
            <div className="card card-center">
                <h1>Application Submitted Successfully</h1>
                <p>Thank you for applying to the</p>
                <p className="pgcpaitl-title">PG Certificate Programme in Artificial Intelligence, Technology & Law (PGCPAITL)</p>
                <p>offered by JNTU-GV in collaboration with DSNLU.</p>

                <div className="next-step-box">
                    <p><strong>Next Step – Pay Application Fee (₹ 1,000/-)</strong></p>
                    <p>Please track your application status to proceed with the registration fee payment if not already done.</p>
                    <p className="next-step-note">
                        <em>Note:</em> Applications are processed only after the successful verification of the registration fee.
                    </p>
                </div>

                <div className="track-status">
                    <a href="/status" className="btn-primary track-link">Track Application Status</a>
                </div>

                <p className="confirmation-note">
                    A confirmation email has been sent to your registered email ID with your application details.
                </p>
            </div>
        </div>
    );
}
