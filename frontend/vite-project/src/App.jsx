import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import './App.css'
import UserPanel from './panels/User/UserPanel.jsx'
import Landing from './pages/Landing.jsx'
import DriverLogin from './panels/Driver/Login.jsx'
import DriverDashboard from './panels/Driver/Dashboard.jsx'
import AdminLogin from './panels/Admin/Login.jsx'
import AdminDashboard from './panels/Admin/Dashboard.jsx'

function Placeholder({ title }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>{title}</h2>
      <p>Coming soon.</p>
    </div>
  )
}

function App() {
  const location = useLocation()

  return (
    <div>
      <Routes location={location}>
        <Route path="/" element={<Landing />} />
        <Route path="/user" element={<UserPanel />} />
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<div style={{ padding: '2rem' }}><h2>Not Found</h2><Link to="/">Go to Landing</Link></div>} />
      </Routes>
    </div>
  )
}

export default App
