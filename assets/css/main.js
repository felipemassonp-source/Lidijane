/* =========================================================
   CONFIGURAÇÃO — edite aqui
   ========================================================= */
const CONFIG = {
  // Número do WhatsApp com DDI + DDD, só números. Ex.: 5584999999999
  whatsapp: "5500000000000",
  whatsMsg: "Olá, Lidijane! Vim pelo site e gostaria de saber mais sobre ",
  // Checkout do curso (Kiwify)
  checkout: "https://pay.kiwify.com.br/nOLIqqA",
};

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(hover: none)").matches;

  gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

  /* ---------- Links de conversão ---------- */
  // repassa UTMs da URL para o checkout (rastreamento do tráfego pago)
  const passParams = new URLSearchParams(location.search);
  $$("[data-checkout]").forEach((a) => {
    const u = new URL(CONFIG.checkout);
    passParams.forEach((v, k) => { if (/^(utm_|src|sck|fbclid)/.test(k)) u.searchParams.set(k, v); });
    a.href = u.toString();
  });
  $$("[data-wa]").forEach((a) => {
    const topic = a.dataset.wa || "seus atendimentos";
    a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.whatsMsg + topic + ".")}`;
    a.target = "_blank";
    a.rel = "noopener";
  });
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Pranchas de CAA (assinatura visual) ---------- */
  const s = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICONS = {
    eu: s('<circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/>'),
    quero: s('<path d="M7 11V6a1.5 1.5 0 013 0v5M10 10V4.5a1.5 1.5 0 013 0V10M13 10V5.5a1.5 1.5 0 013 0V12M16 9.5a1.5 1.5 0 013 0V14c0 4-3 7-7 7-3 0-5-2-6.5-4L3 13.5a1.5 1.5 0 012.3-1.9L7 13"/>'),
    mais: s('<path d="M12 5v14M5 12h14"/>'),
    brincar: s('<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16"/>'),
    comer: s('<path d="M8 3v8M5 3v5a3 3 0 006 0V3M8 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8"/>'),
    parar: s('<path d="M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7z"/><path d="M8 12h8"/>'),
    ajuda: s('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>'),
    casa: s('<path d="M4 11l8-7 8 7v9H4zM10 20v-5h4v5"/>'),
    feliz: s('<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 007 0M9 9.5h.01M15 9.5h.01"/>'),
    ir: s('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    não: s('<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>'),
    sim: s('<path d="M5 12.5l4.5 4.5L19 7"/>'),
    beber: s('<path d="M6 4h12l-1.5 16h-9zM6.5 9h11"/>'),
    gostar: s('<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>'),
    ler: s('<path d="M3 5h6a3 3 0 013 3v12a2 2 0 00-2-2H3zM21 5h-6a3 3 0 00-3 3v12a2 2 0 012-2h7z"/>'),
    dormir: s('<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>'),
    falar: s('<path d="M4 5h16v11H9l-5 4z"/>'),
    olhar: s('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    escola: s('<path d="M3 9l9-5 9 5-9 5zM7 11v5c3 2 7 2 10 0v-5"/>'),
    você: s('<circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7M18 3l3 0"/>'),
  };
  $$("[data-board]").forEach((b) => {
    b.classList.add("board");
    b.innerHTML = b.dataset.board
      .split(",")
      .map((x) => {
        const [w, c] = x.trim().split(":");
        return `<div class="tile ${c ? "tile--" + c : ""}">${ICONS[w] || ICONS.mais}<span>${w}</span></div>`;
      })
      .join("");
  });

  /* ---------- Rolagem suave ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(t, { offset: -80, duration: 1.4 }) : t.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Transição entre páginas ---------- */
  const trSpans = $$(".transition span");
  const revealPage = () =>
    gsap.to(trSpans, { scaleY: 0, transformOrigin: "top", duration: 0.8, ease: "power4.inOut", stagger: 0.06 });
  const leavePage = (url) => {
    gsap.set(trSpans, { transformOrigin: "bottom" });
    gsap.to(trSpans, {
      scaleY: 1, duration: 0.6, ease: "power4.inOut", stagger: 0.05,
      onComplete: () => (location.href = url),
    });
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || e.defaultPrevented) return;
    const href = a.getAttribute("href");
    if (!href || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (/^(#|mailto:|tel:|javascript:)/.test(href)) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    leavePage(url.href);
  });
  window.addEventListener("pageshow", (e) => { if (e.persisted) gsap.set(trSpans, { scaleY: 0 }); });

  /* ---------- Navegação ---------- */
  const nav = $(".nav");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate(self) {
      nav.classList.toggle("is-scrolled", self.scroll() > 40);
      if (document.body.classList.contains("menu-open")) return;
      if (self.direction === 1 && self.scroll() > 400) gsap.to(nav, { yPercent: -110, duration: 0.45, ease: "power3.out", overwrite: true });
      else if (self.direction === -1) gsap.to(nav, { yPercent: 0, duration: 0.45, ease: "power3.out", overwrite: true });
    },
  });

  const burger = $(".nav__burger"), menu = $(".mobile-menu");
  if (burger && menu) {
    let open = false;
    const mtl = gsap.timeline({ paused: true })
      .set(menu, { visibility: "visible" })
      .to(menu, { clipPath: "circle(150% at calc(100% - 50px) 40px)", duration: 0.8, ease: "power3.inOut" })
      .from($$("a.big", menu), { yPercent: 110, stagger: 0.06, duration: 0.6, ease: "power3.out" }, "-=.4");
    const toggle = (v) => {
      open = v;
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open);
      if (open) { mtl.play(); lenis && lenis.stop(); } else { mtl.reverse(); lenis && lenis.start(); }
    };
    burger.addEventListener("click", () => toggle(!open));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => open && toggle(false)));
  }

  /* ---------- Cursor e magnetismo ---------- */
  if (!isTouch && !reduce) {
    const c = $(".cursor"), lab = $(".cursor__label");
    if (c) {
      gsap.set(c, { scale: 0.15, autoAlpha: 0 });
      const xTo = gsap.quickTo(c, "x", { duration: 0.35, ease: "power3" });
      const yTo = gsap.quickTo(c, "y", { duration: 0.35, ease: "power3" });
      let shown = false;
      addEventListener("mousemove", (e) => {
        if (!shown) { shown = true; gsap.set(c, { x: e.clientX, y: e.clientY }); gsap.to(c, { autoAlpha: 1, duration: 0.3 }); }
        xTo(e.clientX); yTo(e.clientY);
      });
      $$("[data-cursor]").forEach((el) => {
        el.addEventListener("mouseenter", () => {
          lab.textContent = el.dataset.cursor;
          gsap.to(c, { scale: 1, duration: 0.45, ease: "power3.out" });
          gsap.to(lab, { opacity: 1, duration: 0.3, delay: 0.1 });
        });
        el.addEventListener("mouseleave", () => {
          gsap.to(c, { scale: 0.15, duration: 0.45, ease: "power3.out" });
          gsap.to(lab, { opacity: 0, duration: 0.15 });
        });
      });
    }
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1,.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1,.4)" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Animações (após fontes) ---------- */
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);

  fontsReady.then(() => {
    revealPage();
    if (reduce) return;
    intro();
    scrollAnimations();
    pageSpecific();
    window.addEventListener("load", () => ScrollTrigger.refresh());
  });

  function intro() {
    const tl = gsap.timeline({ delay: 0.35 });
    $$("[data-intro-split]").forEach((h) => {
      const st = SplitText.create(h, { type: "lines", mask: "lines", linesClass: "split-line", ignore: "svg" });
      tl.from(st.lines, { yPercent: 110, duration: 1.15, ease: "power4.out", stagger: 0.09 }, 0);
    });
    const fades = $$("[data-intro-fade]");
    if (fades.length) tl.from(fades, { y: 30, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 }, 0.35);
    $$("[data-intro-clip]").forEach((m) => {
      tl.fromTo(m, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "power4.inOut" }, 0.1);
      const img = $("img", m);
      if (img) tl.from(img, { scale: 1.35, duration: 1.8, ease: "power3.out" }, 0.1);
    });
    const tiles = $$("[data-intro-pop] .tile");
    if (tiles.length) {
      tl.from(tiles, {
        scale: 0, opacity: 0, rotate: () => gsap.utils.random(-30, 30),
        duration: 0.7, ease: "back.out(1.7)", stagger: { each: 0.04, from: "random" },
      }, 0.8);
      tl.add(() => gsap.to(tiles, {
        y: () => gsap.utils.random(-6, 6), duration: () => gsap.utils.random(2, 3.2),
        yoyo: true, repeat: -1, ease: "sine.inOut",
      }));
    }
    const pops = $$("[data-intro-pop-el]");
    if (pops.length) tl.from(pops, { scale: 0.6, opacity: 0, duration: 0.8, ease: "back.out(1.6)", stagger: 0.12 }, 1);
    $$(".hl path").forEach((p) => {
      const L = p.getTotalLength();
      gsap.set(p, { strokeDasharray: L, strokeDashoffset: L });
      tl.to(p, { strokeDashoffset: 0, duration: 1.1, ease: "power3.inOut" }, 1.1);
    });
  }

  function scrollAnimations() {
    // títulos linha a linha
    $$("[data-split]").forEach((h) => {
      SplitText.create(h, {
        type: "lines", mask: "lines", linesClass: "split-line", autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.08,
          scrollTrigger: { trigger: h, start: "top 86%", once: true },
        }),
      });
    });

    // texto que acende palavra por palavra
    $$(".manifesto").forEach((m) => {
      const st = SplitText.create(m, { type: "words", wordsClass: "word" });
      gsap.to(st.words, {
        opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: m, start: "top 78%", end: "bottom 50%", scrub: true },
      });
    });

    $$("[data-reveal]").forEach((el) =>
      gsap.from(el, {
        y: 50, opacity: 0, duration: 1.1, ease: "power3.out", delay: +el.dataset.delay || 0,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      })
    );
    $$("[data-stagger]").forEach((g) =>
      gsap.from(g.children, {
        y: 60, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1,
        scrollTrigger: { trigger: g, start: "top 85%", once: true },
      })
    );
    $$(".rule").forEach((r) =>
      gsap.from(r, { scaleX: 0, duration: 1.4, ease: "power3.inOut", scrollTrigger: { trigger: r, start: "top 92%", once: true } })
    );

    // parallax nas fotos
    $$("[data-parallax]").forEach((img) =>
      gsap.fromTo(img, { yPercent: 0 }, {
        yPercent: -12, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      })
    );
    // cortina que revela a foto
    $$(".reveal-cover").forEach((c) =>
      gsap.to(c, { scaleY: 0, duration: 1.3, ease: "power4.inOut", scrollTrigger: { trigger: c.parentElement, start: "top 75%", once: true } })
    );

    // contadores
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count, o = { v: 0 };
      el.textContent = "0";
      gsap.to(o, {
        v: end, duration: 2.2, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onUpdate: () => (el.textContent = Math.round(o.v)),
      });
    });

    // marquees reagem à velocidade da rolagem
    $$(".marquee__track").forEach((t) => {
      const tw = gsap.to(t, { xPercent: -50, ease: "none", duration: +t.dataset.speed || 30, repeat: -1 });
      tw.totalTime(tw.duration() * 50);
      let dir = 1;
      ScrollTrigger.create({
        trigger: t, start: "top bottom", end: "bottom top",
        onUpdate(self) {
          dir = self.direction;
          const boost = Math.min(5, 1 + Math.abs(self.getVelocity()) / 350);
          gsap.to(tw, { timeScale: dir * boost, duration: 0.2, overwrite: true,
            onComplete: () => gsap.to(tw, { timeScale: dir, duration: 1.2 }) });
        },
      });
    });

    // hero sai com profundidade
    if ($(".hero__board")) {
      gsap.to(".hero__board", { yPercent: -40, rotate: 4, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }
    const spinners = $$(".hero__stamp svg, .seal svg");
    if (spinners.length) gsap.to(spinners, { rotate: 360, duration: 22, repeat: -1, ease: "none" });

    // portas (cards grandes) — peças da prancha se soltam no hover
    $$(".door").forEach((d) => {
      const tiles = $$(".tile", d);
      d.addEventListener("mouseenter", () => gsap.to(tiles, {
        y: () => gsap.utils.random(-24, 24), rotate: () => gsap.utils.random(-12, 12),
        duration: 0.7, ease: "power3.out", stagger: 0.015, overwrite: true }));
      d.addEventListener("mouseleave", () => gsap.to(tiles, { y: 0, rotate: 0, duration: 0.9, ease: "elastic.out(1,.5)", overwrite: true }));
    });
  }

  function pageSpecific() {
    /* Lista de serviços com prévia flutuante */
    const list = $(".svc-list"), prev = $(".svc-preview");
    if (list && prev && !isTouch) {
      const inner = $(".svc-preview__inner", prev);
      gsap.set(prev, { scale: 0.6 });
      const xTo = gsap.quickTo(prev, "x", { duration: 0.7, ease: "power3" });
      const yTo = gsap.quickTo(prev, "y", { duration: 0.7, ease: "power3" });
      list.addEventListener("mousemove", (e) => { xTo(e.clientX + 40); yTo(e.clientY - 170); });
      list.addEventListener("mouseenter", () => gsap.to(prev, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }));
      list.addEventListener("mouseleave", () => gsap.to(prev, { opacity: 0, scale: 0.6, duration: 0.4, ease: "power3.in" }));
      $$(".svc-row", list).forEach((r, i) =>
        r.addEventListener("mouseenter", () => gsap.to(inner, { yPercent: -100 * i, duration: 0.7, ease: "power4.inOut" }))
      );
    }

    /* Fluxo "antes da prancha" */
    const flow = $(".flow");
    if (flow) {
      const steps = $$(".flow__step", flow), n = steps.length - 1;
      gsap.to(".flow__line i", {
        scaleX: 1, ease: "none",
        scrollTrigger: {
          trigger: flow, start: "top 70%", end: "bottom 55%", scrub: true,
          onUpdate: (self) => steps.forEach((st, i) => st.classList.toggle("is-on", self.progress > 0.01 && self.progress >= (i / n) * 0.97)),
        },
      });
    }

    /* Módulos em rolagem horizontal (desktop) */
    const mm = gsap.matchMedia();
    mm.add("(min-width: 861px)", () => {
      $$(".hscroll").forEach((sec) => {
        const track = $(".hscroll__track", sec), bar = $(".hscroll__progress i", sec);
        const dist = () => track.scrollWidth - window.innerWidth;
        const tw = gsap.to(track, {
          x: () => -dist(), ease: "none",
          scrollTrigger: {
            trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
            onUpdate: (self) => bar && gsap.set(bar, { scaleX: self.progress }),
          },
        });
        $$(".module__n", sec).forEach((num) =>
          gsap.from(num, { xPercent: 60, opacity: 0.2, ease: "none",
            scrollTrigger: { trigger: num.parentElement, containerAnimation: tw, start: "left right", end: "left 45%", scrub: true } })
        );
      });
    });

    /* FAQ */
    $$(".faq__item").forEach((it) => {
      const q = $(".faq__q", it), a = $(".faq__a", it);
      q.addEventListener("click", () => {
        const open = it.classList.contains("is-open");
        $$(".faq__item.is-open").forEach((o) => {
          if (o === it) return;
          o.classList.remove("is-open");
          $(".faq__q", o).setAttribute("aria-expanded", "false");
          gsap.to($(".faq__a", o), { height: 0, duration: 0.5, ease: "power3.inOut" });
        });
        it.classList.toggle("is-open", !open);
        q.setAttribute("aria-expanded", String(!open));
        gsap.to(a, { height: open ? 0 : "auto", duration: 0.6, ease: "power3.inOut", onComplete: () => ScrollTrigger.refresh() });
      });
    });

    /* Barra de compra mobile */
    const bb = $(".buybar");
    if (bb && $("#oferta")) {
      gsap.set(bb, { y: 0, yPercent: 140 });
      ScrollTrigger.create({
        trigger: ".course-hero", start: "bottom top", endTrigger: "#oferta", end: "top bottom",
        onToggle: (self) => gsap.to(bb, { yPercent: self.isActive ? 0 : 140, duration: 0.5, ease: "power3.out" }),
      });
    }

    /* Filtro de ferramentas com Flip */
    const filter = $(".tools-filter");
    if (filter) {
      const btns = $$("button", filter), pill = $(".tools-filter__pill", filter), tools = $$(".tool");
      const movePill = (b, inst) => gsap.to(pill, { x: b.offsetLeft - 6, width: b.offsetWidth, duration: inst ? 0 : 0.55, ease: "power3.inOut" });
      const apply = (cat, inst) => {
        btns.forEach((b) => b.classList.toggle("is-active", b.dataset.filter === cat));
        movePill(btns.find((b) => b.dataset.filter === cat), inst);
        const state = Flip.getState(tools);
        tools.forEach((t) => t.classList.toggle("is-hidden", cat !== "all" && !t.dataset.cat.split(" ").includes(cat)));
        if (inst) return ScrollTrigger.refresh();
        Flip.from(state, {
          duration: 0.7, ease: "power3.inOut", absolute: true, stagger: 0.03,
          onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.25 }),
          onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
          onComplete: () => ScrollTrigger.refresh(),
        });
      };
      btns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.filter)));
      const map = { profissionais: "pro", familias: "fam" };
      apply(map[location.hash.slice(1)] || "all", true);
      addEventListener("resize", () => movePill($(".is-active", filter), true));
      $$("[data-go-filter]").forEach((b) => b.addEventListener("click", () => {
        const target = $("#biblioteca");
        lenis ? lenis.scrollTo(target, { offset: -40, duration: 1.4 }) : target.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => apply(b.dataset.goFilter), 700);
      }));
    }
  }

  /* ---------- Formulário de captura (placeholder) ---------- */
  $$("form[data-capture]").forEach((f) =>
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      // TODO: integrar com a ferramenta de e-mail (RD Station, ActiveCampaign, Mailchimp...)
      gsap.to(f, { opacity: 0, y: -10, duration: 0.3, onComplete: () => {
        f.innerHTML = '<p class="display" style="font-size:32px;line-height:1.15">Prontinho! 💚<br><span class="muted" style="font-family:var(--sans);font-size:17px">Você vai receber os materiais no seu e-mail.</span></p>';
        gsap.to(f, { opacity: 1, y: 0, duration: 0.5 });
      } });
    })
  );
})();
