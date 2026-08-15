/**
 * _nav.js — Shared navigation enhancement for all IRC Bridge Design Reports
 * Adds: prev/next report navigation, print button, back-to-top, section TOC
 */
(function () {
  const REPORTS = [
    { file: 'som-river-kherwara.html',     label: 'SOM River — Kherwara',      type: 'sub' },
    { file: 'bedach-river-bedla.html',     label: 'BEDACH River — Bedla',      type: 'sub' },
    { file: 'jakham-river-mandvi.html',    label: 'JAKHAM River — Mandvi',     type: 'sub' },
    { file: 't01-road-jethliya.html',      label: 'T01 Road — Jethliya',       type: 'sub' },
    { file: 'som-river-larathi.html',      label: 'SOM River — Larathi',       type: 'sub' },
    { file: 'sukanaka-nalah-matoon.html',  label: 'SUKANAKA Nalah — Matoon',   type: 'sub' },
    { file: 'ayad-river-maharashtra.html', label: 'AYAD River — Maharashtra',  type: 'sub' },
    { file: 'gumaniya-nalah-udaipur.html', label: 'GUMANIYA Nalah — Udaipur',  type: 'sub' },
    { file: 'katumbi-chandrod.html',       label: 'Katumbi – Chandrod',        type: 'sub' },
    { file: 'sisarama-nalah-highlevel.html', label: 'SISARAMA Nalah — H.L.',   type: 'hl' },
    { file: 'kumbhalgarh-bridge.html',     label: 'KUMBHALGARH — H.L.',        type: 'hl' },
    { file: 'parwan-river-highlevel.html', label: 'PARWAN River — H.L.',       type: 'hl' },
    { file: 'banas-river-highlevel.html',  label: 'BANAS River — H.L.',        type: 'hl' },
    { file: 'ayad-river-fatehpura.html',   label: 'AYAD Fatehpura — H.L.',     type: 'hl' },
    { file: 'kherka-bridge.html',          label: 'KHERKA Bridge — Tee Beam',  type: 'hl' },
    { file: 'sukanaka-nalah-highlevel.html', label: 'SUKANAKA Nalah — H.L.',   type: 'hl' },
  ];

  const SUBMERSIBLE_COUNT = REPORTS.filter(r => r.type === 'sub').length;
  const HIGHLEVEL_COUNT   = REPORTS.filter(r => r.type === 'hl').length;

  function currentFile() {
    return window.location.pathname.split('/').pop() || '';
  }

  function currentIndex() {
    const f = currentFile();
    return REPORTS.findIndex(r => r.file === f);
  }

  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      .nav-prev-next { display:flex; align-items:center; gap:8px; margin-left:auto; }
      .nav-btn {
        display:inline-flex; align-items:center; gap:5px;
        padding:5px 12px; border-radius:6px; font-size:11.5px; font-weight:700;
        text-decoration:none; border:1.5px solid #c8d5e8; color:#1a4a9e;
        background:#fff; cursor:pointer; transition:background .15s,border-color .15s;
        white-space:nowrap;
      }
      .nav-btn:hover { background:#e8edf5; border-color:#1a4a9e; }
      .nav-btn.print-btn { background:#0a2a5e; color:#fff; border-color:#0a2a5e; }
      .nav-btn.print-btn:hover { background:#1a4a9e; }
      .nav-counter { font-size:11px; color:#8b9ab4; white-space:nowrap; padding:0 4px; }
      .nav-type-badge {
        font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:.5px;
        padding:2px 7px; border-radius:8px; margin-left:4px;
      }
      .nav-type-badge.sub { background:#e8f7f0; color:#0a6e3a; }
      .nav-type-badge.hl  { background:#e8f0fd; color:#0a40a0; }

      /* Floating back-to-top */
      #btt-btn {
        position:fixed; bottom:28px; right:24px; z-index:9999;
        width:40px; height:40px; border-radius:50%;
        background:#0a2a5e; color:#fff; border:none; cursor:pointer;
        font-size:18px; box-shadow:0 4px 16px rgba(10,42,94,.3);
        opacity:0; transition:opacity .25s; display:flex; align-items:center; justify-content:center;
      }
      #btt-btn.visible { opacity:1; }
      #btt-btn:hover { background:#1a4a9e; }

      /* Section jump TOC */
      #section-toc {
        position:fixed; right:24px; top:90px; z-index:800;
        background:#fff; border:1px solid #c8d5e8; border-radius:8px;
        padding:10px 14px; font-size:11px; max-width:200px;
        box-shadow:0 4px 16px rgba(10,42,94,.12);
        display:none;
      }
      #section-toc.visible { display:block; }
      #section-toc h6 { font-size:10px; text-transform:uppercase; letter-spacing:.6px; color:#6a8099; margin-bottom:8px; }
      #section-toc a { display:block; color:#1a4a9e; text-decoration:none; padding:2px 0; border-bottom:1px solid #f0f4f8; font-size:10.5px; }
      #section-toc a:last-child { border:none; }
      #section-toc a:hover { color:#0a2a5e; text-decoration:underline; }

      /* Print overrides are in _print.css */
      @media print {
        .nav-prev-next, #btt-btn, #section-toc, .nav-btn { display:none !important; }
      }
    `;
    document.head.appendChild(s);
  }

  function injectPrintCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.media = 'print';
    link.href = '_print.css';
    document.head.appendChild(link);
  }

  function enhanceNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    const idx = currentIndex();
    const total = REPORTS.length;
    const current = REPORTS[idx];

    const prev = idx > 0  ? REPORTS[idx - 1] : null;
    const next = idx < total - 1 ? REPORTS[idx + 1] : null;

    const typeLabel = current
      ? `<span class="nav-type-badge ${current.type}">${current.type === 'sub' ? 'Submersible' : 'High-Level'}</span>`
      : '';

    const counter = idx >= 0
      ? `<span class="nav-counter">${idx + 1} / ${total}</span>`
      : '';

    const prevBtn = prev
      ? `<a class="nav-btn" href="${prev.file}" title="${prev.label}">&#8592; Prev</a>`
      : `<span class="nav-btn" style="opacity:.3;cursor:default">&#8592; Prev</span>`;

    const nextBtn = next
      ? `<a class="nav-btn" href="${next.file}" title="${next.label}">Next &#8594;</a>`
      : `<span class="nav-btn" style="opacity:.3;cursor:default">Next &#8594;</span>`;

    const printBtn = `<button class="nav-btn print-btn" onclick="window.print()" title="Print / Save as PDF">&#128438; Print</button>`;
    const dwgBtn = `<a class="nav-btn" href="drawings.html" title="IRC Abutment Reference & DXF Drawing Catalogue" style="background:#e8f0fd;color:#0a40a0;border-color:#a0b8e8">&#128462; Drawings</a>`;
    const appsBtn = `<a class="nav-btn" href="apps-hub.html" title="Bridge Engineering Apps Hub — All 10 Drawing & Design Tools" style="background:#f3e8ff;color:#5b21b6;border-color:#c4b5fd">&#128736; Apps</a>`;
    const suiteBtn = `<a class="nav-btn" href="/suite" title="Live Bridge Design Suite — React App with DXF/PDF/Excel Engines" target="_blank" style="background:#0a4e2e;color:#d1fae5;border-color:#34d399">&#9881; Suite</a>`;

    const group = document.createElement('div');
    group.className = 'nav-prev-next';
    group.innerHTML = typeLabel + counter + prevBtn + nextBtn + dwgBtn + appsBtn + suiteBtn + printBtn;
    nav.appendChild(group);
  }

  function injectBackToTop() {
    const btn = document.createElement('button');
    btn.id = 'btt-btn';
    btn.title = 'Back to top';
    btn.innerHTML = '&#8679;';
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(btn);

    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 400);
    });
  }

  function injectSectionTOC() {
    const sections = document.querySelectorAll('.section-title');
    if (sections.length < 2) return;

    const toc = document.createElement('div');
    toc.id = 'section-toc';
    toc.innerHTML = '<h6>Jump to Section</h6>';

    sections.forEach(function (el) {
      const parent = el.closest('.section');
      if (!parent) return;
      if (!parent.id) parent.id = 'sec-' + Math.random().toString(36).slice(2, 7);
      const a = document.createElement('a');
      a.href = '#' + parent.id;
      a.textContent = el.textContent.slice(0, 40);
      toc.appendChild(a);
    });

    document.body.appendChild(toc);

    // Show TOC only on wide screens when scrolled
    function updateTOC() {
      const wide = window.innerWidth > 1400;
      const scrolled = window.scrollY > 200;
      toc.classList.toggle('visible', wide && scrolled);
    }
    window.addEventListener('scroll', updateTOC);
    window.addEventListener('resize', updateTOC);
    updateTOC();
  }

  function injectViewport() {
    if (!document.querySelector('meta[name="viewport"]')) {
      var vm = document.createElement('meta');
      vm.name = 'viewport';
      vm.content = 'width=device-width,initial-scale=1';
      document.head.insertBefore(vm, document.head.firstChild);
    }
  }

  function run() {
    injectViewport();
    injectStyles();
    injectPrintCSS();
    enhanceNav();
    injectBackToTop();
    injectSectionTOC();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
