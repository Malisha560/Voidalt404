import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { fetchInvigilatorStudent, updateInvigilatorAttendance } from '../../services/api'
import './Verification.css'

function Verification() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const verificationMethod = searchParams.get('source') === 'qr' ? 'QR' : 'MANUAL'
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('')
  const [actionState, setActionState] = useState('')

  useEffect(() => {
    fetchInvigilatorStudent(id).then((data) => { setStudent(data); setSelectedExamId(String(searchParams.get('examId') || data.exams?.[0]?.id || '')) }).catch(() => setError('Unable to load student information.')).finally(() => setLoading(false))
  }, [id, searchParams])

  const updateAttendance = async (status) => {
    if (!selectedExamId) { setError('No examination allocation found for this student.'); return }
    setActionState(`${status}_SAVING`)
    setError('')
    try {
      await updateInvigilatorAttendance(student.id, selectedExamId, status, verificationMethod)
      navigate('/invigilator/attendance-log', { replace: true })
    } catch (requestError) {
      setActionState('')
      setError(requestError.response?.data?.message || 'Unable to update attendance.')
    }
  }

  if (loading) return <main className="student-card-page"><p className="student-card-message">Loading student information...</p></main>
  if (error || !student) return <main className="student-card-page"><p className="student-card-message error">{error || 'Student not found.'}</p></main>

  const initials = student.name.split(' ').map((name) => name[0]).slice(0, 2).join('').toUpperCase()
  return <main className="student-card-page">
    <button className="back-to-students" type="button" onClick={() => navigate('/invigilator/student-info')}>← Student Info</button>
    <section className={`student-id-card ${student.feeStatus === 'CLEAR' ? 'fee-clear-card' : 'fee-unclear-card'}`}>
      <header className="id-card-header"><div className="id-card-mark">IC</div><span>Islington College Kathmandu</span><strong>STUDENT ID CARD</strong><div className="id-card-check">✓</div></header>
      <div className="id-card-body"><div className="id-card-accent"><span>{student.course}</span></div><div className="student-photo">{student.profileImage ? <img src={student.profileImage} alt={`${student.name} profile`} /> : <span>{initials}</span>}</div><dl className="student-card-details"><div><dt>Name:</dt><dd>{student.name}</dd></div><div><dt>ID:</dt><dd>{student.email}</dd></div><div><dt>Contact:</dt><dd>{student.phoneNumber}</dd></div><div><dt>Student ID:</dt><dd>{student.studentId}</dd></div><div><dt>Level:</dt><dd>{student.year ? `Level ${student.year}` : 'Not specified'}</dd></div><div><dt>Fee Status:</dt><dd className={student.feeStatus === 'CLEAR' ? 'clear' : 'unclear'}>{student.feeStatus}</dd></div>{student.feeStatus === 'CLEAR' && <div><dt>Exam:</dt><dd>{student.exams?.length ? <select value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)} aria-label="Select examination">{student.exams.map((exam) => <option value={exam.id} key={exam.id}>{exam.subject} - {exam.examName}</option>)}</select> : <span className="no-exam-allocation">No examination allocated</span>}</dd></div>}</dl>{student.feeStatus === 'CLEAR' && <div className="id-card-actions"><span className="action-label">Entry decision</span><div className="entry-action-buttons"><button className="approve-card-button" type="button" disabled={Boolean(actionState) || !selectedExamId} onClick={() => updateAttendance('PRESENT')} aria-label="Approve student" title="Mark present">✓</button><button className="reject-card-button" type="button" disabled={Boolean(actionState) || !selectedExamId} onClick={() => updateAttendance('ABSENT')} aria-label="Reject student" title="Mark absent">×</button></div></div>}</div><footer>ISLINGTON COLLEGE KATHMANDU</footer>
    </section>
  </main>
}

export default Verification
