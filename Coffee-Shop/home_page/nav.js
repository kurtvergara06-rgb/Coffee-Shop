document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".premium-nav");
  if (!nav) return;

  /* =========================
     1) ENTRANCE ANIMATION
     ========================= */
  if (window.gsap) {
    gsap.from(nav, {
      y: -80,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    });
  } else {
    nav.style.opacity = "0";
    nav.style.transform = "translateY(-80px)";
    nav.style.transition = "all 0.8s ease";
    requestAnimationFrame(() => {
      nav.style.opacity = "1";
      nav.style.transform = "translateY(0)";
    });
  }

  /* =========================
     2) HIDE ON SCROLL DOWN
        SHOW ON SCROLL UP
     ========================= */
  let lastY = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentY = window.scrollY;

    if (currentY > lastY && currentY > 80) {
      nav.classList.add("nav-hidden");
    } else {
      nav.classList.remove("nav-hidden");
    }

    lastY = currentY;
  });

  /* =========================
     LINKS (desktop + sidebar)
     ========================= */
  const desktopLinks = document.querySelectorAll(".nav-rounded a");
  const sidebarLinks = document.querySelectorAll(".nav-sidebar-links a");

  /* helper: clear active everywhere */
  function clearActive() {
    desktopLinks.forEach(a => a.classList.remove("active-menu"));
    sidebarLinks.forEach(a => a.classList.remove("active-menu"));
  }

  /* helper: set active by href match */
  function setActiveByHref(matchHref) {
    clearActive();
    [...desktopLinks, ...sidebarLinks].forEach(a => {
      const href = a.getAttribute("href") || "";
      if (href === matchHref) a.classList.add("active-menu");
    });
  }

  /* =========================
     3) SMOOTH SCROLL
     - works only when link has #
     - e.g. href="#about"
     - e.g. href="home.html#about"
     ========================= */
  function attachSmoothScroll(links) {
    links.forEach(link => {
      link.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (!href || !href.includes("#")) return;

        const hash = href.substring(href.indexOf("#")); // "#about"
        const target = document.querySelector(hash);
        if (!target) return;

        // smooth scroll only if target exists on THIS page
        e.preventDefault();
        const navHeight = nav.offsetHeight;
        const top = target.offsetTop - navHeight;

        window.scrollTo({ top, behavior: "smooth" });
        setActiveByHref(href); // highlight clicked anchor
      });
    });
  }

  attachSmoothScroll(desktopLinks);
  attachSmoothScroll(sidebarLinks);

  /* =========================
     4) ACTIVE LINK BY URL
     (ALL PAGES)
     ========================= */
  function setActiveByUrl() {
    const path = location.pathname.split("/").pop(); // "about.html"
    const hash = location.hash;                     // "#about" if any

    clearActive();

    [...desktopLinks, ...sidebarLinks].forEach(a => {
      const href = a.getAttribute("href") || "";

      // match exact page
      if (href === path || href.endsWith("/" + path)) {
        a.classList.add("active-menu");
      }

      // match page+hash or hash-only
      if (hash && (href.endsWith(hash) || href === hash)) {
        a.classList.add("active-menu");
      }
    });
  }

  setActiveByUrl();

  /* =========================
     5) SCROLLSPY (HOME ONLY)
     highlights current section
     ========================= */
  const sectionIds = ["home", "about", "featured", "story"];
  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function setActiveSection(id) {
    clearActive();

    [...desktopLinks, ...sidebarLinks].forEach(a => {
      const href = a.getAttribute("href") || "";
      if (href.endsWith(`#${id}`) || href === `#${id}`) {
        a.classList.add("active-menu");
      }
    });
  }

  function onScrollSpy() {
    if (!sections.length) return; // not home page

    const navH = nav.offsetHeight;
    let current = sections[0].id;

    sections.forEach(sec => {
      const top = sec.offsetTop - navH - 80;
      if (window.scrollY >= top) current = sec.id;
    });

    if (current) setActiveSection(current);
  }

  window.addEventListener("scroll", onScrollSpy);
  onScrollSpy();

  /* =========================
     6) SIDEBAR (TABLET/PHONE)
     ========================= */
  const toggle   = document.getElementById("navToggle");
  const sidebar  = document.getElementById("navSidebar");
  const closeBtn = document.getElementById("navClose");
  const overlay  = document.getElementById("navOverlay");

  if (toggle && sidebar && closeBtn && overlay) {
    function openNav() {
      sidebar.classList.add("active");
      overlay.classList.add("active");
      sidebar.setAttribute("aria-hidden", "false");
    }

    function closeNav() {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
      sidebar.setAttribute("aria-hidden", "true");
    }

    toggle.addEventListener("click", openNav);
    closeBtn.addEventListener("click", closeNav);
    overlay.addEventListener("click", closeNav);

    sidebarLinks.forEach(a => {
      a.addEventListener("click", closeNav);
    });
  }
});
