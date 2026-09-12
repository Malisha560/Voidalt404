import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchInvigilatorStudents } from '../../services/api'
import './SearchStudent.css'

function SearchStudent() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [course, setCourse] = useState('')
  const [level, setLevel] = useState('')
  const [searchName, setSearchName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInvigilatorStudents().then(setStudents).catch(() => setError('Unable to load student information.')).finally(() => setLoading(false))
  }, [])

  const courses = [...new Set(students.map((student) => student.course).filter(Boolean))]
  const levels = [...new Set(students.map((student) => student.year).filter(Boolean))]
  const filteredStudents = students.filter((student) => {
    const query = searchName.trim().toLowerCase()
    return (!course || student.course === course) && (!level || String(student.year) === level) && (!query || [student.name, student.studentId].some((value) => String(value || '').toLowerCase().includes(query)))
  })

  return <main className="invigilator-student-page">
    <div className="invigilator-page-heading"><div><p className="section-label">INVIGILATOR PORTAL</p><h1>Student Information</h1><p>Search student details before examination entry verification.</p></div></div>
    <div className="student-filters">
      <select value={course} onChange={(event) => setCourse(event.target.value)} aria-label="Filter by course"><option value="">Course</option>{courses.map((item) => <option value={item} key={item}>{item}</option>)}</select>
      <select value={level} onChange={(event) => setLevel(event.target.value)} aria-label="Filter by level"><option value="">Level</option>{levels.map((item) => <option value={item} key={item}>{item}</option>)}</select>
      <label className="student-search"><input value={searchName} onChange={(event) => setSearchName(event.target.value)} placeholder="Student Name" aria-label="Search students" /><span aria-hidden="true">⌕</span></label>
    </div>
    {error && <p className="admin-table-error">{error}</p>}
    <div className="student-table-wrap"><table className="student-table"><thead><tr><th>S. No</th><th>Name</th><th>College ID</th><th>Contact</th><th>Fee Status</th></tr></thead><tbody>
      {loading && <tr><td className="table-message" colSpan="5">Loading student information...</td></tr>}
      {!loading && !error && filteredStudents.map((student, index) => <tr className="student-row-link" key={student.id} onClick={() => navigate(`/invigilator/verification/${student.id}`)}><td>{index + 1}.</td><td>{student.name}</td><td>{student.email}</td><td>{student.phoneNumber}</td><td><span className={`invigilator-fee-status ${student.feeStatus.toLowerCase()}`}>{student.feeStatus === 'CLEAR' ? 'Clear' : 'Unclear'}</span></td></tr>)}
      {!loading && !error && filteredStudents.length === 0 && <tr><td className="table-message" colSpan="5">No students found.</td></tr>}
    </tbody></table></div>
  </main>
}

export default SearchStudent
