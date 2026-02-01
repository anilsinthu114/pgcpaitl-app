CREATE DATABASE IF NOT EXISTS `pgcpaitl-app` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pgcpaitl-app`;


CREATE TABLE IF NOT EXISTS applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  parentName VARCHAR(255) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  nationality VARCHAR(50) NOT NULL,
  aadhaar VARCHAR(50),
  mobile VARCHAR(30),
  whatsapp VARCHAR(30) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pin VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  degreeLevel VARCHAR(100) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  institutionName VARCHAR(255) NOT NULL,
  university VARCHAR(255) NOT NULL,
  passingYear VARCHAR(10) NOT NULL,
  studyMode VARCHAR(50) NOT NULL,
  percentage VARCHAR(50) NOT NULL,
  employmentStatus VARCHAR(100),
  organisation VARCHAR(255),
  designation VARCHAR(255),
  sector VARCHAR(255),
  experience VARCHAR(50),
  sop TEXT ,
  commMode VARCHAR(255),
  declarations JSON,
  flow_state ENUM('draft','payment_pending','submitted','payment_verified','reviewing','accepted','rejected') DEFAULT 'draft', 
  is_legacy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending','submitted','reviewing','accepted','rejected') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS application_files (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_id BIGINT NOT NULL,
  type VARCHAR(100) NOT NULL,
  original_name VARCHAR(255),
  stored_name VARCHAR(255),
  stored_path VARCHAR(1000),
  mime VARCHAR(100),
  size_bytes BIGINT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_id BIGINT NOT NULL,
  utr VARCHAR(100) NOT NULL,
  screenshot_path VARCHAR(1000),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE application_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    application_id BIGINT NOT NULL,
    
    utr VARCHAR(100) NOT NULL,                   -- Bank UTR / Transaction ID
    amount DECIMAL(10,2) DEFAULT 1000.00,        -- Payment amount
    payment_mode ENUM('SBI_QR','UPI','BANK') 
        DEFAULT 'SBI_QR',
    payment_type ENUM('registration', 'course_fee') DEFAULT 'registration',
    emi_option ENUM('full', 'emi') DEFAULT NULL, -- full payment or installment (EMI)

    screenshot_path VARCHAR(255) DEFAULT NULL,   -- Stored screenshot full path
    
    status ENUM('pending','uploaded','verified','rejected')
        DEFAULT 'pending',

    remarks TEXT DEFAULT NULL,                   -- Additional notes (optional)

    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,
  

    FOREIGN KEY (application_id) 
        REFERENCES applications(id) 
        ON DELETE CASCADE
);

