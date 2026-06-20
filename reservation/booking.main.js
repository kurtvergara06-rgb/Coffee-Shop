// booking.main.js
// Minimal handlers to show/hide the booking form and wire basic buttons.
(function initBookingMain() {
  function qs(id) { return document.getElementById(id); }

  function animateIn(el, cb) {
    if (!el) return cb && cb();
    if (window.gsap && typeof gsap.fromTo === 'function') {
      gsap.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power2.out', onComplete: cb });
    } else {
      el.style.opacity = 0;
      el.style.transform = 'translateY(12px)';
      el.style.transition = 'opacity .12s ease, transform .18s ease';
      requestAnimationFrame(() => {
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
      });
      setTimeout(() => cb && cb(), 200);
    }
  }

  function animateOut(el, cb) {
    if (!el) return cb && cb();
    if (window.gsap && typeof gsap.to === 'function') {
      gsap.to(el, { autoAlpha: 0, y: 10, duration: 0.12, ease: 'power2.in', onComplete: cb });
    } else {
      el.style.opacity = 1;
      el.style.transform = 'translateY(0)';
      el.style.transition = 'opacity .12s ease, transform .14s ease';
      requestAnimationFrame(() => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(12px)';
      });
      setTimeout(() => cb && cb(), 160);
    }
  }

  function showBookingForm() {
    const pre = qs('preReserveCard');
    const booking = qs('bookingCard');
    if (!booking) return;

    // hide pre-reserve then show booking card with animation
    if (pre) {
      animateOut(pre, function () {
        pre.style.display = 'none';
        pre.setAttribute('aria-hidden', 'true');

        booking.style.display = getComputedStyle(booking).display === 'none' ? 'grid' : booking.style.display || 'grid';
        booking.setAttribute('aria-hidden', 'false');
        animateIn(booking, function () {
          try { booking.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
        });
      });
    } else {
      booking.style.display = 'grid';
      booking.setAttribute('aria-hidden', 'false');
      animateIn(booking);
    }
  }

  function showPreReserve() {
    const pre = qs('preReserveCard');
    const booking = qs('bookingCard');
    if (!pre) return;

    if (booking) {
      animateOut(booking, function () {
        booking.style.display = 'none';
        booking.setAttribute('aria-hidden', 'true');

        pre.style.display = '';
        pre.setAttribute('aria-hidden', 'false');
        animateIn(pre, function () {
          try { pre.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
        });
      });
    } else {
      pre.style.display = '';
      pre.setAttribute('aria-hidden', 'false');
      animateIn(pre);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  function onReady() {
    const openBtn = qs('openBookingBtn');
    const resetBtn = qs('resetBtn');
    const calcBtn = qs('calculateBtn');
    const submitBtn = qs('submitBtn');
    const bookingForm = qs('bookingForm');

    // Set pre-reserve card date to today's date (readable format)
    try {
      const paxDateEl = qs('paxDate');
      const now = new Date();
      if (paxDateEl) paxDateEl.textContent = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      // Fetch room reservations data from the API and update the pre-reserve card
      // Supports a `date` query parameter (yyyy-mm-dd) and local fallback data
      const localFallbackReservations = {
        // sample fallback: date => total pax reserved on that date
        '2025-12-07': 1 // your reservation on Dec 7 (adjust as needed)
      };

      async function updateRoomCard(dateStr){
        try{
          const roomKey = (qs('roomType') && qs('roomType').value) ? qs('roomType').value : 'study';
          const capacity = 20; // fallback / room capacity (adjust if you store elsewhere)
          // update capacity display
          const capEl = qs('roomCapacity'); if(capEl) capEl.textContent = capacity + ' pax';
          function pad(n){ return n < 10 ? '0' + n : String(n); }
          // build a local YYYY-MM-DD string when no date provided (avoid UTC conversion issues)
          const localIso = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
          const day = dateStr || (dateInput && dateInput.value) || localIso;

          // set visible pax date label (readable) using local-date parsing
          const paxDateEl = qs('paxDate');
          if (paxDateEl) {
            try {
              if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
                const [yy, mm, dd] = day.split('-').map(s => parseInt(s, 10));
                const dLocal = new Date(yy, mm - 1, dd);
                paxDateEl.textContent = dLocal.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              } else {
                const d = new Date(day);
                paxDateEl.textContent = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              }
            } catch (e) { /* ignore */ }
          }
          // fetch reservations for the selected date and room (exclude cancelled client-side)
          let paxToday = 0;
          try{
            const res = await fetch('../api/get_reservations.php?room=' + encodeURIComponent(roomKey) + '&date=' + encodeURIComponent(day));
            const ctype = (res.headers.get('Content-Type') || '').toLowerCase();
            let rows = [];
            if(ctype.includes('application/json')){
              const json = await res.json(); if(json && json.ok) rows = json.data || [];
            }
            paxToday = rows.filter(r => (r.status || '').toLowerCase() !== 'cancelled').reduce((s, r) => s + (parseInt(r.pax || 0, 10) || 0), 0);
          }catch(fetchErr){
            // fallback to local static value if API not available
            paxToday = parseInt(localFallbackReservations[day] || 0, 10);
          }

          // fetch all-time reservation counts for this room (optional)
          let totalReservations = 0;
          try{
            const countsRes = await fetch('../api/get_reservation_counts.php?room=' + encodeURIComponent(roomKey));
            const json2 = countsRes.headers.get('Content-Type') && countsRes.headers.get('Content-Type').toLowerCase().includes('application/json') ? await countsRes.json() : null;
            if(json2 && json2.ok) totalReservations = parseInt(json2.data.total || 0, 10);
          }catch(e){ /* ignore */ }

          // update DOM: total reservations, pax remaining, progress
          const totalEl = qs('roomTotalReservations'); if(totalEl) totalEl.textContent = totalReservations;
          const paxCountEl = qs('paxCount'); if(paxCountEl) paxCountEl.textContent = (capacity - paxToday >= 0 ? (capacity - paxToday) : 0) + '/' + capacity;
          const prog = Math.min(100, Math.round((paxToday / capacity) * 100));
          const progEl = qs('progressFill'); if(progEl) {
            progEl.style.width = prog + '%';
            progEl.setAttribute('aria-valuenow', String(prog));
            progEl.setAttribute('title', `${paxToday}/${capacity} pax used`);
          }

        }catch(e){ /* silent */ }
      }

      // initial load for today (or use `date` query parameter if provided)
      try{
        const params = new URLSearchParams(window.location.search);
        const paramDate = params.get('date');
        if(paramDate){
          if(dateInput) dateInput.value = paramDate;
          updateRoomCard(paramDate);
        } else {
          updateRoomCard();
        }
      }catch(e){ updateRoomCard(); }

      // update bar when user changes date or room selection
      if(dateInput) dateInput.addEventListener('change', ()=> updateRoomCard(dateInput.value));
      if(roomType) roomType.addEventListener('change', ()=> updateRoomCard(dateInput && dateInput.value));

    } catch (e) { /* silent */ }

    if (openBtn) openBtn.addEventListener('click', function (e) {
      e.preventDefault && e.preventDefault();
      // quick press animation
      if (window.gsap) gsap.fromTo(openBtn, { scale: 0.98 }, { scale: 1, duration: 0.12, yoyo: true, repeat: 0 });
      else {
        openBtn.style.transform = 'scale(0.98)';
        setTimeout(()=> openBtn.style.transform = '', 120);
      }
      showBookingForm();
    });

    if (resetBtn) resetBtn.addEventListener('click', function (e) {
      e.preventDefault && e.preventDefault();
      if (window.gsap) gsap.fromTo(resetBtn, { scale: 0.98 }, { scale: 1, duration: 0.12 });
      else { resetBtn.style.transform = 'scale(0.98)'; setTimeout(()=> resetBtn.style.transform = '', 120); }
      showPreReserve();
      if (bookingForm) bookingForm.reset();
    });

    if (calcBtn) calcBtn.addEventListener('click', function(e){
      e.preventDefault && e.preventDefault();
      if (window.gsap) gsap.fromTo(calcBtn, { scale: 0.96 }, { scale: 1, duration: 0.12 });
      else { calcBtn.style.transform = 'scale(0.96)'; setTimeout(()=> calcBtn.style.transform = '', 120); }
      // allow other scripts (estimate) to run; no blocking
    });

    if (submitBtn) submitBtn.addEventListener('click', function(e){
      e.preventDefault && e.preventDefault();
      if (window.gsap) gsap.fromTo(submitBtn, { scale: 0.96 }, { scale: 1, duration: 0.12 });
      else { submitBtn.style.transform = 'scale(0.96)'; setTimeout(()=> submitBtn.style.transform = '', 120); }

      // trigger the real form submit so existing submit handler runs
      if (bookingForm && typeof bookingForm.requestSubmit === 'function') {
        bookingForm.requestSubmit();
      } else if (bookingForm) {
        bookingForm.submit();
      }
    });

    // expose a toast notification function for other scripts
    window.showNotification = function(msg, type = 'error', title){
      try {
        const containerId = 'toastContainer';
        let container = document.getElementById(containerId);
        if (!container) {
          container = document.createElement('div');
          container.id = containerId;
          container.className = 'toast-container';
          document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast ' + (type === 'success' ? 'toast--success' : 'toast--error');
        toast.setAttribute('role','status');
        toast.setAttribute('aria-live','polite');

        const t = document.createElement('div');
        t.className = 'title';
        t.textContent = title || (type === 'success' ? 'Success' : 'Error');
        const m = document.createElement('div');
        m.className = 'msg';
        m.textContent = msg || '';

        toast.appendChild(t);
        toast.appendChild(m);
        container.appendChild(toast);

        // animate in
        requestAnimationFrame(()=> toast.classList.add('show'));

        // auto-remove after 3s
        setTimeout(()=>{
          toast.classList.remove('show');
          setTimeout(()=> toast.remove(), 220);
        }, 3000);
      } catch (err) {
        // silent fallback
      }
    };

    // progressive enhancement: if form is submitted, keep default behavior
    // other booking scripts can intercept submit if needed
  }

})();
