// Seeded stops and coordinates
// Names provided by user; trimmed/normalized where needed

exports.stops = [
  { stopId: 1, name: 'kanna chowk', latitude: 17.6777933, longitude: 75.9139568 },
  { stopId: 2, name: 'market Yard', latitude: 17.6826418, longitude: 75.9268586 },
  { stopId: 3, name: 'balives', latitude: 17.6812185, longitude: 75.9026619 },
  { stopId: 4, name: 'Bale', latitude: 17.69448, longitude: 75.876997 },
  { stopId: 5, name: 'bus stand', latitude: 17.679605, longitude: 75.898729 },
  { stopId: 6, name: 'Puna naka', latitude: 17.685471, longitude: 75.89327 }
];

exports.getStopById = function getStopById(stopId) {
  return exports.stops.find(s => s.stopId === stopId) || null;
};

exports.getStopByName = function getStopByName(name) {
  const normalized = String(name || '').trim().toLowerCase();
  return (
    exports.stops.find(s => s.name.trim().toLowerCase() === normalized) || null
  );
};



