import axios from 'axios'

export const MOCK_FEE_STATUS = 'CLEAR'
const api = axios.create({ baseURL: 'http://localhost:5001/api', timeout: 1800 })

const student = { name: 'Ram Sharma', studentId: 'ST001', course: 'BSc Computer Science' }
const mockExams = [
  { id: 'database-systems', subject: 'Database Systems', dateLabel: '20 September 2026', startLabel: '10:00 AM', endLabel: '12:00 PM', startTime: '2026-09-20T10:00:00+05:45', building: 'Block A', room: 'A204', seat: 'A204-01', student },
  { id: 'web-development', subject: 'Web Development', dateLabel: '23 September 2026', startLabel: '10:00 AM', endLabel: '12:00 PM', startTime: '2026-09-23T10:00:00+05:45', building: 'Block B', room: 'B102', seat: 'B102-14', student },
  { id: 'artificial-intelligence', subject: 'Artificial Intelligence', dateLabel: '26 September 2026', startLabel: '2:00 PM', endLabel: '4:00 PM', startTime: '2026-09-26T14:00:00+05:45', building: 'Block A', room: 'A206', seat: 'A206-08', student },
]

const withMockFallback = (request, fallback) => request.catch(() => fallback)
export const fetchAdmitCards = (feeStatus = MOCK_FEE_STATUS) => withMockFallback(api.get('/student/admit-cards', { params: { feeStatus } }).then(({ data }) => data.exams), feeStatus === 'CLEAR' ? mockExams : [])
export const fetchExamAdmitCard = (examId, feeStatus = MOCK_FEE_STATUS) => withMockFallback(api.get(`/student/exams/${examId}/admit-card`, { params: { feeStatus } }).then(({ data }) => data), { ...mockExams.find((exam) => exam.id === examId) || mockExams[0], feeStatus })
export const fetchExamQr = (examId) => withMockFallback(api.get(`/student/exams/${examId}/qr`).then(({ data }) => data), { available: false, availableAt: '8:00 AM' })
