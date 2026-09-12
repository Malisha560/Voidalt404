require('dotenv').config()

const pool = require('../config/db')

const programmeSubjects = [
  ['BSc Computing', 'Professional Ethics'],
  ['BSc Computing', 'Software Engineering'],
  ['BSc Computer Science', 'Application Development'],
  ['BSc Computer Science', 'Databases'],
]

const allocationDefaults = {
  'Professional Ethics': ['Alumni Block', 'SR01', 'PE'],
  'Software Engineering': ['Alumni Block', 'SR01', 'SE'],
  'Application Development': ['Skill Block', 'SR01', 'AD'],
  Databases: ['Alumni Block', 'SR02', 'DB'],
}

async function seedProgrammeExams() {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS programme_subjects (
        programme VARCHAR(100) NOT NULL,
        subject VARCHAR(150) NOT NULL,
        PRIMARY KEY (programme, subject)
      )
    `)

    await connection.query('DELETE FROM programme_subjects')
    await connection.query(
      'INSERT INTO programme_subjects (programme, subject) VALUES ?',
      [programmeSubjects],
    )

    const [students] = await connection.query('SELECT id, student_id, course FROM students ORDER BY id')
    const [exams] = await connection.query('SELECT id, subject FROM exams')

    for (const student of students) {
      const allowedSubjects = programmeSubjects
        .filter(([programme]) => programme === student.course)
        .map(([, subject]) => subject)

      for (const exam of exams) {
        if (!allowedSubjects.includes(exam.subject)) continue
        const [building, room, seatPrefix] = allocationDefaults[exam.subject]
        await connection.execute(
          `INSERT INTO exam_allocations (exam_id, student_id, building, room, seat_number)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE building = VALUES(building), room = VALUES(room), seat_number = VALUES(seat_number)`,
          [exam.id, student.id, building, room, `${seatPrefix}-${String(student.id).padStart(2, '2')}`],
        )
      }
    }

    await connection.query(`
      DELETE ea FROM exam_allocations ea
      INNER JOIN exams e ON e.id = ea.exam_id
      INNER JOIN students s ON s.id = ea.student_id
      LEFT JOIN programme_subjects ps ON ps.programme = s.course AND ps.subject = e.subject
      WHERE ps.programme IS NULL
    `)

    await connection.commit()
    console.log('Programme-subject mappings and exam allocations are ready.')
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

seedProgrammeExams()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())
