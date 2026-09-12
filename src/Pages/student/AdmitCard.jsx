import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { fetchAdmitCards, fetchExamAdmitCard, fetchExamQr } from '../../services/api'

function FeeBlockedMessage() {
  return <section className="blocked-state"><div className="state-icon blocked">⌑</div><p className="eyebrow">ADMIT CARD ACCESS</p><h1>Admit Card Unavailable</h1><p className="state-copy">Your examination fee has not been cleared. Please contact the Finance or Fee Support team to clear your examination fee before accessing your admit card.</p></section>
}

function ExamList({ exams, subjects, selectedSubject, selectedId, onSubjectChange, onSelect }) {
  return <aside className="exam-list-panel"><div className="section-label">UPCOMING EXAMINATIONS</div><h2>Choose an examination</h2><label className="subject-select"><span>Subject</span><select value={selectedSubject} onChange={(event) => onSubjectChange(event.target.value)} aria-label="Select subject">{subjects.map((subject) => <option value={subject} key={subject}>{subject}</option>)}</select></label><div className="exam-list">{exams.map((exam) => <button className={`exam-list-item ${selectedId === exam.id ? 'selected' : ''}`} key={exam.id} onClick={() => onSelect(exam.id)}><span className="exam-dot" /><span><strong>{exam.subject}</strong><small>{exam.dateLabel}</small></span><span className="arrow">›</span></button>)}</div></aside>
}

function QRCodeCard({ examId, studentId }) {
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { let active = true; fetchExamQr(examId, studentId).then((data) => { if (active) setQr(data) }).catch(() => { if (active) setQr({ available: false, availableAt: 'Unavailable' }) }).finally(() => active && setLoading(false)); return () => { active = false } }, [examId, studentId])
  if (loading) return <div className="qr-card"><div className="qr-loading">Checking QR availability...</div></div>
  if (!qr?.available) return <div className="qr-card qr-locked"><div className="qr-status-icon">⌑</div><strong>QR CODE LOCKED</strong><p>Your examination QR code is not available yet.</p><small>QR code will be available at<br /><b>{qr?.availableAt || '8:00 AM'}</b></small><span>The QR code can be accessed 2 hours before the examination begins.</span></div>
  return <div className="qr-card qr-active"><div className="qr-status-icon">✓</div><strong>QR CODE ACTIVE</strong><QRCodeCanvas value={qr.token} size={144} level="M" includeMargin /><p>Present this QR code to the invigilator at the examination entrance.</p></div>
}

function ExamDetails({ exam, studentId }) {
  return <section className="admit-card"><div className="card-heading"><div><p className="eyebrow">DIGITAL ADMIT CARD</p><h1>{exam.subject}</h1></div><span className="fee-badge">✓ FEE CLEARED</span></div><div className="info-section"><h3>Student Information</h3><div className="info-grid"><div><small>Name</small><b>{exam.student.name}</b></div><div><small>Student ID</small><b>{exam.student.studentId}</b></div><div><small>Course</small><b>{exam.student.course}</b></div></div></div><div className="info-section"><h3>Examination Details</h3><div className="info-grid exam-info"><div><small>Subject</small><b>{exam.subject}</b></div><div><small>Exam Date</small><b>{exam.dateLabel}</b></div><div><small>Time</small><b>{exam.startLabel} - {exam.endLabel}</b></div><div><small>Building</small><b>{exam.building}</b></div><div><small>Room</small><b>{exam.room}</b></div><div><small>Seat Number</small><b>{exam.seat}</b></div></div></div><QRCodeCard key={exam.id} examId={exam.id} studentId={studentId} /></section>
}

function AdmitCard() {
  const navigate = useNavigate()
  const { examId } = useParams()
  const { studentId } = useOutletContext()
  const [exams, setExams] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedExam, setSelectedExam] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loading, setLoading] = useState(true)
  const [feeStatus, setFeeStatus] = useState(null)
  useEffect(() => { fetchAdmitCards(studentId).then(({ exams: items, feeStatus: status }) => { setFeeStatus(status); setExams(items); const initialExam = items.find((exam) => exam.id === examId) || items[0]; setSelectedSubject(initialExam?.subject || ''); setSelectedId(initialExam?.id) }).catch(() => setFeeStatus('UNKNOWN')).finally(() => setLoading(false)) }, [studentId, examId])
  useEffect(() => { if (!selectedId) return; fetchExamAdmitCard(selectedId, studentId).then(setSelectedExam).catch(() => setSelectedExam(null)) }, [selectedId, studentId])
  const selectExam = (id) => { setSelectedId(id); navigate(`/student/admit-card/${id}?studentId=${encodeURIComponent(studentId)}`) }
  const subjects = [...new Set(exams.map((exam) => exam.subject))]
  const subjectExams = exams.filter((exam) => exam.subject === selectedSubject)
  const selectSubject = (subject) => { setSelectedSubject(subject); const firstExam = exams.find((exam) => exam.subject === subject); if (firstExam) selectExam(firstExam.id) }
  return <main className="portal-main admit-page"><div className="page-intro"><div><p className="section-label">STUDENT SERVICES</p><h1>Admit Card</h1><p>Access your examination entry pass and details.</p></div><span className={`fee-badge large ${feeStatus === 'CLEAR' ? '' : 'unclear'}`}>{feeStatus === 'CLEAR' ? '✓ FEE CLEARED' : '⌑ FEE UNCLEAR'}</span></div>{loading ? <div className="loading-state">Loading your examination access...</div> : feeStatus !== 'CLEAR' ? <FeeBlockedMessage /> : <div className="admit-layout"><ExamList exams={subjectExams} subjects={subjects} selectedSubject={selectedSubject} selectedId={selectedId} onSubjectChange={selectSubject} onSelect={selectExam} />{selectedExam && <ExamDetails exam={selectedExam} studentId={studentId} />}</div>}</main>
}

export default AdmitCard
