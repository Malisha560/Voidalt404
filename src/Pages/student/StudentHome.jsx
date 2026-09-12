import { useOutletContext } from 'react-router-dom'

function StudentHome() {
  const { student } = useOutletContext()
  return <main className="portal-main home-page">
    <p className="welcome">Welcome <strong>{student?.name || 'Student'}</strong>, what would you like to do today?</p>
    <div className="action-grid">
      <button className="action-card learn"><strong>Learn/Revise</strong><span>Click here if you want to learn something new, or revise something that you have already learned</span></button>
      <button className="action-card assignments"><strong>Assignments and Contents</strong><span>Click here to get, submit and/or review assignments or other contents that your teacher may have assigned to you</span></button>
      <button className="action-card social"><strong>Socialise</strong><span>Click here to socialise with members of your community, including entering live video and text-chat sessions</span></button>
      <button className="action-card tests"><strong>Test Yourself</strong><span>Click here to assess how good you are, and identify areas of weakness so that you can directly work on those areas</span></button>
    </div>
    <div className="notice-board"><div className="tabs"><b>Notice Board</b><span>Today's Task</span><span>Upcoming Tasks</span></div><div className="empty-notice"><div>♧</div><p>Currently, there isn't any notice from the school.<br />Notices or consent forms sent by the schools are seen here.</p></div></div>
  </main>
}

export default StudentHome
