import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import InvigilatorLayout from './layouts/InvigilatorLayout'
import StudentLayout from './layouts/StudentLayout'
import AdminDashboard from './Pages/admin/AdminDashboard'
import Attendance from './Pages/admin/Attendance'
import Exams from './Pages/admin/Exams'
import Fees from './Pages/admin/Fees'
import Students from './Pages/admin/Students'
import InvigilatorAttendance from './Pages/invigilator/Attendance'
import Verification from './Pages/invigilator/Verification'
import ScanQR from './Pages/invigilator/ScanQR'
import SearchStudent from './Pages/invigilator/SearchStudent'
import InvigilatorDashboard from './Pages/invigilator/Dashboard'
import AdmitCard from './Pages/student/AdmitCard'
import StudentHome from './Pages/student/StudentHome'
import AdminLogin from './Pages/AdminLogin'
import ProtectedRoute from './components/common/ProtectedRoute'
import './App.css'

function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<Navigate to="/student" replace />} />
    <Route path="/login" element={<AdminLogin />} />

    <Route path="/student" element={<StudentLayout />}>
      <Route index element={<StudentHome />} />
      <Route path="admit-card" element={<AdmitCard />} />
      <Route path="admit-card/:examId" element={<AdmitCard />} />
    </Route>

    <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="student-info" element={<Students />} />
      <Route path="exams" element={<Exams />} />
      <Route path="attendance-log" element={<Attendance />} />
      <Route path="fees" element={<Fees />} />
      <Route path="dashboard" element={<AdminDashboard />} />
    </Route>

    <Route path="/invigilator" element={<ProtectedRoute role="INVIGILATOR"><InvigilatorLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<InvigilatorDashboard />} />
      <Route path="student-info" element={<SearchStudent />} />
      <Route path="scan" element={<ScanQR />} />
      <Route path="verification/:id" element={<Verification />} />
      <Route path="attendance-log" element={<InvigilatorAttendance />} />
    </Route>

    <Route path="*" element={<Navigate to="/student" replace />} />
  </Routes></BrowserRouter>
}

export default App
