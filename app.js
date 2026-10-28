(() => {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const dotsEl = document.getElementById("dots");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const barFill = document.getElementById("barFill");
  const deck = document.getElementById("deck");
  const total = slides.length;
  let index = 0;
  let animTimer = null;
  let touching = false;
  let touchX = 0;

  /* Build dots */
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dot-btn" + (i === 0 ? " is-active" : "");
    b.setAttribute("aria-label", `第 ${i + 1} 頁`);
    b.addEventListener("click", () => go(i));
    dotsEl.appendChild(b);
  });
  const dots = Array.from(dotsEl.children);

  function animateRing(slide) {
    const ring = slide.querySelector(".ring-fill");
    const pct = slide.querySelector(".ring-pct");
    if (!ring || !pct) return;

    const target = parseFloat(ring.dataset.target || "0.75");
    const circ = 2 * Math.PI * 82;
    ring.style.strokeDasharray = String(circ);
    ring.style.strokeDashoffset = String(circ);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ring.style.strokeDashoffset = String(circ * (1 - target));
      });
    });

    const goal = parseInt(pct.dataset.count || "75", 10);
    const start = performance.now();
    const dur = 1800;
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      pct.textContent = String(Math.round(goal * eased));
      if (t < 1) requestAnimationFrame(tick);
    }
    pct.textContent = "0";
    requestAnimationFrame(tick);
  }

  function playEntrance(slide) {
    slide.classList.remove("settled", "animating");
    /* Force reflow so animation restarts */
    void slide.offsetWidth;
    slide.classList.add("animating");

    if (animTimer) clearTimeout(animTimer);
    /* Entrance window ~2.8–3.2s then settle for ambient only */
    animTimer = setTimeout(() => {
      slide.classList.remove("animating");
      slide.classList.add("settled");
    }, 3200);

    if (slide.dataset.slide === "0") {
      /* delay ring so it syncs with card stagger */
      setTimeout(() => animateRing(slide), 900);
    }
  }

  function go(n, opts = {}) {
    const next = Math.max(0, Math.min(total - 1, n));
    if (next === index && !opts.force) return;

    slides[index].classList.remove("is-active", "animating", "settled");
    index = next;
    slides[index].classList.add("is-active");
    playEntrance(slides[index]);

    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    barFill.style.width = `${((index + 1) / total) * 100}%`;
  }

  prevBtn.addEventListener("click", () => go(index - 1));
  nextBtn.addEventListener("click", () => go(index + 1));

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      go(total - 1);
    } else if (e.key === "f" || e.key === "F") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  });

  /* Click on empty slide area advances (not on cards/buttons) */
  slides.forEach((slide) => {
    slide.addEventListener("click", (e) => {
      if (e.target.closest("button, a, .nav")) return;
      if (e.clientX > window.innerWidth * 0.55) go(index + 1);
      else if (e.clientX < window.innerWidth * 0.45) go(index - 1);
    });
  });

  deck.addEventListener(
    "touchstart",
    (e) => {
      touching = true;
      touchX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  deck.addEventListener(
    "touchend",
    (e) => {
      if (!touching) return;
      touching = false;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) < 50) return;
      if (dx < 0) go(index + 1);
      else go(index - 1);
    },
    { passive: true }
  );

  /* Prefer reduced motion: skip long entrance */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    slides.forEach((s) => s.classList.add("settled"));
  }

  go(0, { force: true });
  deck.focus({ preventScroll: true });
})();
