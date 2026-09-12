require('dotenv').config()

const pool = require('../config/db')

const students = [
  {
    studentId: 'ST001',
    name: 'Ram Chandra Bahadur',
    email: 'np01cp4a240105@islingtoncollege.edu.np',
    phoneNumber: '9800000000',
    course: 'BSc Computer Science',
    year: 1,
    feeStatus: 'CLEAR',
  },
  {
    studentId: 'ST002',
    name: 'Aayusha Sharma',
    email: 'aayusha.sharma@islingtoncollege.edu.np',
    phoneNumber: '9800000001',
    course: 'BSc Computer Science',
    year: 2,
    feeStatus: 'UNCLEAR',
  },
  {
    studentId: 'ST003',
    name: 'Nischal Thapa',
    email: 'nischal.thapa@islingtoncollege.edu.np',
    phoneNumber: '9800000002',
    course: 'BSc Computing',
    year: 1,
    feeStatus: 'UNCLEAR',
  },
  {
    studentId: 'ST004',
    name: 'Prakriti Karki',
    email: 'prakriti.karki@islingtoncollege.edu.np',
    phoneNumber: '9800000003',
    course: 'BSc Computing',
    year: 3,
    feeStatus: 'CLEAR',
  },
  {
    studentId: 'ST005',
    name: 'Sujan Gurung',
    email: 'sujan.gurung@islingtoncollege.edu.np',
    phoneNumber: '9800000004',
    course: 'BSc Computer Science',
    year: 3,
    feeStatus: 'CLEAR',
  },
]

async function seedStudents() {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    for (const student of students) {
      await connection.execute(
        `INSERT INTO students (student_id, name, email, phone_number, course, year)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), email = VALUES(email), phone_number = VALUES(phone_number),
           course = VALUES(course), year = VALUES(year)`,
        [student.studentId, student.name, student.email, student.phoneNumber, student.course, student.year],
      )

      const [[savedStudent]] = await connection.execute(
        'SELECT id FROM students WHERE student_id = ? LIMIT 1',
        [student.studentId],
      )

      await connection.execute(
        `INSERT INTO fee_status (student_id, status)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [savedStudent.id, student.feeStatus],
      )
    }

    await connection.commit()
    console.log(`Seeded ${students.length} students and their fee statuses.`)
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

seedStudents()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())
