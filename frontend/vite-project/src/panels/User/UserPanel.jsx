import { useEffect, useMemo, useRef, useState } from 'react'
import './UserPanel.css'
import '../..//components/Select.css'
import { BUS_STOPS } from '../../data/busStops'
import { BUSES } from '../../data/buses'
import { getCurrentPosition, haversineDistanceKm, formatDistanceKm, estimateEtaMinutes } from '../../utils/geo'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

export default function UserPanel() {
  const [userLoc, setUserLoc] = useState(null)
  const [locError, setLocError] = useState('')
  const [selectedStopId, setSelectedStopId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getCurrentPosition()
      .then((pos) => {
        if (!mounted) return
        setUserLoc(pos)
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        setLocError(err?.message || 'Location error')
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const nearestStop = useMemo(() => {
    if (!userLoc) return null
    let best = null
    for (const stop of BUS_STOPS) {
      const d = haversineDistanceKm(userLoc, { lat: stop.lat, lng: stop.lng })
      if (!best || d < best.distanceKm) best = { stop, distanceKm: d }
    }
    return best
  }, [userLoc])

  useEffect(() => {
    if (nearestStop && !selectedStopId) setSelectedStopId(nearestStop.stop.id)
  }, [nearestStop, selectedStopId])

  const stopOptions = BUS_STOPS.map((s) => ({ value: s.id, label: s.name }))
  const selectedStop = BUS_STOPS.find((s) => s.id === selectedStopId) || null

  const arrivingBuses = useMemo(() => {
    if (!selectedStop) return []
    const busesServing = BUSES.filter((b) => b.routeStops.includes(selectedStop.id))
    return busesServing
      .map((bus) => {
        const distanceKm = haversineDistanceKm(bus.position, { lat: selectedStop.lat, lng: selectedStop.lng })
        const etaMin = estimateEtaMinutes(distanceKm, bus.speedKmph)
        return { ...bus, distanceKm, etaMin }
      })
      .sort((a, b) => a.etaMin - b.etaMin)
  }, [selectedStop])

  const busIcon = useMemo(() => L.divIcon({ className: '', html: '🚌', iconSize: [24,24], iconAnchor: [12,12] }), [])
  const stopIcon = useMemo(() => L.divIcon({ className: '', html: '📍', iconSize: [24,24], iconAnchor: [12,12] }), [])

  function FitToBounds({ points }) {
    const map = useMap()
    useEffect(() => {
      if (!points || points.length === 0) return
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
      map.fitBounds(bounds.pad(0.2))
    }, [points, map])
    return null
  }

  function InvalidateOnResize() {
    const map = useMap()
    useEffect(() => {
      const handle = () => map.invalidateSize()
      const t = setTimeout(handle, 50)
      window.addEventListener('resize', handle)
      return () => {
        clearTimeout(t)
        window.removeEventListener('resize', handle)
      }
    }, [map])
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
          const points = data?.routes?.[0]?.geometry?.coordinates || []
          if (!cancelled && points.length) {
            setCoords(points.map(([lng, lat]) => [lat, lng]))
          } else if (!cancelled) {
            setCoords([[from.lat, from.lng], [to.lat, to.lng]])
          }
        } catch (e) {
          if (!cancelled) setCoords([[from.lat, from.lng], [to.lat, to.lng]])
        }
      }
      fetchRoute()
      return () => { cancelled = true }
    }, [from, to])
    if (!coords) return null
    return <Polyline positions={coords} pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.9 }} />
  }

  const solapur = { lat: 17.6599, lng: 75.9064 }

  return (
    <div className="container">
      <div className="hero">
        <div className="heroInner">
          <div>
            <h2 className="title">User Panel</h2>
            <div className="rowGap">
              {userLoc ? (
                <span className="pill">You • {formatDistanceKm(0)}</span>
              ) : loading ? (
                <span className="pill">Detecting location…</span>
              ) : (
                <span className="pill">Location unavailable</span>
              )}
              {nearestStop && (
                <span className="pill">Nearest • {nearestStop.stop.name} ({formatDistanceKm(nearestStop.distanceKm)})</span>
              )}
            </div>
          </div>
          <div className="select">
            <span className="muted">Bus stop</span>
            <select value={selectedStopId} onChange={(e) => setSelectedStopId(e.target.value)}>
              <option value="" disabled>Select stop</option>
              {stopOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="marquee">
          <div className="busRow">
            <span>🚌</span><span>🚌</span><span>🚌</span><span>🚌</span><span>🚌</span><span>🚌</span><span>🚌</span>
          </div>
          <div className="busRow" style={{ animationDelay: '7s' }}>
            <span>🚌</span><span>🚌</span><span>🚌</span><span>🚌</span><span>🚌</span><span>🚌</span><span>🚌</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="sectionTitle">Map & Arrivals</h3>
        <div className="grid">
          <div className="mapBox">
            <MapContainer style={{ height: '100%' }} center={[selectedStop ? selectedStop.lat : solapur.lat, selectedStop ? selectedStop.lng : solapur.lng]} zoom={14} scrollWheelZoom>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
            <InvalidateOnResize />
            {selectedStop && (
              <Marker position={[selectedStop.lat, selectedStop.lng]} icon={stopIcon}>
                <Popup>{selectedStop.name}</Popup>
              </Marker>
            )}
            {arrivingBuses.map((bus) => (
                <Marker key={bus.id} position={[bus.position.lat, bus.position.lng]} icon={busIcon}>
                  <Popup>
                    <div>
                      <div>{bus.name}</div>
                      <div className="muted">ETA {bus.etaMin} min • {formatDistanceKm(bus.distanceKm)}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {selectedStop && arrivingBuses.map((bus) => (
                <RouteLine key={`line-${bus.id}`} from={{ lat: bus.position.lat, lng: bus.position.lng }} to={{ lat: selectedStop.lat, lng: selectedStop.lng }} />
              ))}
            {selectedStop && (
              <FitToBounds points={[
                ...(selectedStop ? [{ lat: selectedStop.lat, lng: selectedStop.lng }] : []),
                ...arrivingBuses.map((b) => b.position),
              ]} />
            )}
            </MapContainer>
          </div>
          <div className="panel">
            <h3 className="sectionTitle">Arrivals</h3>
            {!selectedStop ? (
              <div className="muted">Select a bus stop to see arriving buses.</div>
            ) : (
              <div className="list">
                {arrivingBuses.length === 0 ? (
                  <div className="muted">No buses on route for this stop right now.</div>
                ) : (
                  arrivingBuses.map((bus) => (
                    <div key={bus.id} className="card row">
                      <div>
                        <div>{bus.name}</div>
                        <div className="muted">Distance: {formatDistanceKm(bus.distanceKm)}</div>
                      </div>
                      <div className="etaPill"><span className="dot" /> ETA {bus.etaMin} min</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {locError && (
        <div className="muted">{locError}</div>
      )}
    </div>
  )
}


