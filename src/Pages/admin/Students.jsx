import { useEffect, useState } from 'react'
import { fetchAdminStudents, updateStudentFeeStatus, updateStudentProfileImage } from '../../services/api'
import './Students.css'

function Students() {
  const [students, setStudents] = useState([])
  const [course, setCourse] = useState('')
  const [level, setLevel] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingStudentId, setSavingStudentId] = useState(null)
  const [savingImageId, setSavingImageId] = useState(null)

  useEffect(() => {
    fetchAdminStudents()
      .then(setStudents)
      .catch(() => setError('Unable to load student information.'))
      .finally(() => setLoading(false))
  }, [])

  const courses = [...new Set(students.map((student) => student.course).filter(Boolean))]
  const levels = [...new Set(students.map((student) => student.year).filter(Boolean))]
  const filteredStudents = students.filter((student) => {
    const matchesCourse = !course || student.course === course
    const matchesLevel = !level || String(student.year) === level
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [student.name, student.email, student.studentId, student.phoneNumber].some((value) => String(value || '').toLowerCase().includes(query))
    return matchesCourse && matchesLevel && matchesSearch
  })

  const handleFeeStatusChange = async (studentId, status) => {
    const previousStatus = students.find((student) => student.id === studentId)?.feeStatus
    setSavingStudentId(studentId)
    setError('')
    setStudents((current) => current.map((student) => student.id === studentId ? { ...student, feeStatus: status } : student))
    try {
      await updateStudentFeeStatus(studentId, status)
    } catch {
      setStudents((current) => current.map((student) => student.id === studentId ? { ...student, feeStatus: previousStatus } : student))
      setError('Unable to update fee status. Please try again.')
    } finally {
      setSavingStudentId(null)
    }
  }

  const handleImageChange = async (studentId, file) => {
    if (!file) return
    setSavingImageId(studentId)
    setError('')
    try {
      const profileImage = await resizeImage(file)
      await updateStudentProfileImage(studentId, profileImage)
      setStudents((current) => current.map((student) => student.id === studentId ? { ...student, profileImage } : student))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save profile image.')
    } finally {
      setSavingImageId(null)
    }
  }

  return <main className="admin-students-page">
    <div className="student-filters">
      <select value={course} onChange={(event) => setCourse(event.target.value)} aria-label="Filter by course">
        <option value="">Course</option>
        {courses.map((item) => <option value={item} key={item}>{item}</option>)}
      </select>
      <select value={level} onChange={(event) => setLevel(event.target.value)} aria-label="Filter by level">
        <option value="">Level</option>
        {levels.map((item) => <option value={item} key={item}>{item}</option>)}
      </select>
      <label className="student-search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Student Name" aria-label="Search students" /><span aria-hidden="true">⌕</span></label>
    </div>

    {error && <p className="admin-table-error">{error}</p>}
    <div className="student-table-wrap">
      <table className="student-table">
        <thead><tr><th>S. No</th><th>Name</th><th>College ID</th><th>Contact</th><th>Fee Due</th></tr></thead>
        <tbody>
          {loading && <tr><td className="table-message" colSpan="5">Loading student information...</td></tr>}
          {!loading && !error && filteredStudents.map((student, index) => <tr key={student.id}>
            <td>{index + 1}.</td><td><div className="student-name-cell">{student.profileImage ? <img src={student.profileImage} alt="" /> : <span className="student-avatar-fallback">{student.name.slice(0, 1)}</span>}<span>{student.name}</span><label className="image-upload-button">{savingImageId === student.id ? 'Saving...' : 'Upload photo'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={savingImageId === student.id} onChange={(event) => handleImageChange(student.id, event.target.files?.[0])} /></label></div></td><td>{student.email}</td><td>{student.phoneNumber}</td>
            <td><label className={`fee-status-select ${student.feeStatus.toLowerCase()} ${savingStudentId === student.id ? 'saving' : ''}`}>
              <select value={student.feeStatus} onChange={(event) => handleFeeStatusChange(student.id, event.target.value)} disabled={savingStudentId === student.id} aria-label={`Fee status for ${student.name}`}>
                <option value="CLEAR">Clear</option>
                <option value="UNCLEAR">Unclear</option>
              </select>
              <span aria-hidden="true">⌄</span>
            </label></td>
          </tr>)}
          {!loading && !error && filteredStudents.length === 0 && <tr><td className="table-message" colSpan="5">No students found in the database.</td></tr>}
        </tbody>
      </table>
    </div>
  </main>
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        let scale = Math.min(1, 420 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        let output
        do {
          canvas.width = Math.round(image.width * scale)
          canvas.height = Math.round(image.height * scale)
          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          output = canvas.toDataURL('image/jpeg', 0.62)
          scale *= 0.8
        } while (output.length > 700000 && scale > 0.15)
        resolve(output)
      }
      image.onerror = reject
      image.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default Students
