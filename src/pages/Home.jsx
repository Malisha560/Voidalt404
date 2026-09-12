import React, { useState } from 'react'
import { FiBookOpen, FiFileText, FiUsers, FiCheckSquare, FiInbox } from 'react-icons/fi'

const Home = () => {
    const [activeTab, setActiveTab] = useState('Notice Board')

    return (
        <div className="home-container">
            <div className="welcome-banner">
                <h2>
                    Welcome <strong>Hardik Ghimire</strong>, what would you like to do today?
                </h2>
            </div>

            <div className="cards-grid">
                <div className="dashboard-card card-purple">
                    <div className="card-header">
                        <FiBookOpen className="card-icon text-purple" />
                        <h3 className="text-purple">Learn/Revise</h3>
                    </div>
                    <p>Click here if you want to learn something new, or revise something that you have already learned</p>
                </div>

                <div className="dashboard-card card-yellow">
                    <div className="card-header">
                        <FiFileText className="card-icon text-yellow" />
                        <h3 className="text-yellow">Assignments and Contents</h3>
                    </div>
                    <p>Click here to get, submit, and/or review assignments or other contents that your teacher may have assigned to you</p>
                </div>

                <div className="dashboard-card card-orange">
                    <div className="card-header">
                        <FiUsers className="card-icon text-orange" />
                        <h3 className="text-orange">Socialise</h3>
                    </div>
                    <p>Click here to socialise with members of your community, including entering live video and text-chat sessions</p>
                </div>

                <div className="dashboard-card card-teal">
                    <div className="card-header">
                        <FiCheckSquare className="card-icon text-teal" />
                        <h3 className="text-teal">Test Yourself</h3>
                    </div>
                    <p>Click here to assess how good you are, and identify areas of weakness so that you can directly work on those areas</p>
                </div>
            </div>

            <div className="shadow-box">
                <div className="tab-headers">
                    {['Notice Board', "Today's Task", 'Upcoming Tasks'].map((tab) => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="tab-content">
                    <div className="empty-state">
                        <FiInbox className="empty-icon" />
                        <p className="empty-title">Currently, there are no notice from the school.</p>
                        <p className="empty-subtitle">Please check back later.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home