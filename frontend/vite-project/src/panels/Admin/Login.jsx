import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../Driver/driver.css'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleLogin(e) {
    e.preventDefault()
    if (!username || !password) {
      setError('Enter Username and Password')
      return
    }
    localStorage.setItem('admin_auth', JSON.stringify({ username, t: Date.now() }))
    navigate('/admin/dashboard')
  }

  return (
    <div className="driverWrap">
      <div className="driverCard">
        <div className="cardHeader">
          <h2 className="cardTitle">Admin Login</h2>
          <p className="cardLead">Sign in to manage routes, buses and stops.</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="field">
            <label className="label">Username</label>
            <div className="inputRow">
              <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Enter your username" />
            </div>
          </div>
          <div className="field">
            <label className="label">Password</label>
            <div className="inputRow">
              <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password" />
            </div>
            <div className="hint">Use the credentials provided by the transport authority.</div>
          </div>
          {error && <div className="pill" style={{ borderColor: '#7a2a2a', background: '#2a1414' }}>{error}</div>}
          <div className="actions stretch" style={{ marginTop: '0.75rem' }}>
            <button className="btn lg" type="submit">Login</button>
          </div>
        </form>
      </div>
    </div>
  )
}


