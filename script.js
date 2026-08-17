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

  /* ---- Showcase carousel: all 8 real screenshots, arrows + dots + keyboard + swipe + autoplay ---- */
  const carShotImg = $("#carShotImg");
  const carCaption = $("#carCaption");
  const carDots = $("#carDots");
  const carPrev = $("#carPrev");
  const carNext = $("#carNext");
  if (carShotImg && carDots && carPrev && carNext) {
    const slides = [
      { src: "assets/showcase-home-feed.jpg", alt: "Wavy home feed showing nearby Events with a 'You're hosting' badge on a Badminton Mixer card", caption: "Your home feed: what's happening nearby, right now" },
      { src: "assets/showcase-pick-a-plan-sheet.jpg", alt: "Wavy 'Pick a Plan' sheet, badminton, bike ride, chai, sutta, drinks, games, pizza and movie activity icons", caption: "Pick a Plan: badminton, chai, drinks, or make up your own" },
      { src: "assets/showcase-plan-invite-bike-ride.jpg", alt: "A Wavy Plan invite: 'Ishita's plan, you in?' with a bike ride icon and a Join the Plan button", caption: "They get the invite instantly, no group chat required" },
      { src: "assets/showcase-venue-ice-treat-cafe.jpg", alt: "A Wavy Spot: Ice Treat Cafe, showing 63 people here and a Play Daily Quiz button", caption: "Drop into a Spot and see who's already there" },
      { src: "assets/showcase-event-badminton-detail.jpg", alt: "A Wavy Event: Badminton Mixer, ₹50 ticket, showing who's here and a Group Chat button", caption: "Hosted Events show who's coming before you show up" },
      { src: "assets/showcase-group-chat.jpg", alt: "A Wavy Group Chat for an Event, with members joining and chatting", caption: "Everyone in the Plan or Event, one group chat" },
    ];
    let carIndex = 0;
    let carTimer = null;

    carDots.innerHTML = slides
      .map((s, i) => `<button type="button" class="carousel__dot${i === 0 ? " is-active" : ""}" role="tab" aria-label="Screenshot ${i + 1} of ${slides.length}" aria-selected="${i === 0}"></button>`)
      .join("");
    const dotEls = $$(".carousel__dot", carDots);

    const renderSlide = (i, instant) => {
      const s = slides[i];
      const apply = () => {
        carShotImg.setAttribute("src", s.src);
        carShotImg.setAttribute("alt", s.alt);
        carShotImg.classList.remove("is-swapping");
      };
      if (reduce || instant) { apply(); }
      else {
        carShotImg.classList.add("is-swapping");
        setTimeout(apply, 200);
      }
      if (carCaption) carCaption.textContent = s.caption;
      dotEls.forEach((d, di) => {
        d.classList.toggle("is-active", di === i);
        d.setAttribute("aria-selected", String(di === i));
      });
    };

    const goTo = (i) => {
      carIndex = (i + slides.length) % slides.length;
      renderSlide(carIndex);
    };

    carPrev.addEventListener("click", () => { goTo(carIndex - 1); restartCarAutoplay(); });
    carNext.addEventListener("click", () => { goTo(carIndex + 1); restartCarAutoplay(); });
    dotEls.forEach((d, i) => d.addEventListener("click", () => { goTo(i); restartCarAutoplay(); }));

    const carousel = $(".carousel");
    carousel.setAttribute("tabindex", "0");
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(carIndex - 1); restartCarAutoplay(); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(carIndex + 1); restartCarAutoplay(); }
    });

    /* touch swipe */
    let touchX = null;
    const stage = $(".carousel__shot");
    stage.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) { dx > 0 ? goTo(carIndex - 1) : goTo(carIndex + 1); restartCarAutoplay(); }
      touchX = null;
    });

    function restartCarAutoplay() {
      if (reduce) return;
      clearInterval(carTimer);
      carTimer = setInterval(() => goTo(carIndex + 1), 4500);
    }
    if (!reduce && "IntersectionObserver" in window) {
      const cio = new IntersectionObserver(
        (e) => (e[0].isIntersecting ? restartCarAutoplay() : clearInterval(carTimer)),
        { threshold: 0.4 }
      );
      cio.observe(carousel);
    }
    carousel.addEventListener("mouseenter", () => clearInterval(carTimer));
    carousel.addEventListener("mouseleave", () => restartCarAutoplay());
    carousel.addEventListener("focusin", () => clearInterval(carTimer));
    carousel.addEventListener("focusout", () => restartCarAutoplay());
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

  /* ---- Why compare: swipe button (goes nowhere) vs Send Plan button (actually works) ---- */
  const swipeBtn = $("#swipeBtn");
  const facegrid = $("#facegrid");
  const swipeNote = $("#swipeNote");
  if (swipeBtn && facegrid && swipeNote) {
    const swipeLines = [
      "Hundreds of faces. Endless swiping. Zero actual plans.",
      "Nope. Still nothing.",
      "That's 200 swipes now. Still no plans.",
      "Honestly, impressive commitment to going nowhere.",
    ];
    let swipeCount = 0;
    swipeBtn.addEventListener("click", () => {
      swipeCount++;
      if (!reduce) {
        facegrid.classList.remove("is-shaking");
        void facegrid.offsetWidth;
        facegrid.classList.add("is-shaking");
      }
      swipeNote.textContent = swipeLines[Math.min(swipeCount, swipeLines.length - 1)];
    });
  }

  const sendPlanBtn = $("#sendPlanBtn");
  const sendPlanNote = $("#sendPlanNote");
  const sendPlanReplies = $("#plansendReplies");
  if (sendPlanBtn && sendPlanNote) {
    const defaultLabel = "Send Plan";
    const defaultNote = sendPlanNote.textContent;
    const label = $(".plansend__btn-label", sendPlanBtn);
    let sendTimer = null;
    sendPlanBtn.addEventListener("click", () => {
      clearTimeout(sendTimer);
      sendPlanBtn.classList.add("is-sent");
      sendPlanBtn.disabled = true;
      if (label) label.textContent = "Sent";
      sendPlanNote.textContent = "Sent. Someone already said yes.";
      if (sendPlanReplies) sendPlanReplies.classList.add("is-visible");
      sendTimer = setTimeout(() => {
        sendPlanBtn.classList.remove("is-sent");
        sendPlanBtn.disabled = false;
        if (label) label.textContent = defaultLabel;
        sendPlanNote.textContent = defaultNote;
        if (sendPlanReplies) sendPlanReplies.classList.remove("is-visible");
      }, 2600);
    });
  }

  /* ---- Plan builder: custom activity -> time -> spot -> send -> payoff wizard ---- */
  const planBuilder = $("#planBuilder");
  if (planBuilder) {
    const panels = $$(".plan-builder__panel", planBuilder);
    const dots = $$(".plan-builder__dot", planBuilder);
    const summary = $("#pbSummary");
    const spotInput = $("#pbSpotInput");
    const sendBtn = $("#pbSendBtn");
    const restartBtn = $("#pbRestartBtn");
    let state = { activity: "", emoji: "", time: "", spot: "" };
    let step = 0;

    const goToStep = (i) => {
      step = Math.max(0, Math.min(i, panels.length - 1));
      panels.forEach((p) => p.classList.toggle("is-active", Number(p.getAttribute("data-step")) === step));
      dots.forEach((d, di) => d.classList.toggle("is-active", di === step));
    };

    const updateSummary = () => {
      if (!summary) return;
      const parts = [`${state.emoji} ${state.activity}`.trim(), state.time, state.spot].filter(Boolean);
      summary.textContent = parts.length ? parts.join(" · ") : "Pick an activity, a time, and a spot.";
    };

    const selectChip = (group, chip, mutate) => {
      $$(".plan-builder__chip", group).forEach((c) => c.classList.remove("is-selected"));
      chip.classList.add("is-selected");
      mutate();
      updateSummary();
      setTimeout(() => goToStep(step + 1), reduce ? 0 : 300);
    };

    const activityGroup = $("#pbActivities");
    if (activityGroup) {
      $$(".plan-builder__chip", activityGroup).forEach((chip) => {
        chip.addEventListener("click", () => selectChip(activityGroup, chip, () => {
          state.activity = chip.getAttribute("data-value");
          state.emoji = $(".plan-builder__emoji", chip)?.textContent || "";
        }));
      });
    }

    const timeGroup = $("#pbTimes");
    if (timeGroup) {
      $$(".plan-builder__chip", timeGroup).forEach((chip) => {
        chip.addEventListener("click", () => selectChip(timeGroup, chip, () => { state.time = chip.getAttribute("data-value"); }));
      });
    }

    const spotGroup = $("#pbSpots");
    if (spotGroup) {
      $$(".plan-builder__chip", spotGroup).forEach((chip) => {
        chip.addEventListener("click", () => selectChip(spotGroup, chip, () => {
          state.spot = chip.getAttribute("data-value");
          if (spotInput) spotInput.value = "";
        }));
      });
    }
    if (spotInput) {
      spotInput.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" || !spotInput.value.trim()) return;
        e.preventDefault();
        if (spotGroup) $$(".plan-builder__chip", spotGroup).forEach((c) => c.classList.remove("is-selected"));
        state.spot = spotInput.value.trim();
        updateSummary();
        setTimeout(() => goToStep(step + 1), reduce ? 0 : 200);
      });
    }

    $$("[data-back]", planBuilder).forEach((b) => b.addEventListener("click", () => goToStep(step - 1)));

    if (sendBtn) {
      sendBtn.addEventListener("click", () => {
        sendBtn.disabled = true;
        const label = sendBtn.textContent;
        sendBtn.textContent = "Sending…";
        setTimeout(() => {
          goToStep(4);
          sendBtn.disabled = false;
          sendBtn.textContent = label;
        }, reduce ? 50 : 700);
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        state = { activity: "", emoji: "", time: "", spot: "" };
        $$(".plan-builder__chip", planBuilder).forEach((c) => c.classList.remove("is-selected"));
        if (spotInput) spotInput.value = "";
        updateSummary();
        goToStep(0);
      });
    }

    updateSummary();
  }

  /* ---- Live Match demo: click "Tap in" → searching → matched → chat ---- */
  const liveDemoCard = $("#liveDemoCard");
  const liveDemoBtn = $("#liveDemoBtn");
  const liveDemoStatus = $("#liveDemoStatus");
  if (liveDemoCard && liveDemoBtn && liveDemoStatus) {
    let demoTimers = [];
    const clearDemo = () => { demoTimers.forEach(clearTimeout); demoTimers = []; };
    const wait = (fn, ms) => demoTimers.push(setTimeout(fn, ms));

    const setState = (state, status) => {
      liveDemoCard.setAttribute("data-state", state);
      liveDemoStatus.textContent = status;
    };

    const runDemo = () => {
      clearDemo();
      liveDemoBtn.disabled = true;
      liveDemoBtn.textContent = "Finding someone…";
      setState("searching", "Finding someone nearby…");
      wait(() => {
        setState("matched", "Matched! Say hi 👋");
        liveDemoBtn.disabled = false;
        liveDemoBtn.textContent = "Tap in again";
      }, reduce ? 50 : 1500);
    };

    liveDemoBtn.addEventListener("click", runDemo);
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
    const layers = [[$(".orb--rose"), 34], [$(".orb--blue"), 22], [$(".hero__shot"), -10]].filter((l) => l[0]);
    heroEl.addEventListener("mousemove", (e) => {
      const r = heroEl.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach(([el, d]) => { el.style.translate = cx * d + "px " + cy * d + "px"; });
    });
    heroEl.addEventListener("mouseleave", () => layers.forEach(([el]) => { el.style.translate = ""; }));
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
