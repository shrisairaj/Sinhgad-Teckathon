import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useMemo, useState, useEffect } from 'react'
import './admin.css'
import { BUSES } from '../../data/buses'
import { BUS_STOPS } from '../../data/busStops'

export default function AdminDashboard() {
  const busIcon = useMemo(() => L.divIcon({ className: '', html: '🚌', iconSize: [24,24], iconAnchor: [12,12] }), [])
  const stopIcon = useMemo(() => L.divIcon({ className: '', html: '📍', iconSize: [24,24], iconAnchor: [12,12] }), [])
  const solapur = { lat: 17.6599, lng: 75.9064 }
  const [selectedBusId, setSelectedBusId] = useState('')
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [activeDriver, setActiveDriver] = useState(null)

  const rows = [
    { id: 'SOL-001', shift: 'Morning', status: 'On Time', driver: { name: 'Ravi Patil', phone: '+91 98765 43210', license: 'MH-12-2025-091', experienceYears: 6, photoUrl: 'https://randomuser.me/api/portraits/men/31.jpg' } },
    { id: 'SOL-002', shift: 'Afternoon', status: 'Delayed', driver: { name: 'Sunita Kale', phone: '+91 98220 11122', license: 'MH-13-2023-442', experienceYears: 4, photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg' } },
    { id: 'PUN-078', shift: 'Evening', status: 'On Time', driver: { name: 'Imran Shaikh', phone: '+91 90040 55566', license: 'MH-14-2021-778', experienceYears: 8, photoUrl: 'https://randomuser.me/api/portraits/men/12.jpg' } },
    { id: 'MUM-105', shift: 'Night', status: 'End of Service', driver: { name: 'Kiran Jadhav', phone: '+91 99220 33344', license: 'MH-01-2019-221', experienceYears: 10, photoUrl: 'https://randomuser.me/api/portraits/men/55.jpg' } },
  ]

  const stopById = useMemo(() => BUS_STOPS.reduce((a,s)=>{a[s.id]=s;return a},{}), [])

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

  return (
    <div className="adminWrap">
      <h2 className="title">Dashboard</h2>
      <div className="adminGrid">
        <div className="card">
          <h3 className="title">Live Map</h3>
          <div className="mapBox">
            <MapContainer style={{ height: '100%' }} center={[solapur.lat, solapur.lng]} zoom={13} scrollWheelZoom>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
              {BUS_STOPS.slice(0,4).map((s)=> (
                <Marker key={s.id} position={[s.lat, s.lng]} icon={stopIcon}>
                  <Popup>{s.name}</Popup>
                </Marker>
              ))}
              {BUSES.map((b)=> (
                <Marker key={b.id} position={[b.position.lat, b.position.lng]} icon={busIcon} eventHandlers={{ click: ()=>setSelectedBusId(b.id) }}>
                  <Popup>{b.name}</Popup>
                </Marker>
              ))}
              {selectedBusId && (()=>{
                const b = BUSES.find(x=>x.id===selectedBusId)
                if (!b) return null
                // find nearest stop index on this bus route
                let bestIdx = 0
                let bestDist = Infinity
                for (let i=0;i<b.routeStops.length;i++){
                  const s = stopById[b.routeStops[i]]
                  if (!s) continue
                  const d = L.latLng(b.position.lat, b.position.lng).distanceTo(L.latLng(s.lat, s.lng))
                  if (d < bestDist){ bestDist = d; bestIdx = i }
                }
                const nextIdx = Math.min(bestIdx + 1, b.routeStops.length - 1)
                const nextStop = stopById[b.routeStops[nextIdx]]
                if (!nextStop) return null
                return (
                  <>
                    <RouteLine from={{lat:b.position.lat,lng:b.position.lng}} to={{lat:nextStop.lat,lng:nextStop.lng}} />
                    <FitToBounds points={[b.position, {lat:nextStop.lat,lng:nextStop.lng}]} />
                  </>
                )
              })()}
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
                    <span className={`badge ${r.status==='On Time'?'ok':r.status==='Delayed'?'warn':''}`}>{r.status}</span>
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
                        <span className={`badge ${activeDriver.status==='On Time'?'ok':activeDriver.status==='Delayed'?'warn':''}`}>{activeDriver.status}</span>
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
    </div>
  )
}


