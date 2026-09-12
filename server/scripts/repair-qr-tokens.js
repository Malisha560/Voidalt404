require('dotenv').config()

const pool = require('../config/db')

async function repairQrTokens() {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    await connection.query(`
      DELETE old_token FROM qr_tokens old_token
      INNER JOIN qr_tokens newer_token
        ON newer_token.exam_id = old_token.exam_id
       AND newer_token.student_id = old_token.student_id
       AND newer_token.id > old_token.id
    `)

    await connection.query(`
      ALTER TABLE qr_tokens
      ADD UNIQUE KEY unique_exam_student_qr (exam_id, student_id)
    `)

    await connection.commit()
    console.log('QR tokens repaired and uniqueness enforced.')
  } catch (error) {
    await connection.rollback()
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('QR token uniqueness is already enforced.')
      return
    }
    throw error
  } finally {
    connection.release()
  }
}

repairQrTokens()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())
