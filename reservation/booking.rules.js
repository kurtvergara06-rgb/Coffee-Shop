function checkBusinessRules(dateStr, startDate, endDate, room, paxCount){

  // Operating hours enforcement: 1:00 PM -> 1:00 AM (next day)
  const OPER_OPEN = 13; // 13:00 (1 PM)
  const OPER_CLOSE = 1; // 01:00 (1 AM next day)

  function isWithinOperating(s, e){
    let sh = s.getHours() + s.getMinutes()/60 + (s.getSeconds()/3600);
    let eh = e.getHours() + e.getMinutes()/60 + (e.getSeconds()/3600);
    if(eh <= sh) eh += 24;
    if(OPER_OPEN <= OPER_CLOSE){
      return sh >= OPER_OPEN && eh <= OPER_CLOSE;
    }
    if(sh < OPER_OPEN) sh += 24;
    if(eh < OPER_OPEN) eh += 24;
    const wStart = OPER_OPEN;
    const wEnd = OPER_CLOSE + 24;
    return sh >= wStart && eh <= wEnd;
  }

  if(!isWithinOperating(startDate, endDate)) return { ok:false, msg:'Times must be within 1:00 PM - 1:00 AM' };

  // Reject zero-length / identical times (defensive - in case other scripts bypass estimate)
  if(startDate.getTime() === endDate.getTime()) return { ok:false, msg: 'End time must be after start time' };

  if(paxCount > MAX_PAX) return { ok:false, msg:`Maximum ${MAX_PAX} pax allowed.` };

  const sameDateRes = reservations.filter(r => r.date === dateStr && r.room === room);

  if(room === 'function'){
    for(const r of sameDateRes){
      if(overlaps(startDate, endDate, r.start, r.end)){
        return { ok:false, msg: `Function room already booked for that time.`};
      }
    }
    return { ok:true };
  }

  // study room total pax check
  let totalPaxOverlapping = 0;
  for(const r of sameDateRes){
    if(overlaps(startDate,endDate,r.start,r.end)){
      totalPaxOverlapping += r.pax;
    }
  }

  if(totalPaxOverlapping + paxCount > MAX_PAX){
    return { ok:false, msg: `Study Room capacity exceeded.` };
  }

  return { ok:true };
}
