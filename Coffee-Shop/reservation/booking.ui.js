// animations
window.addEventListener('load', ()=>{
  gsap.from('body',{opacity:0,duration:0.5});
  gsap.from('.glass-nav',{y:-40,opacity:0,duration:0.6,ease:'power2.out'});
  gsap.from('.booking-card',{opacity:0,y:20,duration:0.6,delay:0.12});
});

// reset
resetBtn.addEventListener('click', ()=>{
  bookingForm.reset();
  estimatedEl.textContent = '₱0';
  
  // Return to pre-reserve card
  const preReserveCard = document.getElementById('preReserveCard');
  const bookingCard = document.getElementById('bookingCard');
  
  if (preReserveCard && bookingCard) {
    bookingCard.style.display = 'none';
    bookingCard.setAttribute('aria-hidden', 'true');
    preReserveCard.style.display = '';
    preReserveCard.setAttribute('aria-hidden', 'false');
    try { preReserveCard.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
  }
});
// Auto-calculate when relevant fields change
function runAutoEstimate() {
  const res = updateEstimateUI();
  if(!res.ok) {
    // show a toast error instead of alert if available
    if (window.showNotification) window.showNotification(res.message, 'error');
  } else {
    // animate estimate value
    if (window.gsap) gsap.fromTo(estimatedEl, {scale:0.92, opacity:0.7}, {scale:1, opacity:1, duration:0.18});
  }
}

['change','input'].forEach(evt => {
  [dateInput, startInput, endInput, roomType, proj, audio].forEach(el => {
    if (!el) return;
    el.addEventListener(evt, ()=>{
      // small debounce to avoid rapid re-calculation
      if (window._estimateTimer) clearTimeout(window._estimateTimer);
      window._estimateTimer = setTimeout(()=> runAutoEstimate(), 120);
    });
  });
});

// autohide nav
let lastScroll = window.pageYOffset;
const nav = document.querySelector('.glass-nav');

window.addEventListener('scroll', ()=>{
  const cur = window.pageYOffset;
  if(cur > lastScroll && cur > 100)
    gsap.to(nav,{y:-120,duration:0.35});
  else
    gsap.to(nav,{y:0,duration:0.35});

  lastScroll = cur;
});
