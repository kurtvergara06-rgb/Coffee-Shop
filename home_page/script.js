/* -------------------------------
   NAVIGATION + CART + SEARCH
--------------------------------*/
/* -------------------------------
   NAVIGATION + CART + SEARCH
--------------------------------*/
let navigation = document.querySelector('.navigation');
let cartItem = document.querySelector('.cart-items-container');
let searchForm = document.querySelector('.search-form');

const menuBtn = document.querySelector('#menu-btn');
const cartBtn = document.querySelector('#cart-btn');
const searchBtn = document.querySelector('#search-btn');

menuBtn && (menuBtn.onclick = () => {
    navigation && navigation.classList.toggle('active');
    cartItem && cartItem.classList.remove('active');
    searchForm && searchForm.classList.remove('active');
});

cartBtn && (cartBtn.onclick = () => {
    cartItem && cartItem.classList.toggle('active');
    navigation && navigation.classList.remove('active');
    searchForm && searchForm.classList.remove('active');
});

searchBtn && (searchBtn.onclick = () => {
    searchForm && searchForm.classList.toggle('active');
    navigation && navigation.classList.remove('active');
    cartItem && cartItem.classList.remove('active');
});

window.onscroll = () => {
    navigation && navigation.classList.remove('active');
    cartItem && cartItem.classList.remove('active');
    searchForm && searchForm.classList.remove('active');
};



/* -------------------------------
          ADD TO CART
--------------------------------*/
function addToCart(imageSrc, itemName, price) {
    var cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    var removeButton = document.createElement("span");
    removeButton.className = "fas fa-times";
    removeButton.onclick = function () {
        cartItem.remove();
        updateCheckoutButtonVisibility();
    };
    cartItem.appendChild(removeButton);

    var itemImage = document.createElement("img");
    itemImage.src = imageSrc;
    itemImage.alt = itemName;
    cartItem.appendChild(itemImage);

    var contentDiv = document.createElement("div");
    contentDiv.className = "content";

    var itemNameHeader = document.createElement("h3");
    itemNameHeader.textContent = itemName;
    contentDiv.appendChild(itemNameHeader);

    var priceDiv = document.createElement("div");
    priceDiv.className = "price";
    priceDiv.textContent = price + "/-";
    contentDiv.appendChild(priceDiv);

    var quantityInput = document.createElement("input");
    quantityInput.className = "input";
    quantityInput.type = "number";
    quantityInput.value = "1";
    quantityInput.min = "1";
    contentDiv.appendChild(quantityInput);

    cartItem.appendChild(contentDiv);

    document.querySelector(".cart-items-container").appendChild(cartItem);

    updateCheckoutButtonVisibility();
}


/* -------------------------------
   CHECKOUT BUTTON VISIBILITY
--------------------------------*/
function updateCheckoutButtonVisibility() {
    var cartItemsContainer = document.querySelector(".cart-items-container");
    var cartItems = cartItemsContainer.querySelectorAll(".cart-item");

    var checkoutButton = document.querySelector(".checkout-button");
    if (checkoutButton) checkoutButton.remove();

    if (cartItems.length > 0) {
        var container = document.createElement("div");
        container.className = "checkout-button-container";

        var button = document.createElement("button");
        button.className = "checkout-button btn";
        button.textContent = "Check Out";
        button.onclick = function () {
            alert("Checking out!");
        };

        container.appendChild(button);
        cartItemsContainer.appendChild(container);
    }
}

// ================= SHOP COLLECTION CAROUSEL =================
// ================= SHOP COLLECTION CAROUSEL (LABELS MOVE WITH CARDS) =================
// ================= SHOP COLLECTION CAROUSEL (TRUE INFINITE, NO AUTOPLAY, CENTER LOCKED) =================
// ================= SHOP COLLECTION CAROUSEL (TRUE INFINITE, NO FLICK, NO AUTOPLAY) =================
// =============================
// SHOP COLLECTION — POLISHED REDO
// infinite, smooth, no flicker
// =============================
(function(){
  const track = document.getElementById("shopTrack");
  const viewport = document.querySelector(".shop-viewport");
  const prevBtn = document.getElementById("shopPrev");
  const nextBtn = document.getElementById("shopNext");
  if(!track || !viewport) return;

  const originals = [...track.querySelectorAll(".shop-card")];
  const n = originals.length;
  if(n < 2) return;

  // Clone head + tail for seamless loop
  originals.forEach(c => track.appendChild(c.cloneNode(true)));
  originals.forEach(c => track.appendChild(c.cloneNode(true)));

  let cards = [...track.querySelectorAll(".shop-card")];

  let active = n;               // start in middle set
  let step = 0;                 // distance between card centers
  let baseW = 0;
  let animating = false;

  function measure(){
    // remove state so we measure base sizes
    cards.forEach(c => c.classList.remove("is-active","is-side"));

    const a = cards[n];
    const b = cards[n+1];
    if(!a || !b) return;

    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();

    baseW = ra.width;
    step  = rb.left - ra.left;
  }

  function setClasses(){
    cards.forEach((c,i)=>{
      c.classList.remove("is-active","is-side");
      if(i === active) c.classList.add("is-active");
      else c.classList.add("is-side");
    });
  }

  function center(index, withAnim=true){
    if(!step) measure();

    track.style.transition = withAnim
      ? "transform 750ms cubic-bezier(.22,.61,.36,1)"
      : "none";

    const vpCenter = viewport.getBoundingClientRect().width / 2;
    const cardCenter = (index * step) + baseW/2;
    track.style.transform = `translateX(${vpCenter - cardCenter}px)`;
  }

  function snapIfNeeded(){
    // right overflow
    if(active >= n*2){
      active -= n;
      setClasses();
      center(active,false);
    }
    // left overflow
    if(active < n){
      active += n;
      setClasses();
      center(active,false);
    }
  }

  function update(withAnim=true){
    setClasses();
    center(active, withAnim);
    animating = withAnim;
  }

  function next(){
    if(animating) return;
    active++;
    update(true);
  }
  function prev(){
    if(animating) return;
    active--;
    update(true);
  }

  nextBtn?.addEventListener("click", next);
  prevBtn?.addEventListener("click", prev);

  // finish anim -> snap if clone edge
  track.addEventListener("transitionend", (e)=>{
    if(e.propertyName !== "transform") return;
    animating = false;
    snapIfNeeded();
  });

  // keyboard support
  window.addEventListener("keydown",(e)=>{
    if(e.key==="ArrowRight") next();
    if(e.key==="ArrowLeft") prev();
  });

  // swipe support
  let startX = 0;
  viewport.addEventListener("touchstart",(e)=>{
    startX = e.touches[0].clientX;
  },{passive:true});
  viewport.addEventListener("touchend",(e)=>{
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if(Math.abs(diff) > 40){
      diff < 0 ? next() : prev();
    }
  });

  window.addEventListener("resize", ()=>{
    measure();
    update(false);
  });

  window.addEventListener("load", ()=>{
    measure();
    update(false);
  });

})();
