import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useMemo, useState, useEffect } from 'react'
import { apiGet, apiPost } from '../../utils/api'
import './admin.css'
// Backend-driven; remove static imports

export default function AdminDashboard() {
  const busIcon = useMemo(() => L.divIcon({ className: '', html: '🚌', iconSize: [24,24], iconAnchor: [12,12] }), [])
  const solapur = { lat: 17.6599, lng: 75.9064 }
  const [selectedBusId, setSelectedBusId] = useState('')
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [activeDriver, setActiveDriver] = useState(null)
  const [active, setActive] = useState([])
  const [showRouteManager, setShowRouteManager] = useState(false)
  const [tomorrowSchedule, setTomorrowSchedule] = useState({ routes: [] })
  const [availableResources, setAvailableResources] = useState({ buses: [], routes: [], drivers: [] })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await apiGet('/admin/active-buses')
        if (!cancelled) setActive(data || [])
      } catch (e) {
        if (!cancelled) setActive([])
      }
    }
    load()
    const t = setInterval(load, 5000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  // Load tomorrow's schedule and resources
  useEffect(() => {
    let cancelled = false
    async function loadSchedule() {
      try {
        const [schedule, resources] = await Promise.all([
          apiGet('/admin/tomorrow-schedule'),
          apiGet('/admin/available-resources')
        ])
        if (!cancelled) {
          console.log('=== ADMIN PANEL DEBUG ===')
          console.log('Loaded schedule:', schedule)
          console.log('Loaded resources:', resources)
          if (resources?.drivers) {
            console.log('Available drivers:')
            resources.drivers.forEach((driver, index) => {
              console.log(`Driver ${index}:`, driver)
              console.log(`  - driverId: ${driver.driverId} (type: ${typeof driver.driverId})`)
              console.log(`  - username: ${driver.username}`)
              console.log(`  - name: ${driver.name}`)
            })
          }
          setTomorrowSchedule(schedule || { routes: [] })
          setAvailableResources(resources || { buses: [], routes: [], drivers: [] })
        }
      } catch (e) {
        if (!cancelled) {
          setTomorrowSchedule({ routes: [] })
          setAvailableResources({ buses: [], routes: [], drivers: [] })
        }
      }
    }
    loadSchedule()
    return () => { cancelled = true }
  }, [])

  const rows = active.map(a => {
    // Find the driver assignment for this bus
    const assignment = tomorrowSchedule.routes?.find(r => r.busId === a.busId)
    const driver = assignment?.driver || null
    
    return { 
      id: a.busId, 
      shift: a.routeNumber || '-', 
      status: a.status || '-', 
      driver: driver ? {
        name: driver.name || 'Unknown',
        phone: driver.phone || 'Not provided',
        license: driver.license || 'Not provided',
        experienceYears: driver.experienceYears || 'Unknown',
        photoUrl: driver.photoUrl || ''
      } : {
        name: 'No driver assigned',
        phone: '-',
        license: '-',
        experienceYears: '-',
        photoUrl: ''
      }
    }
  })

  // Removed static stop map; using backend live data instead

  function FitToBounds({ points }) {
    const map = useMap()
    useEffect(() => {
      if (!points || points.length === 0) return
      const bounds = L.latLngBounds(points.map((p)=>[p.lat,p.lng]))
      map.fitBounds(bounds.pad(0.2))
    }, [points, map])
    return null
  }

  function RouteLine({ from, to }) {
    const [coords, setCoords] = useState(null)
    useEffect(() => {
      let cancelled = false
      async function fetchRoute() {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
          const res = await fetch(url)
          if (!res.ok) throw new Error('routing failed')
          const data = await res.json()
          const pts = data?.routes?.[0]?.geometry?.coordinates || []
          if (!cancelled && pts.length) setCoords(pts.map(([lng,lat])=>[lat,lng]))
          else if (!cancelled) setCoords([[from.lat,from.lng],[to.lat,to.lng]])
        } catch(e) {
          if (!cancelled) setCoords([[from.lat,from.lng],[to.lat,to.lng]])
        }
      }
      fetchRoute()
      return ()=>{cancelled=true}
    }, [from, to])
    if (!coords) return null
    return <Polyline positions={coords} pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.9 }} />
  }

  const addRouteAssignment = () => {
    const newRoute = {
      routeId: availableResources.routes[0]?.routeId || '',
      busId: availableResources.buses[0]?.busId || '',
      driverId: availableResources.drivers[0]?.driverId || '',
      startTime: '08:00',
      endTime: '18:00',
      isActive: true
    }
    setTomorrowSchedule(prev => ({
      ...prev,
      routes: [...prev.routes, newRoute]
    }))
  }

  const updateRouteAssignment = (index, field, value) => {
    setTomorrowSchedule(prev => ({
      ...prev,
      routes: prev.routes.map((route, i) => 
        i === index ? { ...route, [field]: value } : route
      )
    }))
  }

  const removeRouteAssignment = (index) => {
    setTomorrowSchedule(prev => ({
      ...prev,
      routes: prev.routes.filter((_, i) => i !== index)
    }))
  }

  const saveTomorrowSchedule = async () => {
    try {
      console.log('Saving schedule:', tomorrowSchedule.routes)
      await apiPost('/admin/tomorrow-schedule', { routes: tomorrowSchedule.routes })
      alert('Tomorrow\'s schedule updated successfully!')
      setShowRouteManager(false)
    } catch (e) {
      console.error('Failed to save schedule:', e)
      alert('Failed to update schedule')
    }
  }

  return (
    <div className="adminWrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="title">Dashboard</h2>
        <button 
          className="btn" 
          onClick={() => setShowRouteManager(true)}
          style={{ padding: '0.5rem 1rem' }}
        >
          Manage Tomorrow's Routes
        </button>
      </div>
      <div className="adminGrid">
        <div className="card">
          <h3 className="title">Live Map</h3>
          <div className="mapBox">
            <MapContainer style={{ height: '100%' }} center={[solapur.lat, solapur.lng]} zoom={13} scrollWheelZoom>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
              {active.map((a)=> (
                <Marker key={a.busId} position={[a.latitude, a.longitude]} icon={busIcon}>
                  <Popup>
                    <div>
                      <div>Bus #{a.busId}</div>
                      <div className="muted">{a.routeNumber || a.routeName || ''} • {a.status}{a.issue ? ` • ${a.issue.replaceAll('_',' ')}` : ''}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="title">Bus Information</h3>
          <table className="table">
            <thead>
              <tr>
                <th>BUS ID</th>
                <th>SHIFT</th>
                <th>STATUS</th>
                <th>MORE INFO</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r)=> (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.shift}</td>
                  <td>
                    <span className={`badge ${r.status==='running'?'ok':r.status==='delayed' || r.status==='delay'?'warn':''}`}>{r.status}</span>
                  </td>
                  <td>
                    <button
                      onClick={(e)=>{ e.preventDefault(); setActiveDriver({ busId: r.id, shift: r.shift, status: r.status, ...r.driver }); setIsDetailsOpen(true) }}
                      style={{ padding: '.4rem .7rem', borderRadius: 8, background: '#1f2937', color: '#eaeaea', border: '1px solid #2a2a2a', cursor: 'pointer' }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isDetailsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={()=>setIsDetailsOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
        >
          <div
            onClick={(e)=>e.stopPropagation()}
            style={{ width: 420, maxWidth: '90vw', background:'#121212', border:'1px solid #2a2a2a', borderRadius:12, padding:'1rem' }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: '.5rem' }}>
              <h3 className="title" style={{ margin: 0 }}>Driver Details</h3>
              <button onClick={()=>setIsDetailsOpen(false)} style={{ background:'transparent', color:'#eaeaea', border:'1px solid #2a2a2a', borderRadius:8, padding: '.25rem .5rem', cursor:'pointer' }}>Close</button>
            </div>
            {activeDriver ? (
              <div style={{ display:'grid', gap: '.75rem' }}>
                <div style={{ display:'flex', gap: '1rem', alignItems:'flex-start' }}>
                  <div style={{ width: 96, height: 120, border:'1px solid #2a2a2a', borderRadius: 8, overflow:'hidden', background:'#0f0f0f', flex:'0 0 auto' }}>
                    {activeDriver.photoUrl ? (
                      <img src={activeDriver.photoUrl} alt={`${activeDriver.name} photo`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    ) : (
                      <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:12 }}>No Photo</div>
                    )}
                  </div>
                  <div style={{ flex: 1, display:'grid', gap: '.5rem' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap: '.5rem' }}>
                      <div style={{ color:'#9ca3af' }}>Bus ID</div>
                      <div>{activeDriver.busId}</div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap: '.5rem' }}>
                      <div style={{ color:'#9ca3af' }}>Shift</div>
                      <div>{activeDriver.shift}</div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap: '.5rem' }}>
                      <div style={{ color:'#9ca3af' }}>Status</div>
                      <div>
                        <span className={`badge ${activeDriver.status==='running'?'ok':activeDriver.status==='delay' || activeDriver.status==='delayed'?'warn':''}`}>{activeDriver.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <hr style={{ borderColor:'#2a2a2a' }} />
                <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap: '.5rem' }}>
                  <div style={{ color:'#9ca3af' }}>Driver Name</div>
                  <div>{activeDriver.name}</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap: '.5rem' }}>
                  <div style={{ color:'#9ca3af' }}>Phone</div>
                  <div>{activeDriver.phone}</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap: '.5rem' }}>
                  <div style={{ color:'#9ca3af' }}>License</div>
                  <div>{activeDriver.license}</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap: '.5rem' }}>
                  <div style={{ color:'#9ca3af' }}>Experience</div>
                  <div>{activeDriver.experienceYears} years</div>
                </div>
              </div>
            ) : (
              <p>No driver selected.</p>
            )}
          </div>
        </div>
      )}
      {showRouteManager && (
        <div className="modalOverlay" onClick={() => setShowRouteManager(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Tomorrow's Route Schedule</h3>
              <button onClick={() => setShowRouteManager(false)} style={{ background: 'transparent', color: '#eaeaea', border: '1px solid #2a2a2a', borderRadius: 8, padding: '.25rem .5rem', cursor: 'pointer' }}>Close</button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <button className="btn" onClick={addRouteAssignment} style={{ marginBottom: '1rem' }}>
                Add Route Assignment
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {tomorrowSchedule.routes.map((route, index) => (
                <div key={index} style={{ border: '1px solid #2a2a2a', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Route</label>
                      <select 
                        value={route.routeId} 
                        onChange={(e) => updateRouteAssignment(index, 'routeId', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', background: '#1f2937', color: '#eaeaea', border: '1px solid #2a2a2a', borderRadius: 4 }}
                      >
                        {availableResources.routes.map(r => (
                          <option key={r.routeId} value={r.routeId}>{r.routeNumber} - {r.routeName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Bus</label>
                      <select 
                        value={route.busId} 
                        onChange={(e) => updateRouteAssignment(index, 'busId', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', background: '#1f2937', color: '#eaeaea', border: '1px solid #2a2a2a', borderRadius: 4 }}
                      >
                        {availableResources.buses.map(b => (
                          <option key={b.busId} value={b.busId}>{b.registrationNumber} - {b.model}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Driver</label>
                      <select 
                        value={route.driverId} 
                        onChange={(e) => updateRouteAssignment(index, 'driverId', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', background: '#1f2937', color: '#eaeaea', border: '1px solid #2a2a2a', borderRadius: 4 }}
                      >
                        {availableResources.drivers.map(d => (
                          <option key={d.driverId} value={d.driverId}>{d.name} ({d.username}) - ID: {d.driverId}</option>
                        ))}
                      </select>
                    </div>
                    
                    <button 
                      onClick={() => removeRouteAssignment(index)}
                      style={{ padding: '0.5rem', background: '#7a2a2a', color: '#eaeaea', border: '1px solid #2a2a2a', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Start Time</label>
                      <input 
                        type="time" 
                        value={route.startTime} 
                        onChange={(e) => updateRouteAssignment(index, 'startTime', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', background: '#1f2937', color: '#eaeaea', border: '1px solid #2a2a2a', borderRadius: 4 }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>End Time</label>
                      <input 
                        type="time" 
                        value={route.endTime} 
                        onChange={(e) => updateRouteAssignment(index, 'endTime', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', background: '#1f2937', color: '#eaeaea', border: '1px solid #2a2a2a', borderRadius: 4 }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'end' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="checkbox" 
                          checked={route.isActive} 
                          onChange={(e) => updateRouteAssignment(index, 'isActive', e.target.checked)}
                        />
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn" onClick={saveTomorrowSchedule}>
                Save Schedule
              </button>
              <button className="btn alt" onClick={() => setShowRouteManager(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


