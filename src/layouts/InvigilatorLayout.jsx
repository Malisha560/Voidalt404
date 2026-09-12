import { NavLink, Outlet } from 'react-router-dom'

function InvigilatorLayout() {
  return <div className="portal-shell invigilator-shell">
    <aside className="portal-sidebar">
      <div className="sidebar-brand"><strong>EXAM ENTRY</strong><span>INVIGILATOR PORTAL</span></div>
      <nav className="sidebar-nav" aria-label="Invigilator portal navigation">
        <NavLink to="/invigilator" end>Dashboard</NavLink>
        <NavLink to="/invigilator/search">Search Student</NavLink>
        <NavLink to="/invigilator/scan">Scan QR</NavLink>
        <NavLink to="/invigilator/attendance">Attendance</NavLink>
      </nav>
    </aside>
    <div className="portal-workspace"><header className="portal-topbar"><span>Examination Entry</span><span className="portal-user">Invigilator</span></header><Outlet /></div>
  </div>
}

export default InvigilatorLayout
