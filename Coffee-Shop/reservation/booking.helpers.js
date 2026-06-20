function parseTimeToDate(dateStr, timeStr){
  if(!dateStr || !timeStr) return null;
  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if(!m) return null;

  let hh = parseInt(m[1],10);
  const mm = parseInt(m[2],10);
  const ampm = m[3].toUpperCase();

  if(ampm === 'PM' && hh !== 12) hh += 12;
  if(ampm === 'AM' && hh === 12) hh = 0;

  const d = new Date(dateStr);
  d.setHours(hh, mm, 0, 0);
  return d;
}

function hourAxis(dateObj){
  let h = dateObj.getHours();
  // If operating window crosses midnight (open hour > close hour), map early-morning hours
  // into the extended axis (add 24) so comparisons work correctly. Otherwise leave as-is.
  if(typeof OPER_OPEN !== 'undefined' && typeof OPER_CLOSE !== 'undefined' && OPER_OPEN > OPER_CLOSE && h < 6) h += 24;
  return h + dateObj.getMinutes()/60;
}

function isWithinOperating(startDate, endDate){
  // Operating hours are disabled — allow any booking time
  return true;
}

function overlaps(aStart,aEnd,bStart,bEnd){
  return (aStart < bEnd && aEnd > bStart);
}   
