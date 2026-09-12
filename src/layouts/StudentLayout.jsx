import Navbar from '../components/common/Navbar'
import { useEffect, useState } from 'react'
import { Outlet, useSearchParams } from 'react-router-dom'
import { fetchStudentProfile } from '../services/api'

function StudentLayout() {
  const [searchParams] = useSearchParams()
  const [student, setStudent] = useState(null)
  const studentId = searchParams.get('studentId') || localStorage.getItem('student_id') || 'ST001'

  useEffect(() => {
    localStorage.setItem('student_id', studentId)
    fetchStudentProfile(studentId).then(setStudent).catch(() => setStudent(null))
  }, [studentId])

  return <><Navbar role="student" student={student} studentId={studentId} /><Outlet context={{ student, studentId }} /></>
}

export default StudentLayout
