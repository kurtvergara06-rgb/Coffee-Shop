// Rates & Operating Hours
// Rates & Operating Hours
const STUDY_HOURLY_RATE = 50;
const FUNCTION_HOURLY_RATE = 1000;
const MINIMUM_FEE = 75;
const EQUIP_RATE = 150;
const MAX_PAX = 20;


// Operating hours: 1:00 PM - 1:00 AM (spans midnight)
const OPER_OPEN = 13;    // 1 PM
const OPER_CLOSE = 1;    // 1 AM (next day)

// In-memory store
const reservations = [];

// Limits
const MAX_HOURS = 12;

// Initialize: Load all non-cancelled reservations on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('../api/get_reservations.php?status=Confirmed&status=Pending');
    const data = await res.json();
    if (data && data.ok && Array.isArray(data.data)) {
      // Transform API response to match expected format
      data.data.forEach(r => {
        const startDate = new Date(r.start_time);
        const endDate = new Date(r.end_time);
        reservations.push({
          id: r.id,
          res_id: r.res_id,
          date: r.res_date,
          room: r.room,
          start: startDate,
          end: endDate,
          pax: r.pax,
          status: r.status
        });
      });
    }
  } catch (err) {
    console.warn('Could not load reservations for availability check:', err);
  }
});