import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:5001/api', timeout: 1800 })

export const loginUser = (credentials) => api.post('/auth/login', credentials).then(({ data }) => data)
export const fetchAdminStudents = (params = {}) => {
  const session = JSON.parse(localStorage.getItem('auth_session') || 'null')
  return api.get('/admin/students', { params, headers: { Authorization: `Bearer ${session?.token || ''}` } }).then(({ data }) => data.students)
}
export const updateStudentFeeStatus = (studentId, status) => {
  const session = JSON.parse(localStorage.getItem('auth_session') || 'null')
  return api.patch(`/admin/students/${studentId}/fee-status`, { status }, { headers: { Authorization: `Bearer ${session?.token || ''}` } }).then(({ data }) => data)
}
export const updateStudentProfileImage = (studentId, profileImage) => {
  const session = JSON.parse(localStorage.getItem('auth_session') || 'null')
  return api.patch(`/admin/students/${studentId}/profile-image`, { profileImage }, { headers: { Authorization: `Bearer ${session?.token || ''}` } }).then(({ data }) => data)
}
const staffHeaders = () => {
  const session = JSON.parse(localStorage.getItem('auth_session') || 'null')
  return { Authorization: `Bearer ${session?.token || ''}` }
}
export const fetchAdminDashboard = () => api.get('/admin/dashboard', { headers: staffHeaders() }).then(({ data }) => data)
export const fetchAdminExams = () => api.get('/admin/exams', { headers: staffHeaders() }).then(({ data }) => data.exams)
export const createAdminExam = (exam) => api.post('/admin/exams', exam, { headers: staffHeaders() }).then(({ data }) => data)
export const updateAdminExamProgramme = (examId, programme) => api.patch(`/admin/exams/${examId}/programme`, { programme }, { headers: staffHeaders() }).then(({ data }) => data)
export const fetchExamAllocations = (examId) => api.get(`/admin/exams/${examId}/allocations`, { headers: staffHeaders() }).then(({ data }) => data.allocations)
export const saveExamAllocation = (examId, allocation) => api.post(`/admin/exams/${examId}/allocations`, allocation, { headers: staffHeaders() }).then(({ data }) => data)
export const allocateExamProgramme = (examId, allocation) => api.post(`/admin/exams/${examId}/programme-allocation`, allocation, { headers: staffHeaders() }).then(({ data }) => data)
export const fetchInvigilatorStudents = () => {
  const session = JSON.parse(localStorage.getItem('auth_session') || 'null')
  return api.get('/invigilator/students', { headers: { Authorization: `Bearer ${session?.token || ''}` } }).then(({ data }) => data.students)
}
export const fetchInvigilatorDashboard = () => api.get('/invigilator/dashboard', { headers: staffHeaders() }).then(({ data }) => data)
export const fetchInvigilatorStudent = (studentId) => {
  const session = JSON.parse(localStorage.getItem('auth_session') || 'null')
  return api.get(`/invigilator/students/${studentId}`, { headers: { Authorization: `Bearer ${session?.token || ''}` } }).then(({ data }) => ({ ...data.student, exams: data.exams || [] }))
}
export const updateInvigilatorAttendance = (studentId, examId, status, method = 'MANUAL') => {
  const session = JSON.parse(localStorage.getItem('auth_session') || 'null')
  return api.post('/invigilator/attendance', { studentId, examId, status, method }, { headers: { Authorization: `Bearer ${session?.token || ''}` } }).then(({ data }) => data)
}
export const fetchInvigilatorAttendance = () => {
  const session = JSON.parse(localStorage.getItem('auth_session') || 'null')
  return api.get('/invigilator/attendance', { headers: { Authorization: `Bearer ${session?.token || ''}` } }).then(({ data }) => data.records)
}
export const updateAttendance = updateInvigilatorAttendance
export const fetchAttendance = fetchInvigilatorAttendance

export const fetchStudentProfile = (studentId = 'ST001') => api.get('/student/profile', { params: { studentId } }).then(({ data }) => data.student)
export const fetchAdmitCards = (studentId = 'ST001') => api.get('/student/admit-cards', { params: { studentId } }).then(({ data }) => data)
export const fetchExamAdmitCard = (examId, studentId = 'ST001') => api.get(`/student/exams/${examId}/admit-card`, { params: { studentId } }).then(({ data }) => data)
export const fetchExamQr = (examId, studentId = 'ST001') => api.get(`/student/exams/${examId}/qr`, { params: { studentId } }).then(({ data }) => data).catch((error) => {
  if (error.response?.data?.available === false) return error.response.data
  throw error
})

export const scanQrToken = (token) => {
  const session = JSON.parse(localStorage.getItem('auth_session') || 'null')
  return api.post('/invigilator/scan', { token }, { headers: { Authorization: `Bearer ${session?.token || ''}` } }).then(({ data }) => data)
}
