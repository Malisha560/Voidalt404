import { useEffect, useState } from 'react'
import { fetchInvigilatorDashboard } from '../../services/api'

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { fetchInvigilatorDashboard().then(({ summary: data }) => setSummary(data)).catch(() => setError('Unable to load dashboard data.')) }, [])
  return <main className="admin-dashboard-page"><div className="admin-page-heading"><p className="section-label">INVIGILATOR PORTAL</p><h1>Dashboard</h1><p>Live overview of allocated examinations and attendance.</p></div>{error && <p className="admin-table-error">{error}</p>}<div className="dashboard-stat-grid"><Stat label="Allocated students" value={summary?.allocatedStudents ?? '-'} /><Stat label="Allocated examinations" value={summary?.allocatedExams ?? '-'} /><Stat label="Present" value={summary?.presentStudents ?? '-'} tone="positive" /><Stat label="Absent" value={summary?.absentStudents ?? '-'} tone="negative" /></div></main>
}
function Stat({ label, value, tone = '' }) { return <div className={`dashboard-stat ${tone}`}><span>{label}</span><strong>{value}</strong></div> }
export default Dashboard