function initTimeDropdown(inputId, dropdownId, hourId, minId, ampmId, setBtnId) {

  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  const hour = document.getElementById(hourId);
  const min = document.getElementById(minId);
  const ampm = document.getElementById(ampmId);
  const setBtn = document.getElementById(setBtnId);

  // populate hour list
  for(let h=1; h<=12; h++){
    const opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h;
    hour.appendChild(opt);
  }

  // populate minutes
  for(let m=0; m<60; m++){
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m.toString().padStart(2, '0');
    min.appendChild(opt);
  }

  // open
  input.addEventListener('click', () => {
    dropdown.style.display = 'flex';
    dropdown.style.flexDirection = 'row';
    dropdown.style.gap = '6px';
  });

  // set button
  setBtn.addEventListener('click', () => {
    const val = `${hour.value}:${min.value.padStart(2,'0')} ${ampm.value}`;
    input.value = val;
    dropdown.style.display = 'none';
    // Trigger estimate update when time is set
    if (window.runAutoEstimate) {
      window.runAutoEstimate();
    }
  });

  // close when clicking outside
  document.addEventListener('click', (e) => {
    if(!dropdown.contains(e.target) &&
       e.target !== input &&
       !input.nextElementSibling.contains(e.target)){
      dropdown.style.display = 'none';
    }
  });
}

// init both
initTimeDropdown('startTime','startTimeDropdown','startHour','startMinute','startAmPm','startTimeSet');
initTimeDropdown('endTime','endTimeDropdown','endHour','endMinute','endAmPm','endTimeSet');
