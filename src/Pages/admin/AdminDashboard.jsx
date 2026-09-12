import { useEffect, useState } from 'react'
import { fetchAdminDashboard } from '../../services/api'

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { fetchAdminDashboard().then(setDashboard).catch(() => setError('Unable to load dashboard data.')) }, [])

  const summary = dashboard?.summary || {}
  return <main className="admin-dashboard-page"><div className="admin-page-heading"><p className="section-label">ADMIN PORTAL</p><h1>Dashboard</h1><p>Overview of students, examinations, and attendance.</p></div>{error && <p className="admin-table-error">{error}</p>}<div className="dashboard-stat-grid"><Stat label="Total students" value={summary.totalStudents ?? '-'} /><Stat label="Total examinations" value={summary.totalExams ?? '-'} /><Stat label="Upcoming examinations" value={summary.upcomingExams ?? '-'} /><Stat label="Present" value={summary.presentStudents ?? '-'} tone="positive" /><Stat label="Absent" value={summary.absentStudents ?? '-'} tone="negative" /></div><section className="dashboard-section"><div className="dashboard-section-heading"><h2>Upcoming examinations</h2><span>{dashboard?.upcomingExams?.length || 0} scheduled</span></div><div className="dashboard-exam-list">{dashboard?.upcomingExams?.map((exam) => <div className="dashboard-exam-row" key={exam.id}><div><strong>{exam.examName}</strong><span>{exam.subject}</span></div><div><strong>{formatDate(exam.examDate)}</strong><span>{String(exam.startTime).slice(0, 5)} · {exam.allocatedStudents} allocated</span></div></div>)}{dashboard && !dashboard.upcomingExams?.length && <p className="dashboard-empty">No upcoming examinations.</p>}{!dashboard && !error && <p className="dashboard-empty">Loading dashboard...</p>}</div></section></main>
}

function Stat({ label, value, tone = '' }) { return <div className={`dashboard-stat ${tone}`}><span>{label}</span><strong>{value}</strong></div> }
function formatDate(value) { return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default AdminDashboard
