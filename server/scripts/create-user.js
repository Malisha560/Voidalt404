require('dotenv').config()

const bcrypt = require('bcryptjs')
const pool = require('../config/db')

async function createUser() {
  const email = String(process.env.USER_EMAIL || '').trim().toLowerCase()
  const password = String(process.env.USER_PASSWORD || '')
  const role = String(process.env.USER_ROLE || '').trim().toUpperCase()

  if (!email || !password || !['ADMIN', 'INVIGILATOR'].includes(role)) {
    throw new Error('Set USER_EMAIL, USER_PASSWORD, and USER_ROLE=ADMIN or INVIGILATOR')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await pool.execute(
    `INSERT INTO users (email, password_hash, role)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
    [email, passwordHash, role],
  )
  console.log(`Created ${role} account for ${email}`)
}

createUser().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
}).finally(() => pool.end())