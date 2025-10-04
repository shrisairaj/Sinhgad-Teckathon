const express = require('express');
const { getActiveBuses, getTomorrowSchedule, updateRouteSchedule, getRouteSchedule } = require('../lib/store');
const { getBusById, buses } = require('../data/buses');
const { getRouteById, routes } = require('../data/routes');
const { drivers } = require('../data/drivers');

const router = express.Router();

// GET /admin/active-buses
router.get('/active-buses', (_req, res) => {
  const active = getActiveBuses();
  const enriched = active.map(s => {
    const bus = getBusById(s.busId);
    const route = s.routeId ? getRouteById(s.routeId) : null;
    return {
      ...s,
      registrationNumber: bus?.registrationNumber,
      routeNumber: route?.routeNumber,
      routeName: route?.routeName
    };
  });
  res.json(enriched);
});

// GET /admin/tomorrow-schedule
router.get('/tomorrow-schedule', (_req, res) => {
  const schedule = getTomorrowSchedule();
  const enriched = schedule.routes.map(route => ({
    ...route,
    bus: getBusById(route.busId),
    route: getRouteById(route.routeId),
    driver: drivers.find(d => d.driverId === route.driverId)
  }));
  res.json({ ...schedule, routes: enriched });
});

// POST /admin/tomorrow-schedule
router.post('/tomorrow-schedule', (req, res) => {
  const { routes } = req.body || {};
  if (!Array.isArray(routes)) {
    return res.status(400).json({ error: 'routes must be an array' });
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  const updated = updateRouteSchedule(dateStr, routes);
  res.json(updated);
});

// GET /admin/available-resources
router.get('/available-resources', (_req, res) => {
  res.json({
    buses: buses.map(b => ({ busId: b.busId, registrationNumber: b.registrationNumber, model: b.model })),
    routes: routes.map(r => ({ routeId: r.routeId, routeNumber: r.routeNumber, routeName: r.routeName })),
    drivers: drivers.map(d => ({ 
      driverId: d.driverId, 
      name: d.name, 
      username: d.username,
      phone: d.phone,
      license: d.license,
      experienceYears: d.experienceYears,
      photoUrl: d.photoUrl
    }))
  });
});

// GET /admin/debug-assignment/:driverId
router.get('/debug-assignment/:driverId', (req, res) => {
  const { driverId } = req.params;
  const schedule = getTomorrowSchedule();
  const assignment = schedule.routes?.find(r => r.driverId == driverId);
  
  res.json({
    driverId,
    schedule,
    assignment,
    allDrivers: drivers.map(d => ({ driverId: d.driverId, username: d.username, name: d.name }))
  });
});

module.exports = router;


