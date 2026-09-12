import Navbar from '../components/common/Navbar'
import { Outlet } from 'react-router-dom'

function InvigilatorLayout() {
  return <><Navbar role="invigilator" /><Outlet /></>
}

export default InvigilatorLayout
