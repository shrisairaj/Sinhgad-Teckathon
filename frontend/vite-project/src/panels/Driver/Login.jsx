import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './driver.css'

export default function DriverLogin() {
  const [busId, setBusId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleLogin(e) {
    e.preventDefault()
    if (!busId || !password) {
      setError('Enter Bus ID and Password')
      return
    }
    // Mock auth; store a simple token
    localStorage.setItem('driver_auth', JSON.stringify({ busId, t: Date.now() }))
    navigate('/driver/dashboard')
  }

  return (
    <div className="driverWrap">
      <div className="driverCard">
        <div className="cardHeader">
          <h2 className="cardTitle">Driver Login</h2>
          <p className="cardLead">Sign in with your assigned Bus ID to manage trips.</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="field">
            <label className="label">Bus ID</label>
            <div className="inputRow">
              <input className="input" value={busId} onChange={(e)=>setBusId(e.target.value)} placeholder="e.g. bus-101" />
            </div>
          </div>
          <div className="field">
            <label className="label">Password</label>
            <div className="inputRow">
              <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password" />
              <button type="button" className="inputIconBtn" onClick={()=>{
                const el = document.querySelector('#driver_password')
              }} style={{ display:'none' }}>Show</button>
            </div>
            <div className="hint">Use the credentials provided by your operator.</div>
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


