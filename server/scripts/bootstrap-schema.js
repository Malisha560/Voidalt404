require('dotenv').config()

const pool = require('../config/db')

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'INVIGILATOR') NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(40),
    course VARCHAR(150),
    year VARCHAR(40),
    profile_image MEDIUMTEXT
  )`,
  `CREATE TABLE IF NOT EXISTS fee_status (
    student_id INT PRIMARY KEY,
    status ENUM('CLEAR', 'UNCLEAR') NOT NULL DEFAULT 'UNCLEAR',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_name VARCHAR(150) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    programme VARCHAR(150) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS exam_allocations (
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    building VARCHAR(150) NOT NULL,
    room VARCHAR(80) NOT NULL,
    seat_number VARCHAR(80) NOT NULL,
    PRIMARY KEY (exam_id, student_id)
  )`,
  `CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    invigilator_id INT NOT NULL,
    method ENUM('MANUAL', 'QR') NOT NULL,
    status ENUM('PRESENT', 'ABSENT') NOT NULL,
    verified_at DATETIME NULL,
    rejection_reason VARCHAR(255) NULL,
    UNIQUE KEY unique_attendance_exam_student (exam_id, student_id)
  )`,
  `CREATE TABLE IF NOT EXISTS attendance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by INT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS qr_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    token CHAR(64) NOT NULL,
    issued_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    UNIQUE KEY unique_exam_student_qr (exam_id, student_id),
    UNIQUE KEY unique_qr_token (token)
  )`,
  `CREATE TABLE IF NOT EXISTS programme_subjects (
    programme VARCHAR(100) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    PRIMARY KEY (programme, subject)
  )`,
]

async function bootstrapSchema() {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    for (const statement of statements) await connection.query(statement)
    try { await connection.query('ALTER TABLE exams ADD COLUMN programme VARCHAR(150) NOT NULL DEFAULT \'\' AFTER subject') } catch (error) { if (error.code !== 'ER_DUP_FIELDNAME') throw error }
    await connection.commit()
    console.log('Database schema is ready.')
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

bootstrapSchema()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())