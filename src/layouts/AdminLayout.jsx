import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'

function AdminLayout() {
  return <><Navbar role="admin" /><Outlet /></>
}

export default AdminLayout
