import { NavLink } from 'react-router-dom'
import Logo from './Logo'

const navItemsByRole = {
  student: [
    ['Home', '/student', '□'], ['Classrooms', '#', '□'], ['Subjects', '#', '□'], ['Testpapers', '#', '□'],
    ['Chat Rooms', '#', '□'], ['My Time-Table', '#', '□'], ['Help', '#', '?'], ['Admit Card', '/student/admit-card', '▣'],
  ],
  invigilator: [
    ['Scan', '/invigilator/scan', '▣'], ['Student Info', '/invigilator/student-info', '□'], ['Attendance Record', '/invigilator/attendance-record', '▤'],
  ],
  admin: [
    ['Student Info', '/admin/student-info', '♙'], ['Attendance Log', '/admin/attendance-log', '▱'],
  ],
}

function Navbar({ role = 'student', student, studentId }) {
  const navItems = navItemsByRole[role] || navItemsByRole.student
  const studentCanAccessAdmitCard = role !== 'student' || student?.feeStatus === 'CLEAR'
  const addStudentQuery = (href) => studentId ? `${href}?studentId=${encodeURIComponent(studentId)}` : href

  return <header className="portal-header">
    <div className="brand-area"><Logo /><div className="college-name">Islington College Kathmandu</div></div>
    <div className="header-actions" aria-label="Portal actions"><span aria-hidden="true">⌕</span><span className="notification" aria-hidden="true">♧<b>26</b></span><button className="profile" type="button" aria-label="Profile">●</button></div>
    <nav className="portal-nav" aria-label={`${role} portal navigation`}>
      {navItems.filter(([label]) => label !== 'Admit Card' || studentCanAccessAdmitCard).map(([label, href, icon]) => href === '#' ? <a className="nav-item" href="#" key={label} onClick={(event) => event.preventDefault()}><span className="nav-icon" aria-hidden="true">{icon}</span>{label}</a> : <NavLink className="nav-item" to={addStudentQuery(href)} key={label} end={label === 'Home'}><span className="nav-icon" aria-hidden="true">{icon}</span>{label}</NavLink>)}
    </nav>
  </header>
}

export default Navbar
