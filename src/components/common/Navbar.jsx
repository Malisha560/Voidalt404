import { NavLink } from 'react-router-dom'
import { FiBell, FiBook, FiCalendar, FiCreditCard, FiEdit, FiGrid, FiMessageSquare, FiPenTool, FiSearch, FiUser, FiUserCheck } from 'react-icons/fi'
import Logo from './Logo'

const navItemsByRole = {
  student: [
    { label: 'Home', href: '/student', icon: FiGrid },
    { label: 'Classrooms', href: '#', icon: FiPenTool },
    { label: 'Subjects', href: '#', icon: FiBook },
    { label: 'Testpapers', href: '#', icon: FiEdit },
    { label: 'Chat Rooms', href: '#', icon: FiMessageSquare },
    { label: 'My Time-Table', href: '#', icon: FiCalendar },
    { label: 'Help', href: '#', icon: FiUserCheck },
    { label: 'Admit Card', href: '/student/admit-card', icon: FiCreditCard },
  ],
  invigilator: [
    { label: 'Dashboard', href: '/invigilator/dashboard', icon: FiGrid },
    { label: 'Scan', href: '/invigilator/scan', icon: FiCreditCard },
    { label: 'Student Info', href: '/invigilator/student-info', icon: FiUser },
    { label: 'Attendance Log', href: '/invigilator/attendance-log', icon: FiCalendar },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: FiGrid },
    { label: 'Student Info', href: '/admin/student-info', icon: FiUser },
    { label: 'Exams', href: '/admin/exams', icon: FiEdit },
    { label: 'Attendance Log', href: '/admin/attendance-log', icon: FiCalendar },
    { label: 'Fees', href: '/admin/fees', icon: FiCreditCard },
  ],
}

function Navbar({ role = 'student', student, studentId }) {
  const navItems = navItemsByRole[role] || navItemsByRole.student
  const studentAdmitCardLocked = role === 'student' && student?.feeStatus !== 'CLEAR'
  const addStudentQuery = (href) => studentId ? `${href}?studentId=${encodeURIComponent(studentId)}` : href

  return <header className="portal-header navbar-container">
    <div className="navbar-logo-section"><Logo /></div>
    <div className="navbar-main-content">
      <div className="navbar-header-top"><span className="college-title">Islington College Kathmandu</span><div className="navbar-action-icons" aria-label="Portal actions"><button className="icon-btn" type="button" title="Search" aria-label="Search"><FiSearch /></button><button className="icon-btn notification" type="button" title="Notifications" aria-label="Notifications"><FiBell /><b>26</b></button><button className="icon-btn profile-avatar-btn" type="button" title="Profile" aria-label="Profile"><FiUser /></button></div></div>
      <nav className="portal-nav navbar-nav-links" aria-label={`${role} portal navigation`}>
        {navItems.map(({ label, href, icon: Icon }) => href === '#' ? <button className="nav-item nav-link-btn" type="button" key={label} onClick={() => window.alert(`This is a demo of the student portal section: ${label}.`)}><span className="nav-icon nav-link-icon" aria-hidden="true"><Icon /></span><span>{label}</span></button> : <NavLink className={`nav-item nav-link-btn ${label === 'Admit Card' && studentAdmitCardLocked ? 'locked' : ''}`} to={addStudentQuery(href)} key={label} end={label === 'Home'} title={label === 'Admit Card' && studentAdmitCardLocked ? 'Clear your fees to access your admit card' : undefined}><span className="nav-icon nav-link-icon" aria-hidden="true"><Icon /></span><span>{label}</span>{label === 'Admit Card' && studentAdmitCardLocked && <span className="nav-lock-label">Locked</span>}</NavLink>)}
      </nav>
    </div>
  </header>
}

export default Navbar
