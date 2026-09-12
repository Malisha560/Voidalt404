const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')

async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const role = String(req.body.role || '').trim().toUpperCase()

  if (!email || !password || !['ADMIN', 'INVIGILATOR'].includes(role)) {
    return res.status(400).json({ message: 'Email, password, and a valid role are required' })
  }

  try {
    const [users] = await pool.execute(
      'SELECT id, email, password_hash, role FROM users WHERE email = ? AND role = ? LIMIT 1',
      [email, role],
    )
    const user = users[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    )

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error('Login failed:', error)
    return res.status(500).json({ message: 'Unable to sign in' })
  }
}

module.exports = { login }