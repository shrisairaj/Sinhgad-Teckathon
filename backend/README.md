Minimal Bus Tracking Backend (Node.js/Express)

Setup
- npm install
- npm run dev

Environment
- JWT_SECRET in .env (already set to dev_secret)
- PORT in .env (default 4000)

Seeded Data
- Stops: provided names and coordinates
- Routes: 3 routes using only provided stops
- Buses: 4 buses mapped to routes
- Drivers: driver1..driver4, password: password123

Endpoints
- GET /health
- POST /driver/login { username, password }
- POST /driver/live (Bearer token) { latitude:number, longitude:number, status?:running|delay|trip_ended|inactive }
- GET /user/stops
- GET /user/arrivals?stop=<stop id or name>
- GET /user/journey?source=<id|name>&destination=<id|name>
- GET /admin/active-buses



