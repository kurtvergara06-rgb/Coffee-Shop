function hoursBetween(start,end){
  return Math.max(0, (end - start)/(1000*60*60));
}

function formatCurrency(n){
  return `₱${Math.round(n)}`;
}

function computeEstimate(){
  const dateVal = dateInput.value;
  const startVal = startInput.value;
  const endVal = endInput.value;

  if(!dateVal || !startVal || !endVal)
    return { ok:false, message:'Please pick date and times' };

  let start = parseTimeToDate(dateVal,startVal);
  let end = parseTimeToDate(dateVal,endVal);
  if(!start || !end) return { ok:false, message:'Invalid time format' };

  // Reject identical start/end selection (users picking same time creates a 24h wrap)
  if(start.getHours() === end.getHours() && start.getMinutes() === end.getMinutes())
    return { ok:false, message:'End time must be after start time' };

  // Normalize end if it falls on the next day (end <= start)
  if(end <= start) end = new Date(end.getTime() + 24*3600*1000);

  // Operating hours: 1:00 PM -> 1:00 AM (next day)
  const OPER_OPEN = 13; // 13:00 (1 PM)
  const OPER_CLOSE = 1; // 01:00 (1 AM next day)

  function isWithinOperating(s, e){
    // s and e are Date objects; e may be on next day
    let sh = s.getHours() + s.getMinutes()/60 + (s.getSeconds()/3600);
    let eh = e.getHours() + e.getMinutes()/60 + (e.getSeconds()/3600);
    // if end was normalized to next day, ensure eh > sh
    if(eh <= sh) eh += 24;

    if(OPER_OPEN <= OPER_CLOSE){
      return sh >= OPER_OPEN && eh <= OPER_CLOSE;
    }
    // crosses midnight (e.g., 13 -> 1). Treat times after midnight as +24
    if(sh < OPER_OPEN) sh += 24;
    if(eh < OPER_OPEN) eh += 24;
    const wStart = OPER_OPEN;
    const wEnd = OPER_CLOSE + 24;
    return sh >= wStart && eh <= wEnd;
  }

  if(!isWithinOperating(start,end)) return { ok:false, message:'Times must be within 1:00 PM - 1:00 AM' };

  const hours = Math.round(hoursBetween(start,end)*100)/100;
  if(hours <= 0) return { ok:false, message:'Duration must be at least a few minutes' };

  const rate = roomType.value === 'function'
    ? FUNCTION_HOURLY_RATE
    : STUDY_HOURLY_RATE;

  let base = hours * rate;
  if(hours < 2) base = Math.max(base, MINIMUM_FEE);

  let equip = 0;
  if(proj.checked) equip += EQUIP_RATE * hours;
  if(audio.checked) equip += EQUIP_RATE * hours;

  return { ok:true, total: base+equip, hours, base, equip, start, end };
}

function updateEstimateUI(){
  const res = computeEstimate();
  if(!res.ok){
    estimatedEl.textContent = '₱0';
    return res;
  }
  estimatedEl.textContent = formatCurrency(res.total);
  return res;
}
