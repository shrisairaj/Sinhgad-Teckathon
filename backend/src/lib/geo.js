// Minimal geo helpers

exports.toRadians = function toRadians(deg) {
  return (deg * Math.PI) / 180;
};

exports.haversineMeters = function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const dLat = exports.toRadians(lat2 - lat1);
  const dLon = exports.toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(exports.toRadians(lat1)) *
      Math.cos(exports.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

exports.estimateEtaMinutes = function estimateEtaMinutes(distanceMeters, avgSpeedKmph = 20) {
  const metersPerMinute = (avgSpeedKmph * 1000) / 60;
  return Math.round(distanceMeters / metersPerMinute);
};



