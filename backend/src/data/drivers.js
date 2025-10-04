const bcrypt = require('bcryptjs');

// Simple in-memory drivers and assignments
// Passwords are bcrypt hashes of 'password123'

const passwordHash = bcrypt.hashSync('password123', 10);

exports.drivers = [
  { 
    driverId: 1, 
    name: 'Amit Kumar', 
    username: 'driver1', 
    passwordHash, 
    phone: '+91-98765-43210', 
    license: 'MH-12-2023-001',
    experienceYears: 5,
    photoUrl: 'https://randomuser.me/api/portraits/men/31.jpg',
    busId: 1 
  },
  { 
    driverId: 2, 
    name: 'Neha Sharma', 
    username: 'driver2', 
    passwordHash, 
    phone: '+91-98765-43211', 
    license: 'MH-12-2023-002',
    experienceYears: 3,
    photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    busId: 2 
  },
  { 
    driverId: 3, 
    name: 'Ravi Patel', 
    username: 'driver3', 
    passwordHash, 
    phone: '+91-98765-43212', 
    license: 'MH-12-2023-003',
    experienceYears: 7,
    photoUrl: 'https://randomuser.me/api/portraits/men/12.jpg',
    busId: 3 
  },
  { 
    driverId: 4, 
    name: 'Sara Khan', 
    username: 'driver4', 
    passwordHash, 
    phone: '+91-98765-43213', 
    license: 'MH-12-2023-004',
    experienceYears: 4,
    photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    busId: 4 
  }
];

exports.getDriverByUsername = function getDriverByUsername(username) {
  return exports.drivers.find(d => d.username === username) || null;
};

exports.getDriverById = function getDriverById(driverId) {
  return exports.drivers.find(d => d.driverId === driverId) || null;
};



