// file/availableroom.js
document.addEventListener("DOMContentLoaded", () => {
  const preReserveCard = document.getElementById("preReserveCard");
  const bookingCard = document.getElementById("bookingCard");
  const openBookingBtn = document.getElementById("openBookingBtn");

  // safety check so nothing breaks if elements are missing
  if (!preReserveCard || !bookingCard || !openBookingBtn) return;

  openBookingBtn.addEventListener("click", () => {
    preReserveCard.classList.add("is-hidden");   // hide step 1
    bookingCard.classList.remove("is-hidden");   // show step 2
    bookingCard.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
