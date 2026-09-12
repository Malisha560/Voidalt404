import { useEffect, useState } from 'react'
import { fetchAdminStudents, updateStudentFeeStatus } from '../../services/api'

function Fees() {
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { fetchAdminStudents().then(setStudents).catch(() => setError('Unable to load fee statuses.')) }, [])
  const changeStatus = async (studentId, status) => { const previous = students.find((student) => student.id === studentId)?.feeStatus; setStudents((current) => current.map((student) => student.id === studentId ? { ...student, feeStatus: status } : student)); try { await updateStudentFeeStatus(studentId, status) } catch { setStudents((current) => current.map((student) => student.id === studentId ? { ...student, feeStatus: previous } : student)); setError('Unable to update fee status.') } }
  return <main className="admin-management-page"><div className="admin-page-heading"><p className="section-label">ADMIN PORTAL</p><h1>Fee Status</h1><p>Fee status controls examination access and QR issuance.</p></div>{error && <p className="admin-table-error">{error}</p>}<div className="fee-list">{students.map((student) => <div className="fee-row" key={student.id}><div><strong>{student.name}</strong><span>{student.studentId} · {student.email}</span></div><select value={student.feeStatus} onChange={(event) => changeStatus(student.id, event.target.value)} aria-label={`Fee status for ${student.name}`}><option value="CLEAR">CLEAR</option><option value="UNCLEAR">UNCLEAR</option></select></div>)}</div></main>
}

export default Fees