import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { fetchAdmitCards, fetchExamAdmitCard, fetchExamQr, MOCK_FEE_STATUS } from './services/api'
import './App.css'

const navItems = [
  ['Home', '/student'], ['Classrooms', '#'], ['Subjects', '#'], ['Testpapers', '#'],
  ['Chat Rooms', '#'], ['My Time-Table', '#'], ['Help', '#'], ['Admit Card', '/student/admit-card'],
]

function StudentNavbar() {
  return <header className="portal-header">
    <div className="brand-area"><div className="college-mark" aria-hidden="true"><span>IC</span></div><div className="college-name">Islington College Kathmandu</div></div>
    <div className="header-actions" aria-label="Portal actions"><span aria-hidden="true">⌕</span><span className="notification" aria-hidden="true">♧<b>26</b></span><span className="profile" aria-hidden="true">●</span></div>
    <nav className="portal-nav" aria-label="Student navigation">
      {navItems.map(([label, href]) => href === '#' ? <a className="nav-item" href="#" key={label} onClick={(event) => event.preventDefault()}><span className="nav-icon" aria-hidden="true">{label === 'Help' ? '?' : '□'}</span>{label}</a> : <NavLink className="nav-item" to={href} key={label} end={label === 'Home'}><span className="nav-icon" aria-hidden="true">{label === 'Admit Card' ? '▣' : '□'}</span>{label}</NavLink>)}
    </nav>
  </header>
}

function StudentLayout({ children }) { return <><StudentNavbar />{children}</> }

function HomePage() {
  const navigate = useNavigate()
  return <main className="portal-main home-page">
    <p className="welcome">Welcome <strong>Malisha Kushwaha</strong>, what would you like to do today?</p>
    <div className="action-grid">
      <button className="action-card learn" onClick={() => navigate('/student/admit-card')}><strong>▣&nbsp; Learn/Revise</strong><span>Click here if you want to learn something new, or revise something that you have already learned</span></button>
      <button className="action-card assignments"><strong>♧&nbsp; Assignments and Contents</strong><span>Click here to get, submit and/or review assignments or other contents that your teacher may have assigned to you</span></button>
      <button className="action-card social"><strong>☏&nbsp; Socialise</strong><span>Click here to socialise with members of your community, including entering live video and text-chat sessions</span></button>
      <button className="action-card tests"><strong>▤&nbsp; Test Yourself</strong><span>Click here to assess how good you are, and identify areas of weakness so that you can directly work on those areas</span></button>
    </div>
    <div className="notice-board"><div className="tabs"><b>Notice Board</b><span>Today's Task</span><span>Upcoming Tasks</span></div><div className="empty-notice"><div>♧</div><p>Currently, there isn't any notice from the school.<br />Notices or consent forms sent by the schools are seen here.</p></div></div>
  </main>
}

function FeeBlockedMessage({ onSwitch }) {
  return <section className="blocked-state"><div className="state-icon blocked">⌑</div><p className="eyebrow">ADMIT CARD ACCESS</p><h1>Admit Card Unavailable</h1><p className="state-copy">Your examination fee has not been cleared. Please contact the Finance or Fee Support team to clear your examination fee before accessing your admit card.</p><button className="primary-button" type="button" onClick={onSwitch}>Contact Fee Support</button></section>
}

function ExamList({ exams, selectedId, onSelect }) {
  return <aside className="exam-list-panel"><div className="section-label">UPCOMING EXAMINATIONS</div><h2>Choose an examination</h2><div className="exam-list">{exams.map((exam) => <button className={`exam-list-item ${selectedId === exam.id ? 'selected' : ''}`} key={exam.id} onClick={() => onSelect(exam.id)}><span className="exam-dot" /><span><strong>{exam.subject}</strong><small>{exam.dateLabel}</small></span><span className="arrow">›</span></button>)}</div></aside>
}

function QRCodeCard({ examId }) {
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { let active = true; fetchExamQr(examId).then((data) => { if (active) setQr(data) }).catch(() => { if (active) setQr({ available: false, availableAt: '8:00 AM' }) }).finally(() => active && setLoading(false)); return () => { active = false } }, [examId])
  if (loading) return <div className="qr-card"><div className="qr-loading">Checking QR availability...</div></div>
  if (!qr?.available) return <div className="qr-card qr-locked"><div className="qr-status-icon">⌑</div><strong>QR CODE LOCKED</strong><p>Your examination QR code is not available yet.</p><small>QR code will be available at<br /><b>{qr?.availableAt || '8:00 AM'}</b></small><span>The QR code can be accessed 2 hours before the examination begins.</span></div>
  return <div className="qr-card qr-active"><div className="qr-status-icon">✓</div><strong>QR CODE ACTIVE</strong><QRCodeCanvas value={qr.token} size={144} level="M" includeMargin /><p>Present this QR code to the invigilator at the examination entrance.</p></div>
}

function ExamDetails({ exam }) {
  return <section className="admit-card"><div className="card-heading"><div><p className="eyebrow">DIGITAL ADMIT CARD</p><h1>{exam.subject}</h1></div><span className="fee-badge">✓ FEE CLEARED</span></div><div className="info-section"><h3>Student Information</h3><div className="info-grid"><div><small>Name</small><b>{exam.student.name}</b></div><div><small>Student ID</small><b>{exam.student.studentId}</b></div><div><small>Course</small><b>{exam.student.course}</b></div></div></div><div className="info-section"><h3>Examination Details</h3><div className="info-grid exam-info"><div><small>Subject</small><b>{exam.subject}</b></div><div><small>Exam Date</small><b>{exam.dateLabel}</b></div><div><small>Time</small><b>{exam.startLabel} - {exam.endLabel}</b></div><div><small>Building</small><b>{exam.building}</b></div><div><small>Room</small><b>{exam.room}</b></div><div><small>Seat Number</small><b>{exam.seat}</b></div></div></div><QRCodeCard key={exam.id} examId={exam.id} /></section>
}

function AdmitCardPage() {
  const [searchParams] = useSearchParams()
  const [exams, setExams] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedExam, setSelectedExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const feeStatus = searchParams.get('feeStatus')?.toUpperCase() || MOCK_FEE_STATUS
  useEffect(() => { fetchAdmitCards(feeStatus).then((items) => { setExams(items); setSelectedId(items[0]?.id) }).finally(() => setLoading(false)) }, [feeStatus])
  useEffect(() => { if (!selectedId) return; fetchExamAdmitCard(selectedId, feeStatus).then(setSelectedExam) }, [selectedId, feeStatus])
  const switchFeeState = () => window.location.assign(`/student/admit-card?feeStatus=${feeStatus === 'CLEAR' ? 'UNCLEAR' : 'CLEAR'}`)
  return <main className="portal-main admit-page"><div className="page-intro"><div><p className="section-label">STUDENT SERVICES</p><h1>Admit Card</h1><p>Access your examination entry pass and details.</p></div><span className={`fee-badge large ${feeStatus === 'CLEAR' ? '' : 'unclear'}`}>{feeStatus === 'CLEAR' ? '✓ FEE CLEARED' : '⌑ FEE UNCLEAR'}</span></div>{loading ? <div className="loading-state">Loading your examination access...</div> : feeStatus !== 'CLEAR' ? <FeeBlockedMessage onSwitch={switchFeeState} /> : <div className="admit-layout"><ExamList exams={exams} selectedId={selectedId} onSelect={setSelectedId} />{selectedExam && <ExamDetails exam={selectedExam} />}</div>}<button className="demo-toggle" onClick={switchFeeState}>Preview {feeStatus === 'CLEAR' ? 'unclear' : 'clear'} fee state</button></main>
}

function App() { return <BrowserRouter><StudentLayout><Routes><Route path="/student" element={<HomePage />} /><Route path="/student/admit-card" element={<AdmitCardPage />} /><Route path="/student/admit-card/:examId" element={<AdmitCardPage />} /><Route path="*" element={<HomePage />} /></Routes></StudentLayout></BrowserRouter> }

export default App
