// booking.js — full logic with horizontal dropdown time picker

// -------------------------
// Configuration / Rates
// -------------------------
const HOURLY_RATE = 50;
const MINIMUM_FEE = 75;
const EQUIP_RATE = 150; // per hour
const MAX_PAX = 20;     // maximum pax allowed
// Operating hours: 1:00 PM - 1:00 AM (spans midnight)
const OPER_OPEN = 13;    // 1 PM
const OPER_CLOSE = 1;  // 1 AM (next day)

// -------------------------
// In-memory reservation store
// -------------------------
const reservations = [];

// -------------------------
// DOM references
// -------------------------
const dateInput = document.getElementById('date');
const startInput = document.getElementById('startTime');
const endInput = document.getElementById('endTime');
const roomType = document.getElementById('roomType');
const email = document.getElementById('email');
const pax = document.getElementById('pax');
const proj = document.getElementById('proj');
const audio = document.getElementById('audio');

const estimatedEl = document.getElementById('estimated');
const calculateBtn = document.getElementById('calculateBtn');
const bookingForm = document.getElementById('bookingForm');
const resetBtn = document.getElementById('resetBtn');

const modal = document.getElementById('confirmModal');
const closeModalBtn = document.getElementById('closeModal');
const doneBtn = document.getElementById('doneBtn');

const cDate = document.getElementById('c-date');
const cTime = document.getElementById('c-time');
const cHours = document.getElementById('c-hours');
const cRoom = document.getElementById('c-room');
const cEq = document.getElementById('c-eq');
const cContact = document.getElementById('c-contact');
const cFee = document.getElementById('c-fee');
const cId = document.getElementById('c-id');

// -------------------------
// Date picker init (flatpickr)
// -------------------------
flatpickr("#date", {
  altInput: true,
  altFormat: "F j, Y",
  dateFormat: "Y-m-d",
  minDate: "today",
  disableMobile: true
});

// -------------------------
// TIME DROPDOWN PICKER LOGIC
// -------------------------
function initTimeDropdown(inputId, dropdownId, hourId, minId, ampmId, setBtnId) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  const hour = document.getElementById(hourId);
  const min = document.getElementById(minId);
  const ampm = document.getElementById(ampmId);
  const setBtn = document.getElementById(setBtnId);

  // populate hours
  for(let h=1; h<=12; h++){
    const opt = document.createElement('option'); opt.value = h; opt.textContent = h;
    hour.appendChild(opt);
  }
  // populate minutes
  for(let m=0; m<60; m++){
    const opt = document.createElement('option'); opt.value = m; opt.textContent = m.toString().padStart(2,'0');
    min.appendChild(opt);
  }

  // show dropdown on input click
  input.addEventListener('click', () => {
    dropdown.style.display = 'flex';
    dropdown.style.flexDirection = 'row';
    dropdown.style.gap = '6px';
  });

  // set button click
  setBtn.addEventListener('click', () => {
    const val = `${hour.value}:${min.value.padStart(2,'0')} ${ampm.value}`;
    input.value = val;
    dropdown.style.display = 'none';
  });

  // click outside closes dropdown
  document.addEventListener('click', (e) => {
    if(!dropdown.contains(e.target) && e.target !== input && !input.nextElementSibling.contains(e.target)){
      dropdown.style.display = 'none';
    }
  });
}

// initialize start/end dropdowns
initTimeDropdown('startTime','startTimeDropdown','startHour','startMinute','startAmPm','startTimeSet');
initTimeDropdown('endTime','endTimeDropdown','endHour','endMinute','endAmPm','endTimeSet');

// -------------------------
// Helpers: parse times & operating hours
// -------------------------
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
  // Add 24 to early-morning hours only when operating window crosses midnight
  if(typeof OPER_OPEN !== 'undefined' && typeof OPER_CLOSE !== 'undefined' && OPER_OPEN > OPER_CLOSE && h < 6) h += 24;
  return h + dateObj.getMinutes()/60;
}
function isWithinOperating(startDate, endDate){
  let s = startDate.getHours() + startDate.getMinutes()/60;
  let e = endDate.getHours() + endDate.getMinutes()/60;
  let wStart = OPER_OPEN;
  let wEnd = OPER_CLOSE;
  if(wEnd <= wStart) wEnd += 24; // span midnight
  if(e <= s) e += 24; // reservation crosses midnight
  return s >= wStart && e <= wEnd;
}
function overlaps(aStart,aEnd,bStart,bEnd){
  return (aStart < bEnd && aEnd > bStart);
}

// -------------------------
// Business rules
// -------------------------
function checkBusinessRules(dateStr, startDate, endDate, room, paxCount){
  // Operating hours enforcement removed — allow any booking time

  if(paxCount > MAX_PAX) return { ok:false, msg: `Maximum ${MAX_PAX} pax allowed.`};

  const sameDateRes = reservations.filter(r => r.date === dateStr && r.room === room);

  if(room === 'function'){
    for(const r of sameDateRes){
      if(overlaps(startDate, endDate, r.start, r.end)){
        return { ok:false, msg: `Function room already booked for that time.`};
      }
    }
    return { ok:true };
  } else {
    let totalPaxOverlapping = 0;
    for(const r of sameDateRes){
      if(overlaps(startDate, endDate, r.start, r.end)){
        totalPaxOverlapping += r.pax;
      }
    }
    if(totalPaxOverlapping + paxCount > MAX_PAX){
      return { ok:false, msg: `Study Room capacity exceeded.`};
    }
    return { ok:true };
  }
}

// -------------------------
// Estimate / calculation
// -------------------------
function hoursBetween(start,end){
  return Math.max(0, (end - start)/(1000*60*60));
}
function formatCurrency(n){ return `₱${Math.round(n)}`; }

function computeEstimate(){
  const dateVal = dateInput.value;
  const startVal = startInput.value;
  const endVal = endInput.value;
  if(!dateVal || !startVal || !endVal) return { ok:false, message:'Please pick date and times' };

  let start = parseTimeToDate(dateVal, startVal);
  let end = parseTimeToDate(dateVal, endVal);
  if(!start || !end) return { ok:false, message:'Invalid time format' };

  if(end <= start) end = new Date(end.getTime() + 24*60*60*1000);

  if(!isWithinOperating(start,end)) return { ok:false, message:'Times must be within 1:00 PM - 1:00 AM' };

  const hours = Math.round(hoursBetween(start,end)*100)/100;
  let base = hours * HOURLY_RATE;
  if(hours < 2) base = Math.max(base, MINIMUM_FEE);
  let equip = 0;
  if(proj.checked) equip += EQUIP_RATE * hours;
  if(audio.checked) equip += EQUIP_RATE * hours;
  return { ok:true, total: base + equip, hours, base, equip, start, end };
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

// -------------------------
// Events
// -------------------------
calculateBtn.addEventListener('click', ()=>{
  const res = updateEstimateUI();
  if(!res.ok) return alert(res.message);
  gsap.fromTo(estimatedEl, {scale:0.9, opacity:0.6}, {scale:1, opacity:1, duration:0.2});
});

resetBtn.addEventListener('click', ()=>{
  bookingForm.reset();
  estimatedEl.textContent = '₱0';
});

function validateForm(){
  if(!dateInput.value || !startInput.value || !endInput.value || !email.value) return { ok:false, msg:'Please complete all required fields.'};
  if(!email.checkValidity()) return { ok:false, msg:'Please enter a valid email.'};
  const paxCount = Number(pax.value) || 0;
  if(paxCount < 1) return { ok:false, msg:'Pax must be at least 1.'};
  if(paxCount > MAX_PAX) return { ok:false, msg:`Max ${MAX_PAX} pax per reservation.`};
  return { ok:true };
}

function generateReservationID(){
  return `R#${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random()*9000+1000)}`;
}

async function sendReservation(data){
  return new Promise((resolve) => {
    setTimeout(()=> {
      reservations.push(data);
      resolve({ ok:true });
    }, 300);
  });
}

bookingForm.addEventListener('submit', async (ev)=>{
  ev.preventDefault();

  const valid = validateForm();
  if(!valid.ok){ alert(valid.msg); return; }

  const estimate = computeEstimate();
  if(!estimate.ok){ alert(estimate.message); return; }

  const dateVal = dateInput.value;
  let start = estimate.start;
  let end = estimate.end;
  const payload = {
    id: generateReservationID(),
    room: roomType.value,
    date: dateVal,
    start,
    end,
    pax: Number(pax.value) || 1,
    email: email.value,
    equipment: (proj.checked ? ['Projector'] : []).concat(audio.checked ? ['Speaker & Mic'] : []),
    total: estimate.total
  };

  const br = checkBusinessRules(dateVal, start, end, payload.room, payload.pax);
  if(!br.ok){ alert(br.msg); return; }

  try {
    const resp = await sendReservation(payload);
    if(resp && resp.ok !== false){
      cDate.textContent = payload.date;
      cTime.textContent = `${startInput.value} - ${endInput.value}`;
      cHours.textContent = `${estimate.hours} hrs`;
      cRoom.textContent = payload.room === 'study' ? 'Study Room' : 'Function';
      cEq.textContent = payload.equipment.length ? payload.equipment.join(', ') : 'None';
      cContact.textContent = payload.email;
      cFee.textContent = formatCurrency(payload.total);
      cId.textContent = payload.id;

      modal.setAttribute('aria-hidden','false');
      gsap.fromTo(modal, {opacity:0}, {opacity:1, duration:0.2});
      gsap.fromTo('.modal-content', {y:40,opacity:0,scale:0.98}, {y:0,opacity:1,scale:1, duration:0.35, ease:'power3.out'});
    } else throw new Error('backend');
  } catch(err){
    alert('Failed to submit reservation — try again later.');
  }
});

closeModalBtn.addEventListener('click', ()=>{
  gsap.to('.modal-content',{y:20,opacity:0,scale:0.98,duration:0.2});
  gsap.to(modal,{opacity:0,duration:0.2, onComplete: ()=> modal.setAttribute('aria-hidden','true')});
});
doneBtn.addEventListener('click', ()=> closeModalBtn.click());

// page animations
window.addEventListener('load', ()=>{
  gsap.from('body',{opacity:0,duration:0.5});
  gsap.from('.glass-nav',{y:-40,opacity:0,duration:0.6,ease:'power2.out'});
  gsap.from('.booking-card',{opacity:0,y:20,duration:0.6,delay:0.12});
});

// auto-hide nav
let lastScroll = window.pageYOffset;
const nav = document.querySelector('.glass-nav');
window.addEventListener('scroll', ()=>{
  const cur = window.pageYOffset;
  if(cur > lastScroll && cur > 100) gsap.to(nav,{y:-120,duration:0.35});
  else gsap.to(nav,{y:0,duration:0.35});
  lastScroll = cur;
});
