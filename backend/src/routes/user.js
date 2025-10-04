const express = require('express');
const { stops, getStopById, getStopByName } = require('../data/stops');
const { routes } = require('../data/routes');
const { getBusesByRoute } = require('../data/buses');
const { getActiveBuses } = require('../lib/store');
const { haversineMeters, estimateEtaMinutes } = require('../lib/geo');

const router = express.Router();

// GET /user/stops -> list of stops
router.get('/stops', (_req, res) => {
  res.json(stops);
});

// GET /user/arrivals?stop=stopIdOrName
router.get('/arrivals', (req, res) => {
  const q = String(req.query.stop || '').trim();
  let stop = null;
  if (/^\d+$/.test(q)) stop = getStopById(Number(q));
  if (!stop) stop = getStopByName(q);
  if (!stop) return res.status(404).json({ error: 'stop not found' });

  // Find routes containing this stop
  const routesServing = routes.filter(r => r.stops.includes(stop.stopId));
  const active = getActiveBuses();

  const results = [];
  for (const r of routesServing) {
    const routeBuses = getBusesByRoute(r.routeId);
    for (const b of routeBuses) {
      const live = active.find(s => s.busId === b.busId);
      if (!live) continue;
      const distance = haversineMeters(live.latitude, live.longitude, stop.latitude, stop.longitude);
      const etaMin = estimateEtaMinutes(distance, 20);
      results.push({
        routeId: r.routeId,
        routeNumber: r.routeNumber,
        busId: b.busId,
        registrationNumber: b.registrationNumber,
        status: live.status,
        latitude: live.latitude,
        longitude: live.longitude,
        distanceMeters: Math.round(distance),
        etaMinutes: etaMin
      });
    }
  }
  res.json({ stop, arrivals: results });
});

// GET /user/journey?source=...&destination=...
router.get('/journey', (req, res) => {
  const srcQ = String(req.query.source || '').trim();
  const dstQ = String(req.query.destination || '').trim();
  let src = null;
  let dst = null;
  if (/^\d+$/.test(srcQ)) src = getStopById(Number(srcQ));
  if (/^\d+$/.test(dstQ)) dst = getStopById(Number(dstQ));
  if (!src) src = getStopByName(srcQ);
  if (!dst) dst = getStopByName(dstQ);
  if (!src || !dst) return res.status(400).json({ error: 'Invalid source or destination' });

  // Same-route journeys; we check order via stop index
  const candidateRoutes = routes.filter(r => r.stops.includes(src.stopId) && r.stops.includes(dst.stopId));
  const active = getActiveBuses();

  const options = [];
  for (const r of candidateRoutes) {
    const srcIdx = r.stops.indexOf(src.stopId);
    const dstIdx = r.stops.indexOf(dst.stopId);
    if (srcIdx === -1 || dstIdx === -1 || srcIdx >= dstIdx) continue;

    const routeBuses = getBusesByRoute(r.routeId);
    for (const b of routeBuses) {
      const live = active.find(s => s.busId === b.busId);
      if (!live) continue;
      const distanceToSrc = haversineMeters(live.latitude, live.longitude, src.latitude, src.longitude);
      const etaToSrc = estimateEtaMinutes(distanceToSrc, 20);
      options.push({
        routeId: r.routeId,
        routeNumber: r.routeNumber,
        busId: b.busId,
        registrationNumber: b.registrationNumber,
        status: live.status,
        etaToSourceMinutes: etaToSrc
      });
    }
  }
  res.json({ source: src, destination: dst, options });
});

module.exports = router;



