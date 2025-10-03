import { useEffect, useMemo, useState } from 'react'
import './UserPanel.css'
import '../..//components/Select.css'
import { BUS_STOPS } from '../../data/busStops'
import { BUSES } from '../../data/buses'
import { getCurrentPosition, haversineDistanceKm, formatDistanceKm, estimateEtaMinutes } from '../../utils/geo'

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

  return (
    <div className="container">
      <div className="header">
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

      <div className="grid">
        <div className="panel">
          <h3 className="sectionTitle">Map</h3>
          <div className="mapStub">
            <div>
              {selectedStop ? (
                <div className="muted">Map placeholder • Focus: {selectedStop.name}</div>
              ) : (
                <div className="muted">Map placeholder</div>
              )}
            </div>
          </div>
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
                    <div className="pill">ETA {bus.etaMin} min</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {locError && (
        <div className="muted">{locError}</div>
      )}
    </div>
  )
}


