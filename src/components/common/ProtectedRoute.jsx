import { useState } from 'react'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ role, children }) {
  let session = null
  try {
    session = JSON.parse(localStorage.getItem('auth_session'))
  } catch {
    localStorage.removeItem('auth_session')
  }

  const tokenPayload = decodeToken(session?.token)
  const [now] = useState(() => Date.now())

  const tokenIsValid = Boolean(tokenPayload?.exp && tokenPayload.exp * 1000 > now)
  if (!session?.token || session.user?.role !== role || tokenPayload?.role !== role || !tokenIsValid) {
    localStorage.removeItem('auth_session')
    return <Navigate to="/login" replace />
  }
  return children
}

function decodeToken(token) {
  try {
    return JSON.parse(atob(token?.split('.')[1] || ''))
  } catch {
    return null
  }
}

export default ProtectedRoute