// Define 3 routes using only provided stops
// Each route lists stopIds in travel order

exports.routes = [
  {
    routeId: 1,
    routeNumber: 'R1',
    routeName: 'Kanna Chowk -> Bus Stand -> Market Yard',
    stops: [1, 5, 2]
  },
  {
    routeId: 2,
    routeNumber: 'R2',
    routeName: 'Balives -> Puna Naka -> Bus Stand',
    stops: [3, 6, 5]
  },
  {
    routeId: 3,
    routeNumber: 'R3',
    routeName: 'Bale -> Balives -> Kanna Chowk',
    stops: [4, 3, 1]
  }
];

exports.getRouteById = function getRouteById(routeId) {
  return exports.routes.find(r => r.routeId === routeId) || null;
};



