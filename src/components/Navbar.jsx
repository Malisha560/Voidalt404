import React from 'react'
import logoSvg from '../assets/islington-logo.svg'

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

    return (
        <header className="navbar-container">
            <div className="navbar-logo-section">
                <img
                    src={logoSvg}
                    alt="Islington College"
                    className="navbar-logo"
                />
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
                            onClick={() => setActiveTab(item.name)}
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