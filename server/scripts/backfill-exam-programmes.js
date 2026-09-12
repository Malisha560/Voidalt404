require('dotenv').config()

const pool = require('../config/db')

async function backfillExamProgrammes() {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [exams] = await connection.query("SELECT id, subject FROM exams WHERE programme IS NULL OR programme = ''")
    const changes = []

    for (const exam of exams) {
      const [[mapping]] = await connection.query(
        'SELECT programme FROM programme_subjects WHERE subject = ? LIMIT 2',
        [exam.subject],
      )
      if (mapping) {
        const [[mappingCount]] = await connection.query(
          'SELECT COUNT(*) AS count FROM programme_subjects WHERE subject = ?',
          [exam.subject],
        )
        if (Number(mappingCount.count) === 1) {
          await connection.execute('UPDATE exams SET programme = ? WHERE id = ?', [mapping.programme, exam.id])
          changes.push({ examId: exam.id, programme: mapping.programme })
          continue
        }
      }

      const [allocationCourses] = await connection.query(
        `SELECT s.course AS programme
         FROM exam_allocations ea
         INNER JOIN students s ON s.id = ea.student_id
         WHERE ea.exam_id = ?
         GROUP BY s.course
         ORDER BY s.course`,
        [exam.id],
      )
      if (allocationCourses.length === 1 && allocationCourses[0].programme) {
        await connection.execute('UPDATE exams SET programme = ? WHERE id = ?', [allocationCourses[0].programme, exam.id])
        changes.push({ examId: exam.id, programme: allocationCourses[0].programme })
      }
    }

    await connection.commit()
    console.log(JSON.stringify({ updated: changes, unresolved: exams.length - changes.length }))
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

backfillExamProgrammes()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())
