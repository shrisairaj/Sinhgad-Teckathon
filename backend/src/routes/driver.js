const express = require('express');
const bcrypt = require('bcryptjs');
const { signToken, authMiddleware } = require('../lib/auth');
const { getDriverByUsername } = require('../data/drivers');
const { getBusById } = require('../data/buses');
const { getRouteById } = require('../data/routes');
const { saveLiveStatus, setEmergency } = require('../lib/store');

const router = express.Router();

// POST /driver/login { username, password }
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const driver = getDriverByUsername(username);
  if (!driver) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, driver.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const bus = getBusById(driver.busId);
  const token = signToken({ driverId: driver.driverId, busId: driver.busId, routeId: bus?.routeId });
  res.json({ 
    token, 
    driver: { 
      driverId: driver.driverId, 
      name: driver.name, 
      username: driver.username,
      busId: driver.busId 
    } 
  });
});

// POST /driver/live { latitude, longitude, status }
router.post('/live', authMiddleware, (req, res) => {
  const { driverId, busId } = req.user || {};
  const { latitude, longitude, status } = req.body || {};
  if (!driverId || !busId) return res.status(401).json({ error: 'unauthorized' });
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'latitude and longitude must be numbers' });
  }
  const bus = getBusById(busId);
  const routeId = bus?.routeId || null;
  const allowed = new Set(['running', 'delay', 'delayed', 'trip_ended', 'inactive']);
  const normalizedStatus = allowed.has(status) ? status : 'running';
  const saved = saveLiveStatus({ busId, driverId, routeId, latitude, longitude, status: normalizedStatus });
  res.json(saved);
});

// POST /driver/end-trip
router.post('/end-trip', authMiddleware, (req, res) => {
  const { driverId, busId } = req.user || {};
  if (!driverId || !busId) return res.status(401).json({ error: 'unauthorized' });
  
  // Update the bus status to trip_ended
  const saved = saveLiveStatus({ 
    busId, 
    driverId, 
    status: 'trip_ended',
    latitude: 0, // Clear location
    longitude: 0 
  });
  
  res.json({ 
    message: 'Trip ended successfully',
    status: saved 
  });
});

module.exports = router;

// POST /driver/emergency { issue: 'bus_problem' | 'driver_health_issue' | 'other_issue' }
router.post('/emergency', authMiddleware, (req, res) => {
  const { driverId, busId } = req.user || {};
  const { issue, latitude, longitude } = req.body || {};
  const allowed = new Set(['bus_problem', 'driver_health_issue', 'other_issue']);
  if (!driverId || !busId) return res.status(401).json({ error: 'unauthorized' });
  if (!allowed.has(issue)) return res.status(400).json({ error: 'invalid issue' });
  let updated = setEmergency(busId, driverId, issue);
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    updated = saveLiveStatus({ busId, driverId, latitude, longitude, status: 'delay', issue });
  }
  res.json(updated);
});


