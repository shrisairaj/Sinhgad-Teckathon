import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import './App.css'
import Nav from './components/Nav.jsx'
import UserPanel from './panels/User/UserPanel.jsx'

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
      <Nav />
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/user" replace />} />
        <Route path="/user" element={<UserPanel />} />
        <Route path="/driver" element={<Placeholder title="Driver Panel" />} />
        <Route path="/admin" element={<Placeholder title="Admin Panel" />} />
        <Route path="*" element={<div style={{ padding: '2rem' }}><h2>Not Found</h2><Link to="/user">Go to User Panel</Link></div>} />
      </Routes>
    </div>
  )
}

export default App
