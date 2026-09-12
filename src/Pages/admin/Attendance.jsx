import { useEffect, useState } from 'react'
import { fetchAttendance, updateAttendance } from '../../services/api'
import '../../pages/invigilator/Attendance.css'

function Attendance() {
  const [records, setRecords] = useState([])
  const [examId, setExamId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState('')

  useEffect(() => { fetchAttendance().then((data) => { setRecords(data); setExamId(String(data[0]?.examId || '')) }).catch(() => setError('Unable to load attendance records.')).finally(() => setLoading(false)) }, [])

  const exams = [...new Map(records.map((record) => [record.examId, record])).values()]
  const filteredRecords = records.filter((record) => !examId || String(record.examId) === examId)
  const changeAttendance = async (record, status) => {
    const key = `${record.examId}-${record.studentId}`
    setSavingKey(key)
    try {
      await updateAttendance(record.studentId, record.examId, status)
      setRecords((current) => current.map((item) => item.examId === record.examId && item.studentId === record.studentId ? { ...item, status, method: 'MANUAL', verifiedAt: new Date().toISOString() } : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update attendance.')
    } finally { setSavingKey('') }
  }

  return <main className="attendance-info-page"><div className="attendance-page-heading"><p className="section-label">ADMIN PORTAL</p><h1>Attendance Log</h1><p>Review attendance records by examination.</p></div><div className="attendance-filters"><select value={examId} onChange={(event) => setExamId(event.target.value)} aria-label="Filter by examination"><option value="">All examinations</option>{exams.map((record) => <option value={record.examId} key={record.examId}>{record.examName} - {record.subject}</option>)}</select></div>{error && <p className="attendance-error">{error}</p>}<div className="attendance-table-card"><table className="attendance-table"><thead><tr><th>S. No</th><th>Name</th><th>College ID</th><th>Contact</th><th>Attendance</th><th>Method</th><th>Last action</th></tr></thead><tbody>{loading && <tr><td colSpan="7" className="attendance-message">Loading attendance...</td></tr>}{!loading && !error && filteredRecords.map((record, index) => { const key = `${record.examId}-${record.studentId}`; return <tr key={key}><td>{index + 1}.</td><td>{record.name}</td><td>{record.email}</td><td>{record.phoneNumber}</td><td><button className={`attendance-toggle ${record.status === 'PRESENT' ? 'is-present' : 'is-absent'}`} disabled={savingKey === key} onClick={() => changeAttendance(record, record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT')}>{savingKey === key ? 'Saving...' : record.status === 'PRESENT' ? 'Present' : 'Absent'}</button></td><td>{record.method || '-'}</td><td>{record.lastAction || '-'}</td></tr> })}{!loading && !error && filteredRecords.length === 0 && <tr><td colSpan="7" className="attendance-message">No attendance records found.</td></tr>}</tbody></table></div></main>
}

export default Attendance
