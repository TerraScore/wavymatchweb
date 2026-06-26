/* ============================================================
   WAVY — interactions
   ============================================================ */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---- year ---- */
  const yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- sticky nav state ---- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- mobile menu ---- */
  const burger = $("#burger");
  const menu = $("#mobileMenu");
  if (burger && menu) {
    const setOpen = (open) => {
      nav.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
    };
    burger.addEventListener("click", () => setOpen(burger.getAttribute("aria-expanded") !== "true"));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
  }

  /* ---- scroll reveal ---- */
  const reveals = $$(".reveal");
  const strike = $(".strike");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
    if (strike) {
      const sio = new IntersectionObserver(
        (ents) => ents.forEach((e) => e.isIntersecting && e.target.classList.add("in-view")),
        { threshold: 0.6 }
      );
      sio.observe(strike);
    }
  } else {
    reveals.forEach((el) => el.classList.add("in-view"));
    if (strike) strike.classList.add("in-view");
  }

  /* ---- count up (0 swipes) ---- */
  const counter = $("[data-count]");
  if (counter && !reduce) {
    const target = 0; // it's the punchline: zero swipes
    const start = 240;
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      const dur = 1100;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        counter.textContent = Math.round(start + (target - start) * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver(
      (e) => e[0].isIntersecting && run(),
      { threshold: 1 }
    );
    cio.observe(counter);
  }

  /* ---- live match demo loop (searching → match → chat) ---- */
  const offer = $("#offerCard");
  const match = $("#matchCard");
  const yesBtn = $("#offerYes");
  const time = $(".appbar__time");

  if (offer && match) {
    let timers = [];
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const wait = (fn, ms) => timers.push(setTimeout(fn, ms));

    const showMatch = () => {
      offer.hidden = true;
      match.hidden = false;
    };
    const reset = () => {
      match.hidden = true;
      offer.hidden = false;
      // re-trigger card entrance animation
      offer.style.animation = "none";
      // eslint-disable-next-line no-unused-expressions
      offer.offsetHeight;
      offer.style.animation = "";
    };

    const cycle = () => {
      clear();
      reset();
      wait(showMatch, 2600);   // auto "both say yes"
      wait(cycle, 7200);       // loop back to a fresh offer
    };

    // let users trigger it themselves too
    if (yesBtn) {
      yesBtn.addEventListener("click", () => { clear(); showMatch(); wait(cycle, 4600); });
    }

    // ticking timer in the status bar for liveliness
    if (time && !reduce) {
      let s = 8;
      setInterval(() => {
        s = (s + 1) % 60;
        time.textContent = "0:" + String(s).padStart(2, "0");
      }, 1000);
    }

    if (!reduce) {
      // start only when hero is on screen
      const hio = new IntersectionObserver(
        (e) => {
          if (e[0].isIntersecting) { cycle(); }
          else { clear(); reset(); }
        },
        { threshold: 0.3 }
      );
      hio.observe(offer.closest(".phone"));
    }
  }

  /* ---- form submissions → Web3Forms (emails each submission to you) ---- */
  const ERR = "Something went wrong — please try again, or email support@wavydating.com.";
  const postForm = (f) =>
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(f),
    }).then((r) => r.json());

  const withButton = (f, busyText) => {
    const btn = $('button[type="submit"]', f);
    const label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = busyText; }
    return () => { if (btn) { btn.disabled = false; btn.textContent = label; } };
  };

  /* waitlist form (home CTA) */
  const form = $("#waitlistForm");
  const msg = $("#waitMsg");
  if (form && msg) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#email", form);
      const val = (input.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        msg.textContent = "Please enter a valid email address.";
        msg.className = "waitlist__msg err";
        input.focus();
        return;
      }
      msg.textContent = "";
      msg.className = "waitlist__msg";
      const restore = withButton(form, "Joining…");
      postForm(form)
        .then((data) => {
          if (!data || !data.success) throw new Error();
          msg.textContent = "You're on the list! We'll be in touch when Wavy goes live near you. 🌊";
          msg.className = "waitlist__msg ok";
          form.reset();
        })
        .catch(() => { msg.textContent = ERR; msg.className = "waitlist__msg err"; })
        .finally(restore);
    });
  }

  /* inner-page forms (careers / support / early-access waitlist) */
  $$("form.jsform").forEach((f) => {
    const note = $(".form__msg", f);
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      if (note) { note.textContent = ""; note.className = "form__msg"; }
      const restore = withButton(f, "Sending…");
      postForm(f)
        .then((data) => {
          if (!data || !data.success) throw new Error();
          if (note) {
            note.textContent = f.getAttribute("data-success") || "Thank you! Your submission has been received.";
            note.className = "form__msg ok";
          }
          f.reset();
        })
        .catch(() => { if (note) { note.textContent = ERR; note.className = "form__msg err"; } })
        .finally(restore);
    });
  });

  /* ---- scroll progress bar ---- */
  const prog = document.createElement("div");
  prog.className = "scroll-progress";
  prog.setAttribute("aria-hidden", "true");
  prog.innerHTML = "<span></span>";
  document.body.appendChild(prog);
  const progBar = prog.firstChild;
  const updateProg = () => {
    const el = document.documentElement;
    const max = el.scrollHeight - el.clientHeight;
    progBar.style.transform = "scaleX(" + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ")";
  };
  updateProg();
  window.addEventListener("scroll", updateProg, { passive: true });
  window.addEventListener("resize", updateProg);

  /* ---- scroll-spy: highlight nav link for the section in view ---- */
  const navLinks = $$('.nav__links a[href*="#"]');
  const spyMap = navLinks
    .map((a) => {
      const id = (a.getAttribute("href").split("#")[1] || "");
      const sec = id && document.getElementById(id);
      return sec ? { a, id, sec } : null;
    })
    .filter(Boolean);
  if (spyMap.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href").endsWith("#" + e.target.id)));
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    spyMap.forEach((m) => spy.observe(m.sec));
  }

  const finePointer = window.matchMedia("(pointer:fine)").matches;

  /* ---- magnetic large buttons ---- */
  if (!reduce && finePointer) {
    $$(".btn--lg").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + mx * 0.22 + "px," + (my * 0.34 - 2) + "px)";
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---- 3D tilt cards ---- */
  if (!reduce && finePointer) {
    $$(".shot, .step, .tip").forEach((card) => {
      card.addEventListener("mouseenter", () => { card.style.transition = "transform .12s ease-out, box-shadow .3s"; });
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-py * 7) + "deg) rotateY(" + (px * 9) + "deg) translateY(-6px)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform .5s var(--ease), box-shadow .3s";
        card.style.transform = "";
      });
    });
  }

  /* ---- hero mouse parallax (uses CSS translate so it composes with float animations) ---- */
  const heroEl = $(".hero");
  if (heroEl && !reduce && finePointer) {
    const layers = [[$(".orb--rose"), 34], [$(".orb--blue"), 22], [$(".radar"), 18], [$(".phone"), -12]].filter((l) => l[0]);
    heroEl.addEventListener("mousemove", (e) => {
      const r = heroEl.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach(([el, d]) => { el.style.translate = cx * d + "px " + cy * d + "px"; });
    });
    heroEl.addEventListener("mouseleave", () => layers.forEach(([el]) => { el.style.translate = ""; }));
  }

  /* ---- interactive Join Spot (adds you to the people list) ---- */
  const joinBtn = $("#joinSpotBtn");
  if (joinBtn) {
    const people = $("#spotPeople");
    const moreChip = $("#spotMore");
    const countEl = $("#spotCount");
    const BASE = 128;
    const NAMED = 4;
    let joined = false;
    const render = () => {
      const count = BASE + (joined ? 1 : 0);
      const shown = NAMED + (joined ? 1 : 0);
      if (countEl) countEl.textContent = count;
      if (moreChip) moreChip.textContent = "+" + (count - shown);
      joinBtn.textContent = joined ? "Joined ✓ · Leave Spot" : "Join this Spot";
      joinBtn.classList.toggle("is-joined", joined);
      joinBtn.setAttribute("aria-pressed", String(joined));
    };
    joinBtn.addEventListener("click", () => {
      joined = !joined;
      if (joined) {
        const you = document.createElement("span");
        you.className = "ava ava--you" + (reduce ? "" : " ava--in");
        you.id = "spotYou";
        you.textContent = "You";
        if (people && moreChip) people.insertBefore(you, moreChip);
      } else {
        const you = $("#spotYou");
        if (you) you.remove();
      }
      render();
    });
  }

  /* ---- background video: play only while visible, honour reduced-motion ---- */
  $$("video.cta__video, video.hero__video").forEach((v) => {
    if (reduce) {
      v.removeAttribute("autoplay");
      try { v.pause(); } catch (e) { /* noop */ }
      return;
    }
    const play = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    if ("IntersectionObserver" in window) {
      const vio = new IntersectionObserver(
        (es) => es.forEach((e) => (e.isIntersecting ? play() : v.pause())),
        { threshold: 0.12 }
      );
      vio.observe(v);
    } else {
      play();
    }
  });

  /* ---- smooth anchor scroll with nav offset (fallback for older browsers) ---- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const tgt = document.querySelector(id);
      if (!tgt) return;
      e.preventDefault();
      const top = tgt.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
      history.replaceState(null, "", id);
    });
  });
})();
