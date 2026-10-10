/* DAX SOLAR — main.js
 * Vanilla JS + GSAP/ScrollTrigger + Lenis.
 * Features: Lenis smooth scroll, GSAP preloader & hero expand, scroll parallax,
 * word-by-word scrub reveal, split heading reveals, staggered bento & card animations,
 * stat count-up, horizontal pinned process scroll, animated FAQ accordion, interactive cursor. */

const CONFIG = {
  WHATSAPP_NUMBER: "919825014820",
  PHONE_TEL: "+919825014820",
  PHONE_DISPLAY: "+91 98250 14820",
  EMAIL: "contact@daxsolar.in",
  FORM_ENDPOINT: "", // Empty = opens WhatsApp with prefilled lead details
  VIDEO_URL: "https://www.youtube.com/watch?v=0hbbkH6g_zE",
  WA_MESSAGE: "Hi Dax Solar, I want a free site survey",

  // Calculator constants
  UNITS_PER_KW_PER_MONTH: 120, // kWh generated per kWp per month in Gujarat
  TARIFF: 8,                   // ₹ per unit average
  ROOF_SQFT_PER_KWP: 100,      // sq ft of roof per kWp

  // Real verified solar stats
  STATS: { mw: 48, projects: 650, warranty: 25, reduction: 85 },
  HERO_STATS: { reduction: 85, offset: 92 }
};

(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lenis = null;
  var hasGsap = false;

  /* ---------- CONFIG → DOM ---------- */
  function applyConfig() {
    var wa = $("#waLink");
    if (wa) wa.href = "https://wa.me/" + CONFIG.WHATSAPP_NUMBER + "?text=" + encodeURIComponent(CONFIG.WA_MESSAGE);
    var tel = $("#telLink");
    if (tel) { tel.href = "tel:" + CONFIG.PHONE_TEL; }
    var mail = $("#mailLink");
    if (mail) mail.href = "mailto:" + CONFIG.EMAIL;

    $$("[data-stat]").forEach(function (el) {
      var v = CONFIG.STATS[el.dataset.stat];
      if (v !== null && v !== undefined) {
        el.dataset.count = v;
        el.textContent = fmt(v);
      }
    });
    $$("[data-hero-stat]").forEach(function (el) {
      var v = CONFIG.HERO_STATS[el.dataset.heroStat];
      if (v !== null && v !== undefined) {
        el.dataset.count = v;
        el.textContent = fmt(v);
        el.dataset.bar = v;
      }
    });
  }
  function fmt(n) { return Number(n).toLocaleString("en-IN", { maximumFractionDigits: 1 }); }

  /* ---------- Scroll helpers ---------- */
  function stopScroll() { if (lenis) lenis.stop(); document.body.style.overflow = "hidden"; }
  function startScroll() { if (lenis) lenis.start(); document.body.style.overflow = ""; }

  /* ---------- Menu ---------- */
  function initMenu() {
    var btn = $("#menuBtn"), menu = $("#mobileMenu");
    if (!btn || !menu) return;
    var open = false;
    function setOpen(v) {
      open = v;
      btn.setAttribute("aria-expanded", String(v));
      btn.setAttribute("aria-label", v ? "Close menu" : "Open menu");
      if (v) {
        menu.hidden = false;
        requestAnimationFrame(function () { menu.classList.add("is-open"); });
        stopScroll();
        var first = $("a", menu); if (first) first.focus();
      } else {
        menu.classList.remove("is-open");
        startScroll();
        setTimeout(function () { if (!open) menu.hidden = true; }, 650);
      }
    }
    btn.addEventListener("click", function () { setOpen(!open); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) {
      if (!open) return;
      if (e.key === "Escape") { setOpen(false); btn.focus(); return; }
      if (e.key === "Tab") {
        var f = $$("a, button", menu).concat([btn]);
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener("resize", function () { if (open && window.innerWidth >= 1024) setOpen(false); });
  }

  /* ---------- Language toggle (EN / ગુજરાતી) ---------- */
  function initLang() {
    var btn = $("#langBtn");
    if (!btn) return;
    function apply(gu) {
      $$("[data-gu]").forEach(function (el) {
        if (!el.dataset.en) el.dataset.en = el.textContent;
        el.textContent = gu ? el.dataset.gu : el.dataset.en;
      });
      root.lang = gu ? "gu" : "en";
      btn.setAttribute("aria-label", gu ? "Switch language to English" : "Switch language to Gujarati");
      try { localStorage.setItem("dax-lang", gu ? "gu" : "en"); } catch (e) {}
    }
    btn.addEventListener("click", function () { apply(root.lang !== "gu"); });
    try { if (localStorage.getItem("dax-lang") === "gu") apply(true); } catch (e) {}
  }

  /* ---------- Nav active state ---------- */
  function initNavActive() {
    var links = $$(".nav-links a");
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove("is-active"); });
          map[en.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Services slider ---------- */
  function initServices() {
    var cards = $$(".svc-card"), prev = $("#svcPrev"), next = $("#svcNext");
    var fill = $("#railFill"), count = $("#svcCount"), stage = $(".svc-stage");
    if (!cards.length) return;
    var idx = 0, n = cards.length;
    if (fill) fill.style.height = (100 / n) + "%";
    function show(i) {
      idx = (i + n) % n;
      cards.forEach(function (c, k) {
        var on = k === idx;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-hidden", on ? "false" : "true");
        c.setAttribute("role", "group");
        c.setAttribute("aria-roledescription", "slide");
        c.setAttribute("aria-label", (k + 1) + " of " + n);
      });
      if (fill) fill.style.transform = "translateY(" + (idx * 100) + "%)";
      if (count) count.textContent = String(idx + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
    }
    if (prev) prev.addEventListener("click", function () { show(idx - 1); });
    if (next) next.addEventListener("click", function () { show(idx + 1); });
    if (stage) {
      stage.tabIndex = 0;
      stage.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); show(idx + 1); }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); show(idx - 1); }
      });
      var x0 = null;
      stage.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener("touchend", function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
        x0 = null;
      });
    }
    show(0);
  }

  /* ---------- Animated FAQ accordion with GSAP ---------- */
  function initFaq() {
    $$(".acc-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var isOpen = b.getAttribute("aria-expanded") === "true";
        var panel = document.getElementById(b.getAttribute("aria-controls"));

        // Close other panels
        $$(".acc-btn").forEach(function (other) {
          if (other !== b && other.getAttribute("aria-expanded") === "true") {
            other.setAttribute("aria-expanded", "false");
            var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
            if (otherPanel) {
              if (hasGsap && !reduce) {
                gsap.to(otherPanel, {
                  height: 0,
                  opacity: 0,
                  duration: 0.35,
                  ease: "power2.inOut",
                  onComplete: function () { otherPanel.hidden = true; }
                });
              } else {
                otherPanel.hidden = true;
              }
            }
          }
        });

        if (!isOpen) {
          b.setAttribute("aria-expanded", "true");
          panel.hidden = false;
          if (hasGsap && !reduce) {
            gsap.fromTo(panel,
              { height: 0, opacity: 0 },
              { height: "auto", opacity: 1, duration: 0.4, ease: "power2.out", onComplete: function () {
                if (window.ScrollTrigger) ScrollTrigger.refresh();
              }}
            );
          }
        } else {
          b.setAttribute("aria-expanded", "false");
          if (hasGsap && !reduce) {
            gsap.to(panel, {
              height: 0,
              opacity: 0,
              duration: 0.35,
              ease: "power2.inOut",
              onComplete: function () {
                panel.hidden = true;
                if (window.ScrollTrigger) ScrollTrigger.refresh();
              }
            });
          } else {
            panel.hidden = true;
          }
        }
      });
    });
  }

  /* ---------- Calculator ---------- */
  function initCalc() {
    var bill = $("#calcBill"), roof = $("#calcRoof"), type = $("#calcType");
    var outKw = $("#outKw"), outSave = $("#outSave"), outNote = $("#outNote");
    if (!bill) return;
    var inr = function (n) { return "₹" + Math.round(n).toLocaleString("en-IN"); };
    function calc() {
      var b = parseFloat(bill.value), r = parseFloat(roof.value);
      if (!(b > 0) || !(r > 0)) {
        outKw.textContent = "—";
        outSave.textContent = "—";
        outNote.textContent = "Enter your bill and roof area. Indicative estimate. Final quote after site survey.";
        return;
      }
      var units = b / CONFIG.TARIFF;
      var kwNeed = units / CONFIG.UNITS_PER_KW_PER_MONTH;
      var kwRoof = r / CONFIG.ROOF_SQFT_PER_KWP;
      var kw = Math.min(kwNeed, kwRoof);
      var save = kw * CONFIG.UNITS_PER_KW_PER_MONTH * CONFIG.TARIFF;
      outKw.textContent = (Math.round(kw * 10) / 10).toLocaleString("en-IN") + " kWp";
      outSave.textContent = inr(save) + "/mo";
      outNote.textContent = (kwRoof < kwNeed ? "Roof area limits the system size. " : "") + "Indicative estimate. Final quote after site survey.";
    }
    [bill, roof, type].forEach(function (el) {
      if (el) { el.addEventListener("input", calc); el.addEventListener("change", calc); }
    });
    calc();
  }

  /* ---------- Forms ---------- */
  function initForm() {
    var form = $("#contactForm"), status = $("#formStatus");
    if (!form) return;
    var f = { name: $("#fName"), phone: $("#fPhone"), city: $("#fCity"), type: $("#fType"), bill: $("#fBill"), msg: $("#fMsg") };
    var err = { name: $("#eName"), phone: $("#ePhone"), city: $("#eCity") };

    function setErr(k, m) {
      err[k].textContent = m;
      if (m) f[k].setAttribute("aria-invalid", "true"); else f[k].removeAttribute("aria-invalid");
    }
    function validate() {
      var ok = true;
      setErr("name", f.name.value.trim().length < 2 ? "Please enter your name." : ""); if (f.name.value.trim().length < 2) ok = false;
      var ph = f.phone.value.replace(/[\s-]/g, "");
      var phOk = /^(\+?91)?[6-9]\d{9}$/.test(ph);
      setErr("phone", phOk ? "" : "Enter a valid 10-digit mobile number."); if (!phOk) ok = false;
      setErr("city", f.city.value ? "" : "Please choose a city."); if (!f.city.value) ok = false;
      return ok;
    }
    function waText() {
      return "Hi Dax Solar, I want a free site survey.\nName: " + f.name.value.trim() + "\nPhone: " + f.phone.value.trim() +
        "\nCity: " + f.city.value + "\nType: " + f.type.value +
        (f.bill.value ? "\nMonthly bill: ₹" + f.bill.value : "") + (f.msg.value.trim() ? "\nMessage: " + f.msg.value.trim() : "");
    }
    function say(msg, bad) { status.textContent = msg; status.classList.toggle("is-error", !!bad); }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      say("");
      if (!validate()) { var bad = form.querySelector("[aria-invalid='true']"); if (bad) bad.focus(); return; }
      if (!CONFIG.FORM_ENDPOINT) {
        window.open("https://wa.me/" + CONFIG.WHATSAPP_NUMBER + "?text=" + encodeURIComponent(waText()), "_blank", "noopener");
        say("Opening WhatsApp with your details. Our engineer will call you within one working day.");
        return;
      }
      var data = new FormData(form);
      say("Sending…");
      fetch(CONFIG.FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("bad status"); form.reset(); say("Received. We'll call you within one working day."); })
        .catch(function () { say("Something went wrong. Please WhatsApp or call us instead.", true); });
    });
    ["name", "phone", "city"].forEach(function (k) {
      f[k].addEventListener("input", function () { if (err[k].textContent) validate(); });
    });

    $$("[data-city]").forEach(function (a) {
      a.addEventListener("click", function () { f.city.value = a.dataset.city; setErr("city", ""); });
    });
  }

  function initVideo() {
    var v = $("#videoCard");
    if (!v) return;
    v.addEventListener("click", function (e) {
      e.preventDefault();
      if (CONFIG.VIDEO_URL) window.open(CONFIG.VIDEO_URL, "_blank", "noopener");
    });
  }

  /* ---------- Count-up helper ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    var o = { v: 0 };
    gsap.to(o, {
      v: target,
      duration: 1.8,
      ease: "power2.out",
      onUpdate: function () { el.textContent = fmt(Math.round(o.v * 10) / 10); },
      onComplete: function () { el.textContent = fmt(target); }
    });
  }

  /* ---------- GSAP Text Reveal Setup ---------- */
  function setupTextReveals() {
    if (reduce) return;
    var targets = $$("#svcTitle, #areasTitle, #procTitle, #calcTitle, #whyTitle, #projTitle, #expTitle, #faqTitle, #contactTitle");
    targets.forEach(function (heading) {
      if (!heading || heading.dataset.splitDone) return;
      heading.dataset.splitDone = "true";
      var text = heading.textContent.trim();
      var words = text.split(/\s+/);
      heading.innerHTML = words.map(function (w) {
        return '<span class="reveal-wrap"><span class="reveal-item">' + w + '</span></span>';
      }).join(" ");

      var items = $$(".reveal-item", heading);
      gsap.set(items, { yPercent: 120, opacity: 0, rotate: 2 });

      ScrollTrigger.create({
        trigger: heading,
        start: "top 88%",
        once: true,
        onEnter: function () {
          gsap.to(items, {
            yPercent: 0,
            opacity: 1,
            rotate: 0,
            duration: 0.9,
            stagger: 0.04,
            ease: "power3.out"
          });
        }
      });
    });
  }

  /* ---------- Motion System ---------- */
  function initMotion() {
    gsap.registerPlugin(ScrollTrigger);

    // Lenis Smooth Scrolling
    if (window.Lenis && !reduce) {
      lenis = new Lenis({
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 0.9
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);

      $$('a[href^="#"]').forEach(function (a) {
        var h = a.getAttribute("href");
        if (h.length < 2) return;
        a.addEventListener("click", function (e) {
          var t = document.querySelector(h);
          if (!t) return;
          e.preventDefault();
          lenis.scrollTo(t, { offset: h === "#home" ? 0 : -20, duration: 1.4 });
        });
      });
      $$('a[href="#top"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          lenis.scrollTo(0, { duration: 1.4 });
        });
      });
    }

    var pre = $("#preloader"), card = $("#heroCard");
    var heroTitle = $(".hero-line");
    var heroBg = $(".hero-bg");
    var heroBits = $$(".hero-left > *, .hero-right > *");

    function afterIntro() {
      if (pre && pre.parentNode) pre.parentNode.removeChild(pre);
      startScroll();
      $$("[data-hero-stat]").forEach(function (el) {
        if (el.dataset.count) {
          countUp(el);
          var bar = el.closest(".stat").querySelector(".bar i");
          if (bar) bar.style.setProperty("--w", el.dataset.bar + "%");
        }
      });
      ScrollTrigger.refresh();
    }

    // Preloader and Hero Entrance Timeline
    if (reduce || !pre) {
      if (pre && pre.parentNode) pre.parentNode.removeChild(pre);
      afterIntro();
    } else {
      stopScroll();
      gsap.set(card, { clipPath: "inset(28% 26% round 32px)" });
      gsap.set(heroTitle, { yPercent: 40, opacity: 0 });
      gsap.set(heroBits, { y: 30, opacity: 0 });

      var counter = { v: 0 }, countEl = $("#preCount"), done = false;
      var tl = gsap.timeline({ onComplete: afterIntro });

      tl.to(counter, {
        v: 100,
        duration: 1.0,
        ease: "power1.inOut",
        onUpdate: function () { countEl.textContent = String(Math.round(counter.v)).padStart(3, "0"); }
      })
      .to(".preloader-logo", { y: -10, opacity: 0, duration: 0.35, ease: "power2.in" }, "-=0.15")
      .to(pre, { yPercent: -100, duration: 0.85, ease: "power4.inOut" }, "-=0.05")
      .to(card, { clipPath: "inset(0% 0% round 32px)", duration: 1.1, ease: "power4.inOut" }, "-=0.75")
      .to(heroTitle, { yPercent: 0, opacity: 1, duration: 1.1, ease: "power4.out" }, "-=0.55")
      .to(heroBits, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }, "-=0.7");

      var skip = $("#preSkip");
      if (skip) {
        skip.tabIndex = 0;
        skip.addEventListener("click", function () { if (!done) { done = true; tl.progress(1); } });
      }
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !done && pre && pre.parentNode) { done = true; tl.progress(1); }
      });
    }

    // Hero Scroll Parallax
    if (!reduce && heroBg) {
      gsap.to(heroBg, {
        yPercent: 20,
        scale: 1.05,
        ease: "none",
        scrollTrigger: {
          trigger: "#home",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
      if (heroTitle) {
        gsap.to(heroTitle, {
          yPercent: -35,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: {
            trigger: "#home",
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });
      }
    }

    // Heading text reveals
    setupTextReveals();

    // General scroll reveals for content elements
    var plain = $$("[data-reveal]").filter(function (el) { return !el.hasAttribute("data-speed"); });
    if (!reduce) {
      ScrollTrigger.batch(plain, {
        start: "top 88%",
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.1,
            ease: "power3.out",
            overwrite: true
          });
        }
      });
    }

    // Scrubbed paragraph word fade in About section
    var scrub = $("#scrub");
    if (scrub && !reduce) {
      var words = scrub.textContent.trim().split(/\s+/);
      scrub.innerHTML = words.map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
      gsap.to($$(".w", scrub), {
        color: "#0A0A0A",
        ease: "none",
        stagger: 0.1,
        scrollTrigger: {
          trigger: scrub,
          start: "top 80%",
          end: "bottom 45%",
          scrub: true
        }
      });
    }

    // Count-up stats in Numbers section
    $$(".num-cell [data-count]").forEach(function (el) {
      var final = el.dataset.count;
      if (reduce) return;
      el.textContent = "0";
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: function () { countUp(el); }
      });
      el.dataset.final = final;
    });

    // Comparison checkmark entrance pop animation
    var usList = $(".compare-col--us");
    if (usList && !reduce) {
      var checkmarks = $$("li svg", usList);
      gsap.set(checkmarks, { scale: 0, rotate: -30 });
      ScrollTrigger.create({
        trigger: usList,
        start: "top 80%",
        once: true,
        onEnter: function () {
          gsap.to(checkmarks, {
            scale: 1,
            rotate: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "back.out(2)"
          });
        }
      });
    }

    // Media and matchMedia Parallax
    var mm = gsap.matchMedia();

    function parallax(amp) {
      var hero = $("#home");
      $$("[data-speed]").forEach(function (el) {
        var s = parseFloat(el.dataset.speed) * amp;
        if (el.closest(".hero")) {
          gsap.to(el, {
            y: s * 600,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
          });
        } else {
          var trig = el.closest("section") || el.parentElement;
          gsap.fromTo(el,
            { y: -s * 300 },
            { y: s * 300, ease: "none", scrollTrigger: { trigger: trig, start: "top bottom", end: "bottom top", scrub: true } }
          );
        }
      });
    }

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", function () {
      parallax(1);
    });
    mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", function () {
      parallax(0.5);
    });

    // Process: horizontal pinned scroll on desktop
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", function () {
      var track = $("#processTrack"), pin = $("#processPin");
      if (!track || !pin) return;
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 64); };

      var tween = gsap.to(track, {
        x: function () { return -dist(); },
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          pin: true,
          scrub: 1,
          start: "top top",
          end: function () { return "+=" + dist(); },
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: function (self) {
            // Highlight steps dynamically based on horizontal progress
            var steps = $$(".step", track);
            var activeIdx = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
            steps.forEach(function (st, idx) {
              st.classList.toggle("is-active", idx === activeIdx);
            });
          }
        }
      });
    });

    // Interactive custom cursor for desktop pointer users
    if (!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      var cur = $("#cursor");
      if (cur) {
        root.classList.add("has-cursor");
        var qx = gsap.quickTo(cur, "x", { duration: 0.22, ease: "power3" });
        var qy = gsap.quickTo(cur, "y", { duration: 0.22, ease: "power3" });
        window.addEventListener("mousemove", function (e) {
          qx(e.clientX);
          qy(e.clientY);
        }, { passive: true });
        document.addEventListener("mouseover", function (e) {
          cur.classList.toggle("is-view", !!(e.target.closest && e.target.closest(".photo, .area-card img, .proj-card img, .collage-main, .experts-collage figure, .svc-card img")));
        });
      }
    }

    // Refresh triggers after fonts and image loads
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  /* ---------- Boot ---------- */
  function boot() {
    applyConfig();
    initMenu();
    initLang();
    initNavActive();
    initServices();
    initFaq();
    initCalc();
    initForm();
    initVideo();

    hasGsap = !!(window.gsap && window.ScrollTrigger);
    var pre = $("#preloader");
    if (!hasGsap) {
      root.classList.remove("js");
      if (pre && pre.parentNode) pre.parentNode.removeChild(pre);
      return;
    }
    try {
      initMotion();
    } catch (err) {
      console.error("Motion init error:", err);
      root.classList.remove("js");
      if (pre && pre.parentNode) pre.parentNode.removeChild(pre);
      startScroll();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
