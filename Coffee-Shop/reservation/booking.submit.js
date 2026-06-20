function validateForm(){
  if(!dateInput.value || !startInput.value || !endInput.value || !email.value)
    return { ok:false, msg:'Please complete all required fields.'};

  if(!email.checkValidity())
    return { ok:false, msg:'Please enter a valid email.'};

  const paxCount = Number(pax.value) || 0;
  if(paxCount < 1) return { ok:false, msg:'Pax must be at least 1.'};
  if(paxCount > MAX_PAX) return { ok:false, msg:`Max ${MAX_PAX} pax per reservation.`};

  return { ok:true };
}

function generateReservationID(){
  return `R#${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random()*9000+1000)}`;
}

async function sendReservation(data){
  try{
    const resp = await fetch('../api/create_reservation.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await resp.json();
    if(json && json.ok) return { ok:true, res_id: json.res_id };
    return { ok:false, error: (json && json.error) ? json.error : 'Server error' };
  } catch(err){
    return { ok:false, error: err.message || 'Network error' };
  }
}

bookingForm.addEventListener('submit', async (ev)=>{
  ev.preventDefault();

  const valid = validateForm();
  if(!valid.ok){ (window.showNotification ? window.showNotification(valid.msg,'error') : alert(valid.msg)); return; }

  const estimate = computeEstimate();
  if(!estimate.ok){ (window.showNotification ? window.showNotification(estimate.message,'error') : alert(estimate.message)); return; }

  const dateVal = dateInput.value;
  let { start, end } = estimate;

  const payload = {
    room: roomType.value,
    date: dateVal,
    start,
    end,
    pax: Number(pax.value) || 1,
    email: email.value,
    equipment: (proj.checked ? ['Projector'] : [])
                 .concat(audio.checked ? ['Speaker & Mic'] : []),
    total: estimate.total
  };

  const br = checkBusinessRules(dateVal,start,end,payload.room,payload.pax);
  if(!br.ok){ (window.showNotification ? window.showNotification(br.msg,'error') : alert(br.msg)); return; }

  try{
    const resp = await sendReservation(payload);
    if(resp && resp.ok){

      // fill modal with server reservation id
      cDate.textContent = payload.date;
      cTime.textContent = `${startInput.value} - ${endInput.value}`;
      cHours.textContent = `${estimate.hours} hrs`;
      cRoom.textContent = payload.room === 'study' ? 'Study Room' : 'Function';
      cEq.textContent = payload.equipment.length ? payload.equipment.join(', ') : 'None';
      cContact.textContent = payload.email;
      cFee.textContent = formatCurrency(payload.total);
      cId.textContent = resp.res_id || '';

      modal.setAttribute('aria-hidden','false');
      gsap.fromTo(modal,{opacity:0},{opacity:1,duration:0.2});
      gsap.fromTo('.modal-content',{y:40,opacity:0,scale:0.98},
        {y:0,opacity:1,scale:1,duration:0.35,ease:'power3.out'});

      // success notification
      (window.showNotification ? window.showNotification(`Reservation created: ${resp.res_id}`,'success') : null);

    } else {
      const msg = (resp && resp.error) ? resp.error : 'Failed to submit reservation — try again later.';
      (window.showNotification ? window.showNotification(msg,'error') : alert(msg));
    }
  } catch(err){
    (window.showNotification ? window.showNotification('Failed to submit reservation — try again later.','error') : alert('Failed to submit reservation — try again later.'));
  }
});

closeModalBtn.addEventListener('click', ()=>{
  gsap.to('.modal-content',{y:20,opacity:0,scale:0.98,duration:0.2});
  gsap.to(modal,{opacity:0,duration:0.2,
    onComplete:()=> modal.setAttribute('aria-hidden','true')});
});

doneBtn.addEventListener('click', ()=> closeModalBtn.click());
