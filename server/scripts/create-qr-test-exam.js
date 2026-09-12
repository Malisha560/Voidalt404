require('dotenv').config()

const pool = require('../config/db')

async function createQrTestExam() {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [[existingExam]] = await connection.query(
      'SELECT id FROM exams WHERE exam_name = ? AND exam_date = ? AND start_time = ? LIMIT 1',
      ['QR Uniqueness Test', '2026-09-13', '03:00:00'],
    )

    let examId = existingExam?.id
    if (!examId) {
      const [result] = await connection.execute(
        `INSERT INTO exams (exam_name, subject, programme, exam_date, start_time, end_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['QR Uniqueness Test', 'QR Uniqueness Test', 'BSc Computing', '2026-09-13', '03:00:00', '05:00:00'],
      )
      examId = result.insertId
    } else {
      await connection.execute('UPDATE exams SET programme = ? WHERE id = ?', ['BSc Computing', examId])
    }

    const [students] = await connection.query('SELECT id FROM students ORDER BY id')
    for (const student of students) {
      await connection.execute(
        `INSERT INTO exam_allocations (exam_id, student_id, building, room, seat_number)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE building = VALUES(building), room = VALUES(room), seat_number = VALUES(seat_number)`,
        [examId, student.id, 'QR Test Block', 'QR01', `QR-${String(student.id).padStart(2, '0')}`],
      )
    }

    await connection.commit()
    console.log(JSON.stringify({ examId, allocatedStudents: students.length }))
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

createQrTestExam()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())