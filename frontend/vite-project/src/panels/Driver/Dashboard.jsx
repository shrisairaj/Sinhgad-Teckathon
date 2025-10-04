import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './driver.css'
import { apiPost, apiGet } from '../../utils/api'

export default function DriverDashboard() {
  const navigate = useNavigate()
  const auth = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('driverData')||'null') } catch { return null }
  }, [])
  const token = useMemo(() => localStorage.getItem('driverToken'), [])
  
  useEffect(()=>{ if(!auth || !token) navigate('/driver/login') },[auth, token, navigate])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [emergency, setEmergency] = useState(false)
  const [ended, setEnded] = useState(false)
  const [toast, setToast] = useState('')
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [location, setLocation] = useState(null)
  const [assignedRoute, setAssignedRoute] = useState(null)
  const [stops, setStops] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  // Load driver's assigned route and stops
  const loadDriverRoute = async () => {
    if (!auth) {
      console.log('No auth data available')
      return
    }
    
    setRefreshing(true)
    console.log('=== DRIVER ROUTE LOADING DEBUG ===')
    console.log('Full auth object:', auth)
    console.log('Auth keys:', Object.keys(auth))
    console.log('Auth.driverId:', auth.driverId)
    console.log('Auth.username:', auth.username)
    console.log('Auth.id:', auth.id)
    
    try {
      // Get tomorrow's schedule to find this driver's assignment
      const schedule = await apiGet('/admin/tomorrow-schedule')
      console.log('=== SCHEDULE DEBUG ===')
      console.log('Full schedule:', schedule)
      console.log('Schedule routes:', schedule.routes)
      
      if (schedule.routes && schedule.routes.length > 0) {
        console.log('Available assignments:')
        schedule.routes.forEach((route, index) => {
          console.log(`Route ${index}:`, route)
          console.log(`  - driverId: ${route.driverId} (type: ${typeof route.driverId})`)
          console.log(`  - routeId: ${route.routeId}`)
          console.log(`  - busId: ${route.busId}`)
        })
      }
      
      // Try multiple matching strategies
      let driverAssignment = null
      
      // Strategy 1: Match by driverId (number)
      if (auth.driverId) {
        driverAssignment = schedule.routes?.find(r => r.driverId == auth.driverId)
        console.log('Strategy 1 (driverId match):', driverAssignment)
      }
      
      // Strategy 2: Match by driverId (string)
      if (!driverAssignment && auth.driverId) {
        driverAssignment = schedule.routes?.find(r => String(r.driverId) === String(auth.driverId))
        console.log('Strategy 2 (driverId string match):', driverAssignment)
      }
      
      // Strategy 3: Match by username
      if (!driverAssignment && auth.username) {
        driverAssignment = schedule.routes?.find(r => r.driverId == auth.username)
        console.log('Strategy 3 (username match):', driverAssignment)
      }
      
      // Strategy 4: Match by busId (fallback)
      if (!driverAssignment && auth.busId) {
        driverAssignment = schedule.routes?.find(r => r.busId == auth.busId)
        console.log('Strategy 4 (busId match):', driverAssignment)
      }
      
      console.log('Final assignment found:', driverAssignment)
      
      if (driverAssignment) {
        // Get route details
        const routesData = await apiGet('/admin/available-resources')
        console.log('Available routes:', routesData.routes)
        
        const routeDetails = routesData.routes?.find(r => r.routeId === driverAssignment.routeId)
        console.log('Route details found:', routeDetails)
        
        if (routeDetails) {
          console.log('Setting assigned route:', routeDetails)
          setAssignedRoute(routeDetails)
          
          // Get stops for this route
          const stopsData = await apiGet('/user/stops')
          const routeStops = routeDetails.stops || []
          const routeStopData = routeStops.map(stopId => 
            stopsData.find(s => s.stopId === stopId)
          ).filter(Boolean)
          
          console.log('Stops loaded:', routeStopData)
          setStops(routeStopData)
        } else {
          console.log('No route details found, clearing assigned route')
          // Clear assigned route if no details found
          setAssignedRoute(null)
          // Fallback to default stops if no route details found
          const stopsData = await apiGet('/user/stops')
          setStops(stopsData || [])
        }
      } else {
        console.log('No assignment found - clearing state')
        // No assignment found - clear everything
        setAssignedRoute(null)
        setStops([])
        setCurrentIndex(0)
        setEnded(false)
      }
    } catch (e) {
      console.warn('Failed to load driver route:', e)
      // Fallback to default stops
      try {
        const stopsData = await apiGet('/user/stops')
        setStops(stopsData || [])
      } catch (e2) {
        setStops([])
      }
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDriverRoute()
    
    // Refresh route assignment every 30 seconds to pick up admin changes
    const interval = setInterval(loadDriverRoute, 30000)
    
    return () => clearInterval(interval)
  }, [auth])

  const debugAssignment = async () => {
    try {
      const debugData = await apiGet(`/admin/debug-assignment/${auth.driverId}`)
      console.log('=== DEBUG ASSIGNMENT DATA ===')
      console.log('Debug response:', debugData)
      alert(`Debug data logged to console. Assignment found: ${debugData.assignment ? 'YES' : 'NO'}`)
    } catch (e) {
      console.error('Debug failed:', e)
      alert('Debug failed - check console')
    }
  }

  // Update location periodically
  useEffect(() => {
    if (!token) return
    
    const updateLocation = async () => {
      try {
        if (navigator.geolocation) {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 10000
            })
          })
          
          const { latitude, longitude } = position.coords
          setLocation({ latitude, longitude })
          
          // Send to backend
          await apiPost('/driver/live', {
            latitude,
            longitude,
            status: ended ? 'trip_ended' : emergency ? 'delay' : 'running'
          }, token)
        }
      } catch (err) {
        console.warn('Location update failed:', err)
      }
    }
    
    // Update immediately
    updateLocation()
    
    // Then every 30 seconds
    const interval = setInterval(updateLocation, 30000)
    return () => clearInterval(interval)
  }, [token, ended, emergency])

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

  const [showEmergency, setShowEmergency] = useState(false)
  async function raiseEmergency(issue) {
    try {
      await apiPost('/driver/emergency', { issue, latitude: location?.latitude, longitude: location?.longitude }, token)
      setEmergency(true)
      setToast('Emergency reported')
      setTimeout(()=>setToast(''), 1500)
      setShowEmergency(false)
    } catch (e) {
      setToast('Failed to report emergency')
      setTimeout(()=>setToast(''), 1500)
    }
  }

  function endTrip() {
    setConfirmEnd(true)
  }

  async function confirmEndTrip() {
    try {
      // Clear the driver's assignment from the database
      await apiPost('/driver/end-trip', {}, token)
      
      setEnded(true)
      setConfirmEnd(false)
      setToast('Trip ended - Assignment cleared')
      setTimeout(()=>setToast(''), 1500)
      
      // Clear the assigned route and stops
      setAssignedRoute(null)
      setStops([])
      setCurrentIndex(0)
    } catch (e) {
      console.error('Failed to end trip:', e)
      setToast('Failed to end trip')
      setTimeout(()=>setToast(''), 1500)
    }
  }

  function logout() {
    localStorage.removeItem('driverToken')
    localStorage.removeItem('driverData')
    navigate('/driver/login')
  }

  return (
    <div className="driverWrap">
      <div className="driverCard">
        <div className="titleRow">
          <h2 style={{ marginTop: 0 }}>Driver Dashboard</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn" onClick={loadDriverRoute} disabled={refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh Assignment'}
            </button>
            <button className="btn alt" onClick={logout}>Logout</button>
          </div>
        </div>
        <p className="subtitle">Manage your active trip and update stop status.</p>
        <div className="grid2">
          <div className="pill">Bus: {auth?.busId || '-'}</div>
          <div className={`badge ${emergency ? 'alert' : 'ok'}`}>{emergency ? 'Emergency active' : 'Normal'}</div>
        </div>
        {assignedRoute && (
          <div className="pill" style={{ marginTop: '0.5rem' }}>
            Assigned Route: {assignedRoute.routeNumber} - {assignedRoute.routeName}
          </div>
        )}
        {location && (
          <div className="pill" style={{ marginTop: '0.5rem' }}>
            Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </div>
        )}
        <div style={{ marginTop: '0.75rem' }}>
          <div className="pill">
            Current stop: {stops[currentIndex]?.name || 'No route assigned'}
          </div>
        </div>
        <div className="progress" style={{ marginTop: '.6rem' }}>
          <div className="progressBar" style={{ width: `${stops.length > 1 ? (currentIndex/(stops.length-1))*100 : 0}%` }} />
        </div>
        <div className="actions" style={{ marginTop: '0.75rem' }}>
          <button className="btn" onClick={markStopReached} disabled={ended || stops.length === 0}>Stop reached</button>
          <button className="btn danger" onClick={()=>setShowEmergency(true)} disabled={stops.length === 0}>Emergency</button>
          <button className="btn alt" onClick={endTrip} disabled={!(currentIndex === stops.length - 1) || ended || stops.length === 0}>End trip</button>
        </div>
        <div className="stopList">
          {stops.length > 0 ? stops.map((s, idx) => (
            <div key={s.stopId || s.id} className={`stopItem ${idx < currentIndex ? 'done' : ''}`}>
              <div>{s.name}</div>
              <div className="pill">{idx < currentIndex ? 'Reached' : idx===currentIndex ? 'Next' : 'Pending'}</div>
            </div>
          )) : (
            <div className="pill" style={{ borderColor: '#f59e0b', background: '#2a1f0f', color: '#fbbf24' }}>
              ⏳ No route assigned. Please wait for admin to assign a route.
            </div>
          )}
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
      {showEmergency && (
        <div className="modalOverlay" onClick={()=>setShowEmergency(false)}>
          <div className="modalCard" onClick={(e)=>e.stopPropagation()}>
            <h3 style={{marginTop:0}}>Report an issue</h3>
            <p className="subtitle">Choose an issue type and contact helpline if needed.</p>
            <div className="actions" style={{ flexWrap:'wrap', gap: '.5rem' }}>
              <button className="btn" onClick={()=>raiseEmergency('bus_problem')}>Bus problem</button>
              <button className="btn" onClick={()=>raiseEmergency('driver_health_issue')}>Driver health issue</button>
              <button className="btn" onClick={()=>raiseEmergency('other_issue')}>Other issue</button>
            </div>
            <div className="pill" style={{ marginTop: '.75rem' }}>Helpline: +91-99999-99999</div>
            <div className="modalActions">
              <button className="btn alt" onClick={()=>setShowEmergency(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
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


