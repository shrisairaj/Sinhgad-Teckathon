// In-memory "DB" for live status and trips

exports.liveStatusByBusId = new Map();
// liveStatus: { busId, driverId, routeId, latitude, longitude, status, issue, lastUpdated }

exports.saveLiveStatus = function saveLiveStatus(status) {
  const now = new Date().toISOString();
  const prev = exports.liveStatusByBusId.get(status.busId) || {};
  const normalized = { ...prev, ...status, lastUpdated: now };
  exports.liveStatusByBusId.set(status.busId, normalized);
  return normalized;
};

exports.getLiveStatus = function getLiveStatus(busId) {
  return exports.liveStatusByBusId.get(busId) || null;
};

exports.getActiveBuses = function getActiveBuses() {
  const out = [];
  for (const s of exports.liveStatusByBusId.values()) {
    if (s.status === 'running' || s.status === 'delay' || s.status === 'delayed') {
      out.push(s);
    }
  }
  return out;
};

exports.setEmergency = function setEmergency(busId, driverId, issue) {
  const now = new Date().toISOString();
  const prev = exports.liveStatusByBusId.get(busId) || {};
  const updated = { ...prev, busId, driverId, status: 'delay', issue, lastUpdated: now };
  exports.liveStatusByBusId.set(busId, updated);
  return updated;
};

// Route schedules for different days
exports.routeSchedules = new Map();
// Format: { date: 'YYYY-MM-DD', routes: [{ routeId, busId, driverId, startTime, endTime, isActive }] }

exports.getRouteSchedule = function getRouteSchedule(date) {
  return exports.routeSchedules.get(date) || { date, routes: [] };
};

exports.updateRouteSchedule = function updateRouteSchedule(date, routes) {
  exports.routeSchedules.set(date, { date, routes });
  return { date, routes };
};

exports.getTomorrowSchedule = function getTomorrowSchedule() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  return exports.getRouteSchedule(dateStr);
};


