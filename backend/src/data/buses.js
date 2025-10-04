// Define 4 buses and assign to routes

exports.buses = [
  { busId: 1, registrationNumber: 'MH-12-AB-1010', model: 'Tata City', capacity: 40, routeId: 1 },
  { busId: 2, registrationNumber: 'MH-12-AB-2020', model: 'Ashok Leyland', capacity: 42, routeId: 1 },
  { busId: 3, registrationNumber: 'MH-12-AB-3030', model: 'Volvo', capacity: 45, routeId: 2 },
  { busId: 4, registrationNumber: 'MH-12-AB-4040', model: 'Tata Mini', capacity: 28, routeId: 3 }
];

exports.getBusById = function getBusById(busId) {
  return exports.buses.find(b => b.busId === busId) || null;
};

exports.getBusesByRoute = function getBusesByRoute(routeId) {
  return exports.buses.filter(b => b.routeId === routeId);
};



