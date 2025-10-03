import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './driver.css'
import { BUS_STOPS } from '../../data/busStops'

export default function DriverDashboard() {
  const navigate = useNavigate()
  const auth = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('driver_auth')||'null') } catch { return null }
  }, [])
  useEffect(()=>{ if(!auth) navigate('/driver/login') },[auth,navigate])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [emergency, setEmergency] = useState(false)
  const [ended, setEnded] = useState(false)
  const [toast, setToast] = useState('')
  const [confirmEnd, setConfirmEnd] = useState(false)

  const stops = BUS_STOPS

  function markStopReached() {
    const reached = stops[currentIndex]
    // Keep track of reached stops
    const log = JSON.parse(localStorage.getItem('driver_reached')||'[]')
    log.push({ stopId: reached.id, name: reached.name, at: Date.now() })
    localStorage.setItem('driver_reached', JSON.stringify(log))
    if (currentIndex + 1 < stops.length) {
      setCurrentIndex(currentIndex + 1)
      setToast(`Marked reached: ${reached.name}`)
      setTimeout(()=>setToast(''), 1500)
    } else {
      setEnded(true)
      setToast('Trip completed')
      setTimeout(()=>setToast(''), 1500)
    }
  }

  function toggleEmergency() {
    setEmergency((v)=>!v)
  }

  function endTrip() {
    setConfirmEnd(true)
  }

  function confirmEndTrip() {
    setEnded(true)
    setConfirmEnd(false)
    setToast('Trip ended')
    setTimeout(()=>setToast(''), 1500)
  }

  function logout() {
    localStorage.removeItem('driver_auth')
    navigate('/driver/login')
  }

  return (
    <div className="driverWrap">
      <div className="driverCard">
        <div className="titleRow">
          <h2 style={{ marginTop: 0 }}>Driver Dashboard</h2>
          <button className="btn alt" onClick={logout}>Logout</button>
        </div>
        <p className="subtitle">Manage your active trip and update stop status.</p>
        <div className="grid2">
          <div className="pill">Bus: {auth?.busId || '-'}</div>
          <div className={`badge ${emergency ? 'alert' : 'ok'}`}>{emergency ? 'Emergency active' : 'Normal'}</div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <div className="pill">Current stop: {stops[currentIndex]?.name}</div>
        </div>
        <div className="progress" style={{ marginTop: '.6rem' }}>
          <div className="progressBar" style={{ width: `${(currentIndex/(stops.length-1))*100}%` }} />
        </div>
        <div className="actions" style={{ marginTop: '0.75rem' }}>
          <button className="btn" onClick={markStopReached} disabled={ended}>Stop reached</button>
          <button className="btn danger" onClick={toggleEmergency}>{emergency ? 'Clear emergency' : 'Emergency'}</button>
          <button className="btn alt" onClick={endTrip} disabled={!(currentIndex === stops.length - 1) || ended}>End trip</button>
        </div>
        <div className="stopList">
          {stops.map((s, idx) => (
            <div key={s.id} className={`stopItem ${idx < currentIndex ? 'done' : ''}`}>
              <div>{s.name}</div>
              <div className="pill">{idx < currentIndex ? 'Reached' : idx===currentIndex ? 'Next' : 'Pending'}</div>
            </div>
          ))}
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
      {confirmEnd && (
        <div className="modalOverlay">
          <div className="modalCard">
            <h3 style={{marginTop:0}}>End trip?</h3>
            <p className="subtitle">This will mark the trip as completed.</p>
            <div className="modalActions">
              <button className="btn alt" onClick={()=>setConfirmEnd(false)}>Cancel</button>
              <button className="btn" onClick={confirmEndTrip}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


