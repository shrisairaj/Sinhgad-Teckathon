// Simple mock timetable: per stop, an array of scheduled arrivals per bus
// Times are in 24h HH:MM local time strings

export const TIMETABLE = {
  'stop-1': [
    { busId: 'bus-101', busName: 'Bus 101 - Central ↔ IT Park', times: ['08:05','09:10','10:20','11:30','12:40','14:00','15:15','17:00'] },
    { busId: 'bus-202', busName: 'Bus 202 - Airport ↔ Central', times: ['08:20','09:35','10:50','12:05','13:20','15:10','16:30','18:00'] },
    { busId: 'bus-606', busName: 'Bus 606 - Kanna Chowk ↔ Tilak Chowk', times: ['08:15','09:25','10:35','11:45','12:55','14:10','15:30','16:50'] },
  ],
  'stop-2': [
    { busId: 'bus-303', busName: 'Bus 303 - Market ↔ University', times: ['08:00','09:00','10:15','11:45','13:15','14:45','16:15','17:45'] },
    { busId: 'bus-202', busName: 'Bus 202 - Airport ↔ Central', times: ['08:40','09:55','11:10','12:25','13:40','15:30','16:50','18:20'] },
    { busId: 'bus-505', busName: 'Bus 505 - Balives ↔ Bus Stand', times: ['08:20','09:30','10:40','11:50','13:00','14:10','15:20','16:30'] },
  ],
  'stop-3': [
    { busId: 'bus-101', busName: 'Bus 101 - Central ↔ IT Park', times: ['08:30','09:45','11:00','12:15','13:30','14:45','16:00','17:15'] },
    { busId: 'bus-404', busName: 'Bus 404 - IT Park ↔ Airport', times: ['08:15','09:25','10:35','11:50','13:05','14:20','15:35','16:50'] },
  ],
  'stop-4': [
    { busId: 'bus-101', busName: 'Bus 101 - Central ↔ IT Park', times: ['08:15','09:25','10:35','11:45','12:55','14:10','15:30','16:50'] },
    { busId: 'bus-303', busName: 'Bus 303 - Market ↔ University', times: ['08:20','09:35','10:50','12:05','13:20','14:35','15:50','17:05'] },
    { busId: 'bus-606', busName: 'Bus 606 - Kanna Chowk ↔ Tilak Chowk', times: ['08:05','09:15','10:25','11:35','12:45','13:55','15:05','16:15'] },
  ],
  'stop-5': [
    { busId: 'bus-202', busName: 'Bus 202 - Airport ↔ Central', times: ['08:00','09:10','10:25','11:40','12:55','14:10','15:25','16:40'] },
    { busId: 'bus-404', busName: 'Bus 404 - IT Park ↔ Airport', times: ['08:35','09:50','11:05','12:20','13:35','14:50','16:05','17:20'] },
    { busId: 'bus-505', busName: 'Bus 505 - Balives ↔ Bus Stand', times: ['08:10','09:20','10:30','11:40','12:50','14:00','15:10','16:20'] },
  ],
}


