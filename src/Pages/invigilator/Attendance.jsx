import { useEffect, useState } from 'react'
import { fetchInvigilatorAttendance, updateInvigilatorAttendance } from '../../services/api'
import './Attendance.css'

function Attendance() {
  const [records, setRecords] = useState([])
  const [examination, setExamination] = useState('')
  const [venue, setVenue] = useState('')
  const [searchName, setSearchName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState('')

  useEffect(() => { fetchInvigilatorAttendance().then(setRecords).catch(() => setError('Unable to load attendance records.')).finally(() => setLoading(false)) }, [])

  const exams = [...new Map(records.map((record) => [record.examId, record])).values()]
  const venues = [...new Set(records.map((record) => record.building).filter(Boolean))]
  const filteredRecords = records.filter((record) => {
    const query = searchName.trim().toLowerCase()
    return (!examination || String(record.examId) === examination) && (!venue || record.building === venue) && (!query || [record.name, record.studentCode].some((value) => String(value || '').toLowerCase().includes(query)))
  })

  const changeAttendance = async (record, status) => {
    const key = `${record.examId}-${record.studentId}`
    setSavingKey(key)
    setError('')
    try {
      await updateInvigilatorAttendance(record.studentId, record.examId, status)
      setRecords((current) => current.map((item) => item.examId === record.examId && item.studentId === record.studentId ? { ...item, status, method: 'MANUAL', verifiedAt: new Date().toISOString() } : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update attendance.')
    } finally {
      setSavingKey('')
    }
  }

  return <main className="attendance-info-page">
    <div className="attendance-page-heading"><p className="section-label">INVIGILATOR PORTAL</p><h1>Attendance Log</h1><p>Review and update attendance for allocated examinations.</p></div>
    <div className="attendance-filters"><select value={examination} onChange={(event) => setExamination(event.target.value)} aria-label="Filter by examination"><option value="">Examination</option>{exams.map((record) => <option value={record.examId} key={record.examId}>{record.examName} - {record.subject}</option>)}</select><select value={venue} onChange={(event) => setVenue(event.target.value)} aria-label="Filter by venue"><option value="">Venue</option>{venues.map((item) => <option value={item} key={item}>{item}</option>)}</select><label className="attendance-search"><input value={searchName} onChange={(event) => setSearchName(event.target.value)} placeholder="Student Name" aria-label="Search attendance" /><span>⌕</span></label></div>
    {error && <p className="attendance-error">{error}</p>}
    <div className="attendance-table-card"><table className="attendance-table"><thead><tr><th>S. No</th><th>Name</th><th>College ID</th><th>Contact</th><th>Attendance</th></tr></thead><tbody>{loading && <tr><td colSpan="5" className="attendance-message">Loading attendance...</td></tr>}{!loading && !error && filteredRecords.map((record, index) => { const key = `${record.examId}-${record.studentId}`; return <tr key={key}><td>{index + 1}.</td><td>{record.name}</td><td>{record.email}</td><td>{record.phoneNumber}</td><td><button className={`attendance-toggle ${record.status === 'PRESENT' ? 'is-present' : 'is-absent'}`} disabled={savingKey === key} onClick={() => changeAttendance(record, record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT')}>{savingKey === key ? 'Saving...' : record.status === 'PRESENT' ? 'Present' : 'Absent'}</button></td></tr>})}{!loading && !error && filteredRecords.length === 0 && <tr><td colSpan="5" className="attendance-message">No attendance records found.</td></tr>}</tbody></table></div>
  </main>
}

export default Attendance
