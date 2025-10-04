import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './driver.css'
import { apiPost } from '../../utils/api'

export default function DriverLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    if (!username || !password) {
      setError('Enter username and password')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Login to get token
      const loginRes = await apiPost('/driver/login', { username, password })
      const token = loginRes.token
      
      // Get current location
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported')
      }
      
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })
      
      const { latitude, longitude } = position.coords
      
      // Send live location update
      await apiPost('/driver/live', {
        latitude,
        longitude,
        status: 'running'
      }, token)
      
      // Store token for future updates
      localStorage.setItem('driverToken', token)
      localStorage.setItem('driverData', JSON.stringify(loginRes.driver))
      
      alert('Login successful! Location updated.')
      navigate('/driver/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
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
            <label className="label">Username</label>
            <div className="inputRow">
              <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="e.g. driver1" />
            </div>
          </div>
          <div className="field">
            <label className="label">Password</label>
            <div className="inputRow">
              <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password" />
            </div>
            <div className="hint">Use the credentials provided by your operator.</div>
          </div>
          {error && <div className="pill" style={{ borderColor: '#7a2a2a', background: '#2a1414' }}>{error}</div>}
          <div className="actions stretch" style={{ marginTop: '0.75rem' }}>
            <button className="btn lg" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


