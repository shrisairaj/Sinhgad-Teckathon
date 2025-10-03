// Mock buses with current approximate positions and speeds
// Each bus lists the stops on its route by stop id

export const BUSES = [
  {
    id: 'bus-101',
    name: 'Bus 101 - Central ↔ IT Park',
    routeStops: ['stop-1', 'stop-4', 'stop-3'],
    position: { lat: 18.5400, lng: 73.8350 },
    speedKmph: 28,
  },
  {
    id: 'bus-202',
    name: 'Bus 202 - Airport ↔ Central',
    routeStops: ['stop-5', 'stop-2', 'stop-1'],
    position: { lat: 18.5650, lng: 73.8850 },
    speedKmph: 32,
  },
  {
    id: 'bus-303',
    name: 'Bus 303 - Market ↔ University',
    routeStops: ['stop-4', 'stop-2'],
    position: { lat: 18.5300, lng: 73.8450 },
    speedKmph: 24,
  },
  {
    id: 'bus-404',
    name: 'Bus 404 - IT Park ↔ Airport',
    routeStops: ['stop-3', 'stop-5'],
    position: { lat: 18.5880, lng: 73.7950 },
    speedKmph: 35,
  },
]


