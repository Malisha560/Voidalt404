import React from 'react'
import Logo from './Logo'
import {
  FiGrid,
  FiPenTool,
  FiBook,
  FiEdit,
  FiMessageSquare,
  FiCalendar,
  FiUserCheck,
  FiCreditCard,
  FiSearch,
  FiBell,
  FiUser
} from 'react-icons/fi'

const Navbar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { name: 'Home', icon: <FiGrid /> },
    { name: 'Classrooms', icon: <FiPenTool /> },
    { name: 'Subjects', icon: <FiBook /> },
    { name: 'Testpapers', icon: <FiEdit /> },
    { name: 'Chat Rooms', icon: <FiMessageSquare /> },
    { name: 'My Time-Table', icon: <FiCalendar /> },
    { name: 'Help', icon: <FiUserCheck /> },
    { name: 'Admit Card', icon: <FiCreditCard /> },
  ]

  const handleNavClick = (itemName) => {
    if (itemName === 'Home' || itemName === 'Admit Card') {
      setActiveTab(itemName)
    } else {
      alert(`This is just a demo of the MST section (${itemName}).`)
    }
  }

  return (
    <header className="navbar-container">
      <div className="navbar-logo-section">
        <Logo />
      </div>

      <div className="navbar-main-content">
        <div className="navbar-header-top">
          <span className="college-title">Islington College Kathmandu</span>
          <div className="navbar-action-icons">
            <button className="icon-btn" title="Search"><FiSearch /></button>
            <button className="icon-btn" title="Notifications"><FiBell /></button>
            <button className="icon-btn profile-avatar-btn" title="Profile"><FiUser /></button>
          </div>
        </div>

        <nav className="navbar-nav-links">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`nav-link-btn ${activeTab === item.name ? 'active' : ''}`}
              onClick={() => handleNavClick(item.name)}
            >
              <span className="nav-link-icon">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Navbar