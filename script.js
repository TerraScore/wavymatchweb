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

  /* ---- Inside Wavy: continuously-scrolling strip of the 6 real screenshots ---- */
  const track = $("#track");
  if (track) {
    const slides = [
      { src: "assets/showcase-home-feed.jpg", alt: "Wavy home feed showing nearby Events with a 'You're hosting' badge on a Badminton Mixer card", caption: "Your home feed: what's happening nearby, right now" },
      { src: "assets/showcase-pick-a-plan-sheet.jpg", alt: "Wavy 'Pick a Plan' sheet, badminton, bike ride, chai, sutta, drinks, games, pizza and movie activity icons", caption: "Pick a Plan: badminton, chai, drinks, or make up your own" },
      { src: "assets/showcase-plan-invite-bike-ride.jpg", alt: "A Wavy Plan invite: 'Ishita's plan, you in?' with a bike ride icon and a Join the Plan button", caption: "They get the invite instantly, no group chat required" },
      { src: "assets/showcase-venue-ice-treat-cafe.jpg", alt: "A Wavy Spot: Ice Treat Cafe, showing 63 people here and a Play Daily Quiz button", caption: "Drop into a Spot and see who's already there" },
      { src: "assets/showcase-event-badminton-detail.jpg", alt: "A Wavy Event: Badminton Mixer, ₹50 ticket, showing who's here and a Group Chat button", caption: "Hosted Events show who's coming before you show up" },
      { src: "assets/showcase-group-chat.jpg", alt: "A Wavy Group Chat for an Event, with members joining and chatting", caption: "Everyone in the Plan or Event, one group chat" },
    ];
    const all = slides.concat(slides);
    track.innerHTML = all
      .map((s) => `<figure class="screen"><div class="screen__shot"><img src="${s.src}" alt="${s.alt}" loading="lazy" /></div><figcaption class="screen__caption">${s.caption}</figcaption></figure>`)
      .join("");
  }

  /* ---- Spots & Events toggle: bring the relevant screenshot to front ---- */
  const spotsToggleBtns = $$(".spots__toggle-btn");
  const spotsShotEls = $$(".spots__shot");
  const spotsCaption = $("#spotsCaption");
  const spotsCaptions = {
    a: "☕ Ice Treat Cafe · 63 people here right now",
    b: "🏸 Badminton Mixer · Tomorrow, 9 PM · 4 going",
  };
  if (spotsToggleBtns.length && spotsShotEls.length) {
    const selectSpot = (key) => {
      spotsToggleBtns.forEach((b) => {
        const on = b.getAttribute("data-target") === key;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      spotsShotEls.forEach((el) => {
        const on = el.getAttribute("data-key") === key;
        el.classList.toggle("is-front", on);
        el.classList.toggle("is-back", !on);
      });
      if (spotsCaption) spotsCaption.textContent = spotsCaptions[key];
    };
    spotsToggleBtns.forEach((b) => b.addEventListener("click", () => selectSpot(b.getAttribute("data-target"))));
    selectSpot("a");
  }

  /* ---- Plans: sidebar steps + auto-cycling phone demo ---- */
  const stepsEl = $("#steps");
  const planMock = $("#planMock");
  if (stepsEl && planMock) {
    const states = [
      { h: "What are we doing?", chips: ["🏸 Badminton", "☕ Chai", "🎬 Movie"], mockB: "Pick something.", mockS: "Then we'll handle the rest." },
      { h: "When?", chips: ["Now", "In an hour", "Tonight · 8 PM"], mockB: "Pick a time.", mockS: "Whenever works for you." },
      { h: "Where?", chips: ["📍 Blue Tokai, nearby", "📍 Ice Treat Cafe", "📍 Your pick"], mockB: "Pick a spot.", mockS: "We'll drop a pin." },
      { h: "Send it.", chips: ["☕ Chai · Tonight", "One tap. One invite."], mockB: "Send invite", mockS: "No back-and-forth." },
      { h: "They're in.", chips: ["🙋 Count me in!", "You + 4 others"], mockB: "See you there", mockS: "That's the whole thing." },
    ];
    const stepEls = $$(".step", stepsEl);
    let planTimer = null;
    let i = 0;

    const render = () => {
      stepEls.forEach((s, n) => s.classList.toggle("active", n === i));
      const x = states[i];
      planMock.innerHTML =
        `<h3>${x.h}</h3><div class="phone__chips">${x.chips.map((c) => `<span class="phone__chip">${c}</span>`).join("")}</div>` +
        `<div class="phone__mock"><b>${x.mockB}</b><small>${x.mockS}</small></div>`;
    };

    const advancePlan = () => {
      if (reduce) return;
      clearTimeout(planTimer);
      planTimer = setTimeout(() => {
        i = (i + 1) % states.length;
        render();
        advancePlan();
      }, 1000);
    };

    render();

    const planWrap = stepsEl.closest(".live__split") || stepsEl.parentElement;
    if (planWrap) {
      planWrap.addEventListener("mouseenter", () => clearTimeout(planTimer));
      planWrap.addEventListener("mouseleave", advancePlan);
      planWrap.addEventListener("focusin", () => clearTimeout(planTimer));
      planWrap.addEventListener("focusout", advancePlan);
    }
    if (!reduce && "IntersectionObserver" in window) {
      const plio = new IntersectionObserver(
        (entries) => (entries[0].isIntersecting ? advancePlan() : clearTimeout(planTimer)),
        { threshold: 0.4 }
      );
      plio.observe(planWrap || stepsEl);
    }
  }

  /* ---- Live Match demo: auto-playing "screen recording" of all 5 steps ---- */
  const liveDemoCard = $("#liveDemoCard");
  const liveDemoStatus = $("#liveDemoStatus");
  if (liveDemoCard && liveDemoStatus) {
    const demoStates = [
      { state: "tap", status: "Tap in when you're free", delay: 1300 },
      { state: "searching", status: "Finding someone nearby…", delay: 1700 },
      { state: "confirm", status: "You both said yes", delay: 1500 },
      { state: "chat", status: "Chat's open — say hi 👋", delay: 1700 },
      { state: "meet", status: "See you there ☕", delay: 1800 },
    ];
    let demoIndex = 0;
    let demoTimer = null;

    const renderDemo = () => {
      const s = demoStates[demoIndex];
      liveDemoCard.setAttribute("data-state", s.state);
      liveDemoStatus.textContent = s.status;
    };

    const advanceDemo = () => {
      if (reduce) return;
      clearTimeout(demoTimer);
      demoTimer = setTimeout(() => {
        demoIndex = (demoIndex + 1) % demoStates.length;
        renderDemo();
        advanceDemo();
      }, demoStates[demoIndex].delay);
    };

    renderDemo();

    const demoWrap = liveDemoCard.closest(".live-demo") || liveDemoCard;
    demoWrap.addEventListener("mouseenter", () => clearTimeout(demoTimer));
    demoWrap.addEventListener("mouseleave", advanceDemo);
    demoWrap.addEventListener("focusin", () => clearTimeout(demoTimer));
    demoWrap.addEventListener("focusout", advanceDemo);

    if (!reduce && "IntersectionObserver" in window) {
      const ldio = new IntersectionObserver(
        (entries) => (entries[0].isIntersecting ? advanceDemo() : clearTimeout(demoTimer)),
        { threshold: 0.4 }
      );
      ldio.observe(demoWrap);
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
    $$(".shot, .card, .tip").forEach((card) => {
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

/* ---- QR widget dismiss ---- */
(function () {
  var widget = document.getElementById('qrWidget');
  var closeBtn = document.getElementById('qrClose');
  if (!widget || !closeBtn) return;
  if (sessionStorage.getItem('qrDismissed')) {
    widget.classList.add('qr-widget--dismissed');
  }
  closeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    widget.classList.add('qr-widget--dismissed');
    sessionStorage.setItem('qrDismissed', '1');
  });

  /* Step out of the way once the footer (and its social links) scroll into view,
     so the fixed bottom-right widget never sits on top of them. */
  var footer = document.querySelector('.foot');
  if (footer && 'IntersectionObserver' in window) {
    var footerIo = new IntersectionObserver(
      function (entries) {
        widget.classList.toggle('qr-widget--footer-near', entries[0].isIntersecting);
      },
      { rootMargin: '0px 0px -20% 0px' }
    );
    footerIo.observe(footer);
  }
}());
