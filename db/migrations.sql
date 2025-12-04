CREATE DATABASE IF NOT EXISTS `pgcpatil-app` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pgcpatil-app`;


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
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('submitted','reviewing','accepted','rejected') DEFAULT 'submitted'
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
