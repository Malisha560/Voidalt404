import React, { useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import AdmitCard from './pages/AdmitCard'
import './student.css'

function App() {
  const [activeTab, setActiveTab] = useState('Home')

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <Home />
      case 'Admit Card':
        return <AdmitCard />
      default:
        return (
          <div className="placeholder-page">
            <h2>{activeTab}</h2>
            <p>This section is under development.</p>
          </div>
        )
    }
  }

  return (
    <div className="app-layout">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="content-area">
        {renderContent()}
      </main>
    </div>
  )
}

export default App