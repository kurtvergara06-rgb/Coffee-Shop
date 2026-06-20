// booking.datepicker.js
flatpickr("#date", {
  altInput: true,
  altFormat: "F j, Y",
  dateFormat: "Y-m-d",
  minDate: "today",
  disableMobile: true,
  onChange: function(selectedDates, dateStr, instance) {
    // Trigger estimate update when date changes
    if (window.runAutoEstimate) {
      setTimeout(() => window.runAutoEstimate(), 50);
    }
  }
});
