import { useEffect, useMemo, useRef, useState } from 'react'
import './UserPanel.css'
import '../..//components/Select.css'
import { BUS_STOPS } from '../../data/busStops'
import { BUSES } from '../../data/buses'
import { TIMETABLE } from '../../data/timetable'
import { getCurrentPosition, haversineDistanceKm, formatDistanceKm, estimateEtaMinutes } from '../../utils/geo'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

export default function UserPanel() {
  const [userLoc, setUserLoc] = useState(null)
  const [locError, setLocError] = useState('')
  const [selectedStopId, setSelectedStopId] = useState('')
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('en')
  const [sourceId, setSourceId] = useState('')
  const [destId, setDestId] = useState('')

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

  const STOP_NAME_I18N = useMemo(() => ({
    en: {
      'stop-1': 'kanna chowk',
      'stop-2': 'balives',
      'stop-3': 'Market Yard',
      'stop-4': 'Tilak Chowk',
      'stop-5': 'Bus Stand',
    },
    hi: {
      'stop-1': 'कन्ना चौक',
      'stop-2': 'बालिवेस',
      'stop-3': 'मार्केट यार्ड',
      'stop-4': 'तिलक चौक',
      'stop-5': 'बस स्टैंड',
    },
    mr: {
      'stop-1': 'कन्ना चौक',
      'stop-2': 'बालिवेस',
      'stop-3': 'मार्केट यार्ड',
      'stop-4': 'तिलक चौक',
      'stop-5': 'बस स्थानक',
    },
  }), [])

  const getStopName = (stopId) => {
    const pack = STOP_NAME_I18N[lang] || STOP_NAME_I18N.en
    return pack[stopId] || BUS_STOPS.find((s) => s.id === stopId)?.name || stopId
  }

  const stopOptions = useMemo(() => BUS_STOPS.map((s) => ({ value: s.id, label: getStopName(s.id) })), [lang])
  const selectedStop = BUS_STOPS.find((s) => s.id === selectedStopId) || null
  const sourceStop = BUS_STOPS.find((s) => s.id === sourceId) || null
  const destStop = BUS_STOPS.find((s) => s.id === destId) || null

  const stopIdToName = useMemo(() => BUS_STOPS.reduce((acc, s) => { acc[s.id] = getStopName(s.id); return acc }, {}), [lang])

  const busesServing = useMemo(() => {
    if (!selectedStop) return []
    return BUSES.filter((b) => b.routeStops.includes(selectedStop.id)).map((bus) => {
      const firstStopName = stopIdToName[bus.routeStops[0]] || bus.routeStops[0]
      const lastStopName = stopIdToName[bus.routeStops[bus.routeStops.length - 1]] || bus.routeStops[bus.routeStops.length - 1]
      const displayName = `${firstStopName} ↔ ${lastStopName}`
      return { ...bus, displayName }
    })
  }, [selectedStop, stopIdToName])

  const [routeInfo, setRouteInfo] = useState({})

  useEffect(() => {
    if (!selectedStop || busesServing.length === 0) {
      setRouteInfo({})
      return
    }
    let cancelled = false
    async function fetchAll() {
      const results = {}
      await Promise.all(busesServing.map(async (bus) => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${bus.position.lng},${bus.position.lat};${selectedStop.lng},${selectedStop.lat}?overview=false`
          const res = await fetch(url)
          if (!res.ok) throw new Error('routing failed')
          const data = await res.json()
          const meters = data?.routes?.[0]?.distance
          if (typeof meters === 'number') {
            const distanceKm = meters / 1000
            const etaMin = Math.max(0, Math.round((distanceKm / Math.max(1, bus.speedKmph)) * 60))
            results[bus.id] = { distanceKm, etaMin }
            return
          }
          throw new Error('no route')
        } catch (e) {
          const distanceKm = haversineDistanceKm(bus.position, { lat: selectedStop.lat, lng: selectedStop.lng })
          const etaMin = estimateEtaMinutes(distanceKm, bus.speedKmph)
          results[bus.id] = { distanceKm, etaMin }
        }
      }))
      if (!cancelled) setRouteInfo(results)
    }
    fetchAll()
    return () => { cancelled = true }
  }, [selectedStop, busesServing])

  const arrivingBuses = useMemo(() => {
    if (!selectedStop) return []
    return busesServing
      .map((bus) => {
        const info = routeInfo[bus.id]
        if (info) return { ...bus, distanceKm: info.distanceKm, etaMin: info.etaMin }
        const fallbackDistanceKm = haversineDistanceKm(bus.position, { lat: selectedStop.lat, lng: selectedStop.lng })
        const fallbackEta = estimateEtaMinutes(fallbackDistanceKm, bus.speedKmph)
        return { ...bus, distanceKm: fallbackDistanceKm, etaMin: fallbackEta }
      })
      .sort((a, b) => a.etaMin - b.etaMin)
  }, [selectedStop, busesServing, routeInfo])

  const arrivingForSelection = useMemo(() => {
    if (!sourceStop || !destStop) return arrivingBuses
    const allowedIds = new Set(
      BUSES.filter((b) => {
        const si = b.routeStops.indexOf(sourceStop.id)
        const di = b.routeStops.indexOf(destStop.id)
        return si !== -1 && di !== -1 && si < di
      }).map((b) => b.id)
    )
    return arrivingBuses.filter((b) => allowedIds.has(b.id))
  }, [arrivingBuses, sourceStop, destStop])

  const busesForSegment = useMemo(() => {
    if (!sourceStop || !destStop) return []
    return BUSES.filter((b) => {
      const si = b.routeStops.indexOf(sourceStop.id)
      const di = b.routeStops.indexOf(destStop.id)
      return si !== -1 && di !== -1 && si < di
    }).map((bus)=>{
      const firstStopName = stopIdToName[bus.routeStops[0]]
      const lastStopName = stopIdToName[bus.routeStops[bus.routeStops.length-1]]
      return { ...bus, displayName: `${firstStopName} ↔ ${lastStopName}` }
    })
  }, [sourceStop, destStop, stopIdToName])

  const timetableEntries = useMemo(() => {
    if (!selectedStop) return []
    return TIMETABLE[selectedStop.id] || []
  }, [selectedStop])

  const totalTrips = useMemo(() => {
    return timetableEntries.reduce((sum, e) => sum + (e.times?.length || 0), 0)
  }, [timetableEntries])

  const busProgress = useMemo(() => {
    return BUSES.map((bus) => {
      const routeStops = bus.routeStops
      if (!routeStops || routeStops.length === 0) {
        return { id: bus.id, displayName: bus.name, currentStopName: '-', nextStopName: '-', etaMinNext: null }
      }
      let bestIdx = 0
      let bestDist = Infinity
      for (let i = 0; i < routeStops.length; i++) {
        const stop = BUS_STOPS.find((s) => s.id === routeStops[i])
        if (!stop) continue
        const d = haversineDistanceKm(bus.position, { lat: stop.lat, lng: stop.lng })
        if (d < bestDist) { bestDist = d; bestIdx = i }
      }
      const currentStopId = routeStops[bestIdx]
      const nextStopId = routeStops[Math.min(bestIdx + 1, routeStops.length - 1)]
      const firstStopName = stopIdToName[routeStops[0]] || routeStops[0]
      const lastStopName = stopIdToName[routeStops[routeStops.length - 1]] || routeStops[routeStops.length - 1]
      const displayName = `${firstStopName} ↔ ${lastStopName}`
      let etaMinNext = null
      if (bestIdx + 1 < routeStops.length) {
        const nextStop = BUS_STOPS.find((s) => s.id === nextStopId)
        if (nextStop) {
          const dNext = haversineDistanceKm(bus.position, { lat: nextStop.lat, lng: nextStop.lng })
          etaMinNext = estimateEtaMinutes(dNext, bus.speedKmph)
        }
      }
      return {
        id: bus.id,
        displayName,
        currentStopName: stopIdToName[currentStopId] || currentStopId,
        nextStopName: bestIdx + 1 < routeStops.length ? (stopIdToName[nextStopId] || nextStopId) : '-',
        etaMinNext,
      }
    })
  }, [stopIdToName])

  const userIcon = useMemo(() => L.divIcon({ className: '', html: '🧍', iconSize: [24,24], iconAnchor: [12,12] }), [])
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
            <h2 className="title">{lang==='en'?'User Panel':lang==='hi'?'उपयोगकर्ता पैनल':'वापरकर्ता पॅनेल'}</h2>
            <div className="rowGap">
              {userLoc ? (
                <span className="pill">{lang==='en'?'You':lang==='hi'?'आप':'आपण'} • {formatDistanceKm(0)}</span>
              ) : loading ? (
                <span className="pill">{lang==='en'?'Detecting location…':lang==='hi'?'स्थान पता कर रहे हैं…':'स्थान शोधत आहे…'}</span>
              ) : (
                <span className="pill">{lang==='en'?'Location unavailable':lang==='hi'?'स्थान उपलब्ध नहीं':'स्थान उपलब्ध नाही'}</span>
              )}
              {nearestStop && (
                <span className="pill">{lang==='en'?'Nearest':lang==='hi'?'निकटतम':'सर्वात जवळचे'} • {getStopName(nearestStop.stop.id)} ({formatDistanceKm(nearestStop.distanceKm)})</span>
              )}
            </div>
          </div>
          <div className="select">
            <span className="muted">{lang==='en'?'Bus stop':lang==='hi'?'बस स्टॉप':'बस थांबा'}</span>
            <select value={selectedStopId} onChange={(e) => setSelectedStopId(e.target.value)}>
              <option value="" disabled>{lang==='en'?'Select stop':lang==='hi'?'स्टॉप चुनें':'थांबा निवडा'}</option>
              {stopOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="select" style={{ marginTop: '.5rem', display:'flex', gap:'.5rem' }}>
            <span className="muted">{lang==='en'?'From':'से'}</span>
            <select value={sourceId} onChange={(e)=>setSourceId(e.target.value)}>
              <option value="">{lang==='en'?'Choose source':'स्रोत चुनें'}</option>
              {stopOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="muted">{lang==='en'?'To':'तक'}</span>
            <select value={destId} onChange={(e)=>setDestId(e.target.value)}>
              <option value="">{lang==='en'?'Choose destination':'गंतव्य चुनें'}</option>
              {stopOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="langToggle">
            {['en','hi','mr'].map((code)=> (
              <button key={code} className={`langBtn ${lang===code?'active':''}`} onClick={()=>setLang(code)}>
                {code==='en'?'English':code==='hi'?'हिंदी':'मराठी'}
              </button>
            ))}
          </div>
        </div>
        {null}
      </div>

      <div className="panel">
        <h3 className="sectionTitle">{lang==='en'?'Map & Arrivals':lang==='hi'?'मानचित्र और आगमन':'नकाशा आणि आगमन'}</h3>
        <div className="grid">
          <div className="mapBox">
            <MapContainer style={{ height: '100%' }} center={[selectedStop ? selectedStop.lat : solapur.lat, selectedStop ? selectedStop.lng : solapur.lng]} zoom={14} scrollWheelZoom>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
            <InvalidateOnResize />
              {sourceStop && destStop && (
                <RouteLine from={{ lat: sourceStop.lat, lng: sourceStop.lng }} to={{ lat: destStop.lat, lng: destStop.lng }} />
              )}
              {userLoc && (
                <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                  <Popup>You are here</Popup>
                </Marker>
              )}
            {selectedStop && (
              <Marker position={[selectedStop.lat, selectedStop.lng]} icon={stopIcon}>
                <Popup>{getStopName(selectedStop.id)}</Popup>
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
              {(selectedStop || (sourceStop && destStop)) && (
                <FitToBounds points={[
                  ...(userLoc ? [userLoc] : []),
                  ...(selectedStop ? [{ lat: selectedStop.lat, lng: selectedStop.lng }] : []),
                  ...(sourceStop && destStop ? [{ lat: sourceStop.lat, lng: sourceStop.lng }, { lat: destStop.lat, lng: destStop.lng }] : []),
                  ...arrivingBuses.map((b) => b.position),
                ]} />
              )}
            </MapContainer>
          </div>
          <div className="panel">
            <h3 className="sectionTitle">{lang==='en'?'Arrivals':lang==='hi'?'आगमन':'आगमन'}</h3>
            {!selectedStop ? (
              <div className="muted">{lang==='en'?'Select a bus stop to see arriving buses.':lang==='hi'?'आने वाली बसें देखने के लिए बस स्टॉप चुनें।':'येणाऱ्या बसेस पाहण्यासाठी बस थांबा निवडा.'}</div>
            ) : (
              <div className="list">
                {arrivingForSelection.length === 0 ? (
                  <div className="muted">{lang==='en'?'No buses on route for this stop right now.':lang==='hi'?'अभी इस स्टॉप पर कोई बस मार्ग में नहीं है।':'सध्या या थांब्यावर कोणतीही बस मार्गावर नाही.'}</div>
                ) : (
                  arrivingForSelection.map((bus) => (
                  <div key={bus.id} className="card row">
                      <div>
                      <div>{bus.displayName}</div>
                        <div className="muted">{lang==='en'?'Distance':lang==='hi'?'दूरी':'अंतर'}: {formatDistanceKm(bus.distanceKm)}</div>
                      </div>
                      <div className="etaPill"><span className="dot" /> {lang==='en'?'ETA':lang==='hi'?'अनुमानित आगमन':'ETA'} {bus.etaMin} {lang==='en'?'min':lang==='hi'?'मिनट':'मि'}</div>
                      <div className={`badge ${(['on','delayed','crowded'])[bus.id.charCodeAt(0)%3]}`}>
                        {(bus.id.charCodeAt(0)%3)===0 ? (lang==='en'?'On-time':lang==='hi'?'समय पर':'वेळेवर') : (bus.id.charCodeAt(0)%3)===1 ? (lang==='en'?'Delayed':lang==='hi'?'विलंबित':'उशीर') : (lang==='en'?'Crowded':lang==='hi'?'भीड़भाड़':'गर्दी')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <h3 className="sectionTitle">{lang==='en'?'Time Table':'समय सारिणी'}</h3>
            <div className="card" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{lang==='en'?'Bus No.':'बस नंबर'}</th>
                    <th>{lang==='en'?'Bus':'बस'}</th>
                    <th>{lang==='en'?'Current stop':'वर्तमान स्टॉप'}</th>
                    <th>{lang==='en'?'Next stop':'अगला स्टॉप'}</th>
                    <th>{lang==='en'?'Time':lang==='hi'?'समय':'वेळ'}</th>
                  </tr>
                </thead>
                <tbody>
                  {busProgress.map((bp) => (
                    <tr key={bp.id}>
                      <td>{bp.id}</td>
                      <td>{bp.displayName}</td>
                      <td>{bp.currentStopName}</td>
                      <td>{bp.nextStopName}</td>
                      <td>{bp.etaMinNext != null ? new Date(Date.now() + bp.etaMinNext * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="sectionTitle" style={{ marginTop: '1rem' }}>{lang==='en'?'Available buses for route':'इस मार्ग के लिए उपलब्ध बसें'}</h3>
            {!sourceStop || !destStop ? (
              <div className="muted">{lang==='en'?'Choose source and destination to see buses.':'बसें देखने के लिए स्रोत और गंतव्य चुनें।'}</div>
            ) : busesForSegment.length === 0 ? (
              <div className="muted">{lang==='en'?'No direct buses on this segment.':'इस खंड पर कोई सीधी बस नहीं।'}</div>
            ) : (
              <div className="list">
                {busesForSegment.map((bus)=> (
                  <div key={bus.id} className="card row">
                    <div>
                      <div>{bus.displayName}</div>
                      <div className="muted">{getStopName(sourceStop.id)} → {getStopName(destStop.id)}</div>
                    </div>
                    <div className="pill">{lang==='en'?'Direct':'सीधा'}</div>
                  </div>
                ))}
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


