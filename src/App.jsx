import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Footer from './components/common/Footer'
import AdminLayout from './layouts/AdminLayout'
import InvigilatorLayout from './layouts/InvigilatorLayout'
import StudentLayout from './layouts/StudentLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import Attendance from './pages/admin/Attendance'
import Exams from './pages/admin/Exams'
import Fees from './pages/admin/Fees'
import Students from './pages/admin/Students'
import InvigilatorAttendance from './pages/invigilator/Attendance'
import InvigilatorDashboard from './pages/invigilator/Dashboard'
import Verification from './pages/invigilator/Verification'
import ScanQR from './pages/invigilator/ScanQR'
import SearchStudent from './pages/invigilator/SearchStudent'
import AdmitCard from './pages/student/AdmitCard'
import StudentHome from './pages/student/StudentHome'
import AdminLogin from './pages/AdminLogin'
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
      <Route index element={<Navigate to="student-info" replace />} />
      <Route path="student-info" element={<Students />} />
      <Route path="exams" element={<Exams />} />
      <Route path="attendance-log" element={<Attendance />} />
      <Route path="fees" element={<Fees />} />
      <Route path="dashboard" element={<AdminDashboard />} />
    </Route>

    <Route path="/invigilator" element={<ProtectedRoute role="INVIGILATOR"><InvigilatorLayout /></ProtectedRoute>}>
      <Route index element={<InvigilatorDashboard />} />
      <Route path="search" element={<SearchStudent />} />
      <Route path="scan" element={<ScanQR />} />
      <Route path="verification/:id" element={<Verification />} />
      <Route path="attendance" element={<InvigilatorAttendance />} />
    </Route>

    <Route path="*" element={<Navigate to="/student" replace />} />
  </Routes>
  <Footer />
</BrowserRouter>
}


export default App
