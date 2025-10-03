export function toRad(deg) {
  return (deg * Math.PI) / 180
}

export function haversineDistanceKm(a, b) {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const x = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

export function formatDistanceKm(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function estimateEtaMinutes(distanceKm, speedKmph = 25) {
  if (speedKmph <= 0) return Infinity
  const hours = distanceKm / speedKmph
  return Math.max(0, Math.round(hours * 60))
}

export function getCurrentPosition(options) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => reject(err),
      options || { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}




