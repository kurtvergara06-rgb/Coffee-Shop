// Minimal admin JS to avoid missing file errors. Add admin utilities here.
document.addEventListener('DOMContentLoaded', () => {
  // Minimal toast helper (same style as booking.submit.js) — admin uses toasts instead of adminError text
  function showToast(message, type = 'info', duration = 3000){
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    Object.assign(el.style, {
      position: 'fixed',
      right: '20px',
      top: '20px',
      zIndex: 99999,
      padding: '10px 16px',
      background: type === 'success' ? '#4caf50' : type === 'error' ? '#e74c3c' : '#333',
      color: '#fff',
      borderRadius: '6px',
      boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
      opacity: '0',
      transition: 'opacity 0.25s ease-out, transform 0.25s ease-out'
    });
    document.body.appendChild(el);
    requestAnimationFrame(()=>{ el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(()=>{ el.style.opacity = '0'; el.style.transform = 'translateY(-10px)'; setTimeout(()=>el.remove(),300); }, duration);
    return el;
  }
  const refreshBtn = document.getElementById('refreshBtn');
  const filterBtn = document.getElementById('filterBtn');
  const exportBtn = document.getElementById('exportBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => window.location.reload());
  if (filterBtn) filterBtn.addEventListener('click', () => {
    const pop = document.getElementById('filterPopover');
    if (!pop) return;
    pop.setAttribute('aria-hidden', pop.getAttribute('aria-hidden') === 'true' ? 'false' : 'true');
  });
  // Load reservations into table
  // Use relative API base so the page works regardless of hosting path
  const API_BASE = '../api';
  async function loadReservations(){
    try{
      if(adminError) adminError.textContent = '';
      // read filters
      const statusFilter = document.getElementById('statusFilter');
      const roomFilter = document.getElementById('roomFilter');
      const dateRangeFilter = document.getElementById('dateRangeFilter');
      const params = new URLSearchParams();
      if(statusFilter && statusFilter.value !== 'all') params.set('status', statusFilter.value);
      if(roomFilter && roomFilter.value !== 'all') params.set('room', roomFilter.value);
      if(dateRangeFilter && dateRangeFilter.value !== 'all'){
        const dr = dateRangeFilter.value;
        const d = new Date();
        if(dr === 'today') params.set('date', d.toISOString().slice(0,10));
        else if(dr === 'tomorrow') { d.setDate(d.getDate()+1); params.set('date', d.toISOString().slice(0,10)); }
        else if(dr === 'next7') { params.set('date', new Date().toISOString().slice(0,10)); }
      }

      // include server-side search parameter (from the search input) so the API returns filtered dataset
      const searchEl = document.getElementById('searchInput');
      const searchVal = (searchEl?.value || '').trim();
      if(searchVal) params.set('search', searchVal);
      const res = await fetch(API_BASE + '/get_reservations.php?' + params.toString());
      // Prefer JSON but handle non-JSON responses for easier debugging
      const ctype = (res.headers.get('Content-Type') || '').toLowerCase();
      let data;
      if(ctype.includes('application/json')){
        data = await res.json();
      } else {
        const text = await res.text();
        // show server response in the admin error area for debugging
        const msg = 'Server returned non-JSON response: ' + (text ? text.slice(0,1000) : '<empty>');
        console.error(msg, text);
        if(adminError){
          adminError.textContent = msg;
          adminError.classList.remove('hidden');
        }
        showToast(msg, 'error', 8000);
        throw new Error(msg);
      }
      if(!data.ok) throw new Error(data.error || 'Failed to fetch');
      const table = document.getElementById('reservationTable');
      const rows = data.data || [];
      // Clear existing rows except header
      while(table.rows.length > 1) table.deleteRow(1);
      rows.forEach(r => {
        const tr = table.insertRow(-1);
        tr.insertCell(-1).textContent = r.name || r.email;
        tr.insertCell(-1).textContent = r.res_date;
        tr.insertCell(-1).textContent = r.start_time;
        tr.insertCell(-1).textContent = r.end_time;
        tr.insertCell(-1).textContent = r.room;
        tr.insertCell(-1).textContent = r.pax;
        tr.insertCell(-1).textContent = r.status;
        const action = tr.insertCell(-1);
        action.style.display = 'flex';
        action.style.gap = '6px';
        action.style.flexWrap = 'wrap';
        
        // If pending, show a quick confirm button
        if((r.status || '').toLowerCase() === 'pending'){
          const confirmBtn = document.createElement('button');
          confirmBtn.textContent = 'Confirm';
          confirmBtn.className = 'btn primary';
          confirmBtn.style.fontSize = '12px';
          confirmBtn.style.padding = '6px 8px';
          confirmBtn.addEventListener('click', async ()=>{
            try{
              const resp = await postToApi(API_BASE + '/update_reservation.php', new URLSearchParams({ id: r.id, status: 'Confirmed' }));
              if(!resp.ok) { showToast(resp.error || 'Confirm failed', 'error', 6000); return; }
              showToast('Reservation confirmed', 'success', 3000);
              loadReservations();
            }catch(e){ showToast('Confirm failed', 'error', 6000); }
          });
          action.appendChild(confirmBtn);
        }

        // Edit button opens modal
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn';
        editBtn.style.fontSize = '12px';
        editBtn.style.padding = '6px 8px';
        editBtn.addEventListener('click', ()=> showEditModal(r));
        action.appendChild(editBtn);

        // Cancel button (marks reservation as Cancelled; does NOT delete)
        const rejectBtn = document.createElement('button');
        rejectBtn.textContent = 'Cancel';
        rejectBtn.className = 'btn danger';
        rejectBtn.style.fontSize = '12px';
        rejectBtn.style.padding = '6px 8px';
        rejectBtn.addEventListener('click', async ()=>{
          if(!confirm(`Cancel reservation for ${r.name} on ${r.res_date}? This will not delete the record.`)) return;
          try{
            const resp = await postToApi(API_BASE + '/update_reservation.php', new URLSearchParams({ id: r.id, status: 'Cancelled' }));
            if(!resp.ok) { showToast(resp.error || 'Cancel failed', 'error', 6000); return; }
            showToast('Reservation cancelled', 'success', 3000);
            loadReservations();
          }catch(e){ showToast('Cancel failed', 'error', 6000); }
        });
        action.appendChild(rejectBtn);
      });
      // Update dashboard counts from the filtered dataset (so cards reflect applied filters)
      // Update dashboard counts using server-side counts endpoint for the same params (fast)
      try{
        const countRes = await fetch(API_BASE + '/get_reservation_counts.php?' + params.toString());
        const ctype2 = (countRes.headers.get('Content-Type') || '').toLowerCase();
        let countData;
        if(ctype2.includes('application/json')) countData = await countRes.json();
        else {
          const text = await countRes.text();
          const msg = 'Counts endpoint returned non-JSON: ' + (text ? text.slice(0,1000) : '<empty>');
          console.error(msg, text);
          if(adminError){ adminError.textContent = msg; adminError.classList.remove('hidden'); }
          showToast(msg, 'error', 6000);
          throw new Error('Counts endpoint returned non-JSON');
        }
        if(countData.ok){
          updateDashboardCountsFromCounts(countData.data);
        } else {
          updateDashboardCounts(rows);
        }
      }catch(e){
        updateDashboardCounts(rows);
      }
    } catch(err){
      console.error('Failed to load reservations', err);
      const m = err && err.message ? err.message : 'Failed to load reservations';
      if(adminError){ adminError.textContent = m; adminError.classList.remove('hidden'); }
      showToast('Failed to load reservations: ' + m, 'error', 8000);
    }
  }
  // Dashboard count elements
  const totalEl = document.getElementById('totalReservations');
  const confirmedEl = document.getElementById('confirmedCount');
  const pendingEl = document.getElementById('pendingCount');
  const cancelledEl = document.getElementById('cancelledCount');
  function updateDashboardCounts(rows){
    if(!Array.isArray(rows)) rows = [];
    const total = rows.length;
    const confirmed = rows.filter(r => (r.status || '').toLowerCase() === 'confirmed').length;
    const pending = rows.filter(r => (r.status || '').toLowerCase() === 'pending').length;
    const cancelled = rows.filter(r => (r.status || '').toLowerCase().startsWith('cancel')).length;
    if(totalEl) totalEl.textContent = total;
    if(confirmedEl) confirmedEl.textContent = confirmed;
    if(pendingEl) pendingEl.textContent = pending;
    if(cancelledEl) cancelledEl.textContent = cancelled;
  }
  function updateDashboardCountsFromCounts(c){
    if(!c) c = {};
    const total = parseInt(c.total || 0, 10);
    const confirmed = parseInt(c.confirmed || 0, 10);
    const pending = parseInt(c.pending || 0, 10);
    const cancelled = parseInt(c.cancelled || 0, 10);
    if(totalEl) totalEl.textContent = total;
    if(confirmedEl) confirmedEl.textContent = confirmed;
    if(pendingEl) pendingEl.textContent = pending;
    if(cancelledEl) cancelledEl.textContent = cancelled;
  }
  // Modal and edit handlers
  const editModal = document.getElementById('editModal');
  const modalDeleteBtn = document.getElementById('modalDeleteBtn');
  const saveBtn = document.getElementById('saveBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  const adminError = document.getElementById('adminError');
  const deleteModal = document.getElementById('deleteModal');
  const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
  const deleteCancelBtn = document.getElementById('deleteCancelBtn');
  const deleteDetails = document.getElementById('deleteDetails');
  // form fields
  const fId = document.getElementById('editId');
  const fName = document.getElementById('editName');
  const fEmail = document.getElementById('editEmail');
  const fRoom = document.getElementById('editRoom');
  const fDate = document.getElementById('editDate');
  const fStart = document.getElementById('editStart');
  const fEnd = document.getElementById('editEnd');
  const fPax = document.getElementById('editPax');
  const fEquipment = document.getElementById('editEquipment');
  const fResId = document.getElementById('editResId');
  const closeModalX = document.getElementById('closeModalX');
  const equipmentInputs = () => (fEquipment ? Array.from(fEquipment.querySelectorAll('input[type="checkbox"]') || []) : []);
  const fTotal = document.getElementById('editTotal');
  const fStatus = document.getElementById('editStatus');

  function showEditModal(r){
    if(!editModal) return;
    // Fill fields
    fId.value = r.id || '';
    if(fName) fName.value = r.name || '';
    fEmail.value = r.email || '';
    fRoom.value = r.room || 'function';
    // date in YYYY-MM-DD
    fDate.value = (r.res_date || '').slice(0,10);
    // start/end as HH:MM if given (handle either 'YYYY-MM-DD HH:MM:SS' or 'HH:MM:SS')
    const fmtTime = (t)=>{ if(!t) return ''; if(t.indexOf(' ') >= 0) return t.slice(11,16); if(t.indexOf(':') >= 0) return t.slice(0,5); return t; };
    fStart.value = fmtTime(r.start_time || '');
    fEnd.value = fmtTime(r.end_time || '');
    fPax.value = r.pax || '';
    // equipment: support JSON array string or comma-separated list
    const eqStr = r.equipment || '';
    if(fEquipment && fEquipment.tagName !== 'TEXTAREA'){
      let arr = [];
      try{ arr = JSON.parse(eqStr); if(!Array.isArray(arr)) arr = []; }catch(e){ arr = (''+eqStr).split(/[|,;]+/).map(s=>s.trim()).filter(Boolean); }
      equipmentInputs().forEach(cb => cb.checked = arr.includes(cb.value));
    } else if(fEquipment && fEquipment.tagName === 'TEXTAREA'){
      fEquipment.value = eqStr;
    }
    if(fResId) fResId.value = r.res_id || '';
    fTotal.value = r.total || '';
    fStatus.value = r.status || 'Pending';
    // show: explicitly use a 'show' class, set aria-hidden to false, and prevent page scroll
    editModal.classList.remove('hidden');
    editModal.classList.add('show');
    editModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Close modal when clicking on overlay (outside modal-inner)
    const onOverlayClick = (ev)=>{
      if(ev.target === editModal){ closeEditModal(); }
    };
    editModal.addEventListener('click', onOverlayClick, { once: true });
    setTimeout(()=>{ if(fName) fName.focus(); else if(fEmail) fEmail.focus(); }, 50);
  }
  function closeEditModal(){
    if(!editModal) return;
    editModal.setAttribute('aria-hidden', 'true');
    editModal.classList.remove('show');
    editModal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  if(modalDeleteBtn) modalDeleteBtn.addEventListener('click', ()=>{
    // Open delete confirmation modal for the currently-open reservation
    const id = fId ? fId.value : '';
    const name = (fName && fName.value) ? fName.value : '(no name)';
    const date = fDate ? fDate.value : '';
    if(!id){ showToast('No reservation selected', 'error', 3000); return; }
    deleteDetails.innerHTML = `Are you sure you want to delete reservation <strong>${name}</strong> on <strong>${date}</strong>?`;
    if(!deleteModal) return;
    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('show');
    deleteModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    deleteModal.addEventListener('click', function onDOverlay(e){ if(e.target === deleteModal){ deleteModal.setAttribute('aria-hidden','true'); deleteModal.classList.add('hidden'); deleteModal.removeEventListener('click', onDOverlay); } });
    deleteConfirmBtn && deleteConfirmBtn.focus();
  });
  if(closeModalX) closeModalX.addEventListener('click', ()=> closeEditModal());

  async function postToApi(url, data){
    try{
      const res = await fetch(url, { method: 'POST', body: data });
      const ctype = (res.headers.get('Content-Type') || '').toLowerCase();
      if(ctype.includes('application/json')) return await res.json();
      // non-json response: return error object with text body
      const text = await res.text();
      return { ok:false, error: 'Non-JSON response from server: ' + (text ? text.slice(0,1000) : '<empty>') };
    }catch(e){
      return { ok:false, error: e.message };
    }
  }

  // Simple operating hours check (01:00 - 13:00) for admin inputs
  function adminIsWithinOperating(dateStr, startTime, endTime){
    // operating hours not enforced for admin — always return true
    return true;
  }

  if(saveBtn){
    saveBtn.addEventListener('click', async ()=>{
      const id = fId.value;
      const form = new URLSearchParams();
      form.set('id', id);
      form.set('name', (fName && fName.value) ? fName.value : '');
      form.set('email', fEmail.value);
      form.set('room', fRoom.value);
      form.set('res_date', fDate.value);
      // start_time/end_time in the DB are DATETIME; combine date + selected time
      if(fDate.value && fStart.value) form.set('start_time', `${fDate.value} ${fStart.value}:00`);
      if(fDate.value && fEnd.value) form.set('end_time', `${fDate.value} ${fEnd.value}:00`);
      // Validate operating hours client-side before sending
      // Validate operating hours client-side before sending; if not within hours, fall back to confirmation if force override is set
      const forceCheckbox = document.getElementById('forceOverride');
      const force = !!(forceCheckbox && forceCheckbox.checked);
      if(!adminIsWithinOperating(fDate.value, fStart.value, fEnd.value)){
        if(!force){
          showToast('Operating hours are 1:00 PM - 1:00 AM. Enable Force override to save outside hours.', 'error', 6000);
          return;
        } else {
          if(!confirm('Times are outside of operating hours. Do you want to force save this reservation?')) return;
        }
      }
      form.set('pax', fPax.value);
      // store equipment as JSON array string
      if(fEquipment && fEquipment.tagName !== 'TEXTAREA'){
        const checked = equipmentInputs().filter(cb => cb.checked).map(cb => cb.value);
        form.set('equipment', JSON.stringify(checked));
      } else if(fEquipment && fEquipment.tagName === 'TEXTAREA'){
        form.set('equipment', fEquipment.value);
      }
      form.set('total', fTotal.value);
      form.set('status', fStatus.value);
      // include the 'force' flag if set (will bypass server-side operating hours validation if allowed)
      form.set('force', force ? '1' : '0');
      const res = await postToApi(API_BASE + '/update_reservation.php', form);
      if(!res.ok){ showToast(res.error || 'Update failed', 'error', 6000); return; }
      showToast('Reservation updated', 'success', 3000);
      closeEditModal();
      loadReservations();
    });
  }

  if(confirmBtn){
    confirmBtn.addEventListener('click', async ()=>{
      const id = fId.value;
      // validate times before accept; respect force override option
      const forceCheckbox2 = document.getElementById('forceOverride');
      const force2 = !!(forceCheckbox2 && forceCheckbox2.checked);
      if(!adminIsWithinOperating(fDate.value, fStart.value, fEnd.value)){
        if(!force2){ showToast('Cannot accept reservation: times must be within 1:00 PM - 1:00 AM.', 'error', 6000); return; }
        if(!confirm('Times are outside operating hours. Confirm and accept this booking?')) return;
      }
      const res = await postToApi(API_BASE + '/update_reservation.php', new URLSearchParams({ id, status: 'Confirmed', force: force2 ? '1' : '0' }));
      if(!res.ok){ showToast(res.error || 'Confirm failed', 'error', 6000); return; }
      showToast('Reservation accepted', 'success', 3000);
      closeEditModal();
      loadReservations();
    });
  }

  if(rejectBtn){
    // In-modal cancel: mark the currently-open reservation as Cancelled (do not delete)
    rejectBtn.addEventListener('click', async ()=>{
      const id = fId.value;
      const name = (fName && fName.value) ? fName.value : '(no name)';
      const date = fDate.value || '';
      if(!id){ showToast('No reservation selected', 'error', 3000); return; }
      if(!confirm(`Cancel reservation for ${name} on ${date}? This will not delete the record.`)) return;
      try{
        const resp = await postToApi(API_BASE + '/update_reservation.php', new URLSearchParams({ id, status: 'Cancelled' }));
        if(!resp.ok){ showToast(resp.error || 'Cancel failed', 'error', 6000); return; }
        showToast('Reservation cancelled', 'success', 3000);
        if(deleteModal){ deleteModal.setAttribute('aria-hidden','true'); deleteModal.classList.remove('show'); deleteModal.classList.add('hidden'); }
        closeEditModal();
        loadReservations();
      }catch(e){ showToast('Cancel failed', 'error', 6000); }
    });
  }
  // Delete modal handlers
  if(deleteCancelBtn){ deleteCancelBtn.addEventListener('click', ()=>{ if(deleteModal) { deleteModal.setAttribute('aria-hidden','true'); deleteModal.classList.remove('show'); deleteModal.classList.add('hidden'); document.body.style.overflow = ''; } }); }
  if(deleteConfirmBtn){ deleteConfirmBtn.addEventListener('click', async ()=>{
    const id = fId.value;
    const res = await postToApi(API_BASE + '/delete_reservation.php', new URLSearchParams({ id }));
    if(!res.ok){ showToast(res.error || 'Delete failed', 'error', 6000); return; }
    if(deleteModal){ deleteModal.setAttribute('aria-hidden','true'); deleteModal.classList.remove('show'); deleteModal.classList.add('hidden'); document.body.style.overflow = ''; }
    showToast('Reservation deleted', 'success', 3000);
    closeEditModal();
    loadReservations();
  }); }
  // allow Esc to close modal
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){ closeEditModal(); if(deleteModal) { deleteModal.setAttribute('aria-hidden','true'); deleteModal.classList.add('hidden'); } }
  });
  loadReservations();
  // reset filters
  const resetFilters = document.getElementById('resetFilters');
  if(resetFilters) resetFilters.addEventListener('click', ()=>{
    const statusEl = document.getElementById('statusFilter');
    const roomEl = document.getElementById('roomFilter');
    const dateEl = document.getElementById('dateRangeFilter');
    const searchEl = document.getElementById('searchInput');
    if(statusEl) statusEl.value = 'all';
    if(roomEl) roomEl.value = 'all';
    if(dateEl) dateEl.value = 'all';
    if(searchEl) searchEl.value = '';
    const pop = document.getElementById('filterPopover');
    if(pop) pop.setAttribute('aria-hidden', 'true');
    loadReservations();
  });
  // apply filters on change
  const statusFilterEl = document.getElementById('statusFilter');
  const roomFilterEl = document.getElementById('roomFilter');
  const dateFilterEl = document.getElementById('dateRangeFilter');
  if(statusFilterEl) statusFilterEl.addEventListener('change', ()=> loadReservations());
  if(roomFilterEl) roomFilterEl.addEventListener('change', ()=> loadReservations());
  if(dateFilterEl) dateFilterEl.addEventListener('change', ()=> loadReservations());
  // search box - server-side search (the search input is passed as 'search' param to the API)
  const searchInput = document.getElementById('searchInput');
  if(searchInput){
    let searchTimeout=0;
    searchInput.addEventListener('input', ()=>{
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(()=> loadReservations(), 300);
    });
  }
  if(exportBtn){
    exportBtn.addEventListener('click', () => {
      // just tell browser to download CSV from API
      window.location.href = API_BASE + '/export_reservations.php';
    });
  }
});
