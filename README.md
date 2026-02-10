# PGCPAITL - Online Application Portal
> **Post Graduate Certificate Programme in Artificial Intelligence, Technology & Law**
> *Offered by JNTU-GV in collaboration with DSNLU*

![JNTU-GV & DSNLU Logos](/public/jntugv-logo.png)

## 📌 Project Overview
The **PGCPAITL Application Portal** is a full-stack web application designed to streamline the admission process for the Post Graduate Certificate Programme. It features a secure, payment-first workflow ensuring that applications are processed efficiently from submission to verification.

## 🆕 Revamped Frontend (Next.js)
A new modern frontend is available in the `web/` directory, featuring:
-   **Next.js 15+** (App Router)
-   **React Query** & **Zod** Validation
-   **Handwritten CSS** (Govt. Law & Tech Theme)

### Quick Start
1.  **Backend**: Run `node server.js` in the root directory.
2.  **Frontend**: Run `cd web && npm run dev`.
3.  Access the new portal at `http://localhost:3000`.

See `web/README.md` for full documentation.

## 🚀 Key Features

### 🎓 For Applicants
- **Multi-Step Application Form:** User-friendly wizard for Personal, Academic, and Employment details.
- **Payment-First Workflow:** Applications remain pending until the registration fee is verified.
- **Secure Payment Gateway UX:** Manual UTR upload with QR code integration and screenshot validation.
- **Real-time Status Tracking:** Track application progress via Application ID, Email, or Mobile.
- **Automated Email Notifications:** Instant alerts for submission, payment receipt, and status updates.

### 🛠 For Administrators
- **Secure Dashboard:** JWT-based authentication for admin access.
- **Application Management:** View, Approve, or Reject applications with a single click.
- **Payment Verification:** Verify UTRs and screenshots; system automatically updates application status.
- **Data Export:** View detailed applicant data and download uploaded documents.
- **Granular Statistics:** Dashboard widgets for Total, Submitted, Pending, and Verified counts.

## 🏗 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js (MVC Architecture) |
| **Database** | MySQL (mysql2/promise) with Transaction Support |
| **Frontend** | Semantic HTML5, CSS3 (Modern Variables), Vanilla JS |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt.js |
| **Security** | Helmet (CSP), Rate Limiting, Input Validation |
| **Email** | Nodemailer (HTML Templates) |
| **Logging** | Winston (Daily File Rotation) |

## 📂 Project Structure

The project follows a modular **MVC (Model-View-Controller)** pattern:

```
pgcpaitl-app/
├── config/             # Database, Logger, and Debug configuration
├── controllers/        # Business logic (Auth, Application, Payment)
├── middlewares/        # Auth checks, Upload handling, Validation
├── models/             # Database schemas & query logic
├── public/             # Static assets (HTML, CSS, JS, Images)
├── routes/             # API Route definitions
├── utils/              # Helper functions
├── logs/               # Application & Error logs
├── app.js / server.js  # Entry point
└── .env                # Environment variables
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16+)
- MySQL Server

### 1. Clone the Repository
```bash
git clone https://github.com/anilsinthu114/pgcpaitl-app.git
cd pgcpaitl-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```env
PORT=3000
HOST=localhost

# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=pgcpaitl_db
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=8h

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="PGCPAITL Admissions"

# File Storage
FILE_BASE=e:/Anil/pgcpaitl-app/uploads
```

### 4. Setup Database
Run the migration script in your MySQL interface:
- Source file: `db/migrations.sql`

### 5. Run the Server
```bash
# Development Mode
npm run dev

# Production
npm start
```

Access the application at `http://localhost:4000`

## 🛡 Security & Best Practices
- **Content Security Policy (CSP):** Strict policies preventing inline script execution.
- **Input Sanitization:** Express-Validator used on all form inputs.
- **Transaction Management:** ACID compliant database operations for payments.
- **Rate Limiting:** Protection against brute-force and DDoS attacks.

## 📜 License
All property belongs to **Digital Monitoring Cell JNTUGV**.
Developed by **Anil Sinthu**.

---
*Developed with ❤️ for Advanced Education*
