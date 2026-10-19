// ZENERGY shared behavior

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ---------- Lightbox (with zoom) ----------
  // Built once and reused for every real photo on the page (including
  // photos added later, like the homepage's auto-loaded contact sheet).
  // Zoom: mouse wheel, pinch on a touch screen, double-click / double-tap,
  // the + / - buttons, or the + - 0 keys. When zoomed in, drag to move around.
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <button class="lightbox-close focus-ring" aria-label="Close">CLOSE ✕</button>
    <div class="lightbox-tools">
      <button class="lightbox-zoom focus-ring" data-zoom="out" aria-label="Zoom out">−</button>
      <button class="lightbox-zoom focus-ring" data-zoom="in" aria-label="Zoom in">+</button>
    </div>
    <img alt="" draggable="false">
    <div class="lightbox-caption"><span class="lightbox-loc"></span><span class="lightbox-hint">Scroll, pinch or double-click to zoom</span></div>
  `;
  document.body.appendChild(overlay);
  const lbImg = overlay.querySelector('img');
  const lbLoc = overlay.querySelector('.lightbox-loc');
  const lbClose = overlay.querySelector('.lightbox-close');

  const MAX_ZOOM = 5;
  let zScale = 1, zX = 0, zY = 0, openToken = 0;

  function applyZoom() {
    lbImg.style.transform = `translate(${zX}px, ${zY}px) scale(${zScale})`;
    overlay.classList.toggle('zoomed', zScale > 1.001);
  }
  function resetZoom() { zScale = 1; zX = 0; zY = 0; applyZoom(); }
  // Keeps the image from being dragged completely out of view.
  function clampPan() {
    const w = lbImg.offsetWidth * zScale, h = lbImg.offsetHeight * zScale;
    const limX = Math.max(0, (w - window.innerWidth) / 2 + 60);
    const limY = Math.max(0, (h - window.innerHeight) / 2 + 60);
    zX = Math.max(-limX, Math.min(limX, zX));
    zY = Math.max(-limY, Math.min(limY, zY));
  }
  // Zoom to newScale, keeping the point (cx, cy) on screen where it is.
  function zoomTo(newScale, cx, cy) {
    newScale = Math.max(1, Math.min(MAX_ZOOM, newScale));
    const r = lbImg.getBoundingClientRect();
    const baseX = r.left + r.width / 2 - zX;   // image centre without pan
    const baseY = r.top + r.height / 2 - zY;
    if (cx == null) { cx = window.innerWidth / 2; cy = window.innerHeight / 2; }
    const k = newScale / zScale;
    zX = cx - baseX - k * (cx - baseX - zX);
    zY = cy - baseY - k * (cy - baseY - zY);
    zScale = newScale;
    if (zScale <= 1.001) { zScale = 1; zX = 0; zY = 0; }
    clampPan();
    applyZoom();
  }

  function openLightbox(img) {
    const full = img.dataset.full || img.getAttribute('src');
    const token = ++openToken;
    resetZoom();
    lbImg.alt = img.getAttribute('alt') || '';
    // Show the small copy straight away, then swap in the full-size photo
    // as soon as it has downloaded, so the viewer is never staring at black.
    lbImg.src = img.currentSrc || img.src;
    if (full && lbImg.src.indexOf(full) === -1) {
      const big = new Image();
      big.onload = () => { if (token === openToken && overlay.classList.contains('open')) lbImg.src = full; };
      big.src = full;
    }
    const frame = img.closest('.frame');
    const loc = frame ? frame.querySelector('.frame-caption .loc') : null;
    lbLoc.textContent = loc ? loc.textContent : '';
    overlay.classList.add('open');
    lbClose.focus();
  }

  function closeLightbox() {
    openToken++;
    overlay.classList.remove('open');
    lbImg.src = '';
    resetZoom();
  }

  document.body.addEventListener('click', (e) => {
    const img = e.target.closest('.frame-photo img');
    if (img) {
      openLightbox(img);
      return;
    }
    if (e.target === overlay) closeLightbox();
  });
  lbClose.addEventListener('click', closeLightbox);
  overlay.querySelectorAll('.lightbox-zoom').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      zoomTo(zScale * (b.dataset.zoom === 'in' ? 1.6 : 1 / 1.6));
    });
  });
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === '+' || e.key === '=') zoomTo(zScale * 1.4);
    else if (e.key === '-' || e.key === '_') zoomTo(zScale / 1.4);
    else if (e.key === '0') resetZoom();
  });

  // Mouse wheel / trackpad pinch
  overlay.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomTo(zScale * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY);
  }, { passive: false });

  // Drag to pan, two-finger pinch, double-click / double-tap to zoom
  const pointers = new Map();
  let pinchDist = 0, lastTapTime = 0, downX = 0, downY = 0, moved = false;
  lbImg.addEventListener('pointerdown', (e) => {
    lbImg.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { downX = e.clientX; downY = e.clientY; moved = false; }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      moved = true;
    }
  });
  lbImg.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist) zoomTo(zScale * d / pinchDist, (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinchDist = d;
    } else if (pointers.size === 1 && zScale > 1) {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 4) moved = true;
      zX += dx; zY += dy;
      clampPan();
      applyZoom();
    }
  });
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    const wasSingle = pointers.size === 1;
    pointers.delete(e.pointerId);
    pinchDist = 0;
    if (wasSingle && !moved && e.type === 'pointerup') {
      const now = Date.now();
      if (now - lastTapTime < 320) {
        zoomTo(zScale > 1.001 ? 1 : 2.5, e.clientX, e.clientY);
        lastTapTime = 0;
      } else {
        lastTapTime = now;
      }
    }
  }
  lbImg.addEventListener('pointerup', endPointer);
  lbImg.addEventListener('pointercancel', endPointer);

  // ---------- Thumbnails in the gallery grids ----------
  // The HTML keeps pointing at the full-size photo (photos/name.jpg), exactly as
  // you write it. Here each grid image is switched to its small copy
  // (photos/thumbs/name.jpg, made by make_thumbs.py) so the grids load fast.
  // The full-size file is kept in data-full and only loaded when a photo is
  // clicked to enlarge. If a thumbnail doesn't exist yet, the full-size photo
  // is used instead, so nothing ever shows up blank.
  document.querySelectorAll('.gallery-grid .frame-photo img').forEach((img) => {
    const full = img.getAttribute('src');
    if (!full || !/^photos\/[^/]+$/.test(full)) return;
    img.dataset.full = full;
    img.addEventListener('error', function fallback() {
      img.removeEventListener('error', fallback);
      img.src = full;
    });
    img.src = full.replace('photos/', 'photos/thumbs/');
  });

  // ---------- Shuffle each gallery's photo order ----------
  // A fresh random arrangement every time the page loads — nothing pinned
  // down twice. Frames marked class="frame pick" are the showcase: they are
  // shuffled among themselves but always sit at the front, so the small taste
  // shown by default is the photographer's own choice. A gallery with no picks
  // is fully random. Runs before the preview/collapse logic below.
  document.querySelectorAll('.gallery-grid').forEach((grid) => {
    const frames = Array.from(grid.children);
    for (let i = frames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [frames[i], frames[j]] = [frames[j], frames[i]];
    }
    const picks = frames.filter((f) => f.classList.contains('pick'));
    const rest = frames.filter((f) => !f.classList.contains('pick'));
    picks.concat(rest).forEach((f) => grid.appendChild(f));
  });

  // ---------- Gallery preview / "show more", + back-to-wheel link ----------
  // Each gallery opens on a small taste. "Show more" reveals the next batch,
  // so a big gallery never lands on a visitor all at once. Clicking the
  // gallery's name/number does the same. Photos stay lazy-loaded, so nothing
  // downloads until it's actually shown. Every gallery also gets a link back
  // to the homepage wheel.
  const PREVIEW_COUNT = 3;  // shown while a gallery is closed
  const PAGE_SIZE = 12;     // how many more each "Show more" click reveals
  document.querySelectorAll('.gallery-grid').forEach((grid) => {
    const frames = Array.from(grid.children).filter(el => el.classList.contains('frame'));
    const total = frames.length;
    let shown = Math.min(PREVIEW_COUNT, total);

    const footer = document.createElement('div');
    footer.className = 'gallery-footer';
    grid.insertAdjacentElement('afterend', footer);

    let moreBtn = null, lessBtn = null;
    const section = grid.closest('section');

    function render() {
      frames.forEach((f, i) => f.classList.toggle('frame-hidden', i >= shown));
      if (!moreBtn) return;
      const left = total - shown;
      moreBtn.hidden = left <= 0;
      moreBtn.textContent = (shown <= PREVIEW_COUNT && left <= PAGE_SIZE)
        ? `View all ${total} photos →`
        : `Show ${Math.min(PAGE_SIZE, left)} more (${left} left) →`;
      lessBtn.hidden = shown <= PREVIEW_COUNT;
    }
    function showMore() { shown = Math.min(total, shown + PAGE_SIZE); render(); }
    function showLess() {
      shown = Math.min(PREVIEW_COUNT, total); render();
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (total > PREVIEW_COUNT) {
      moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'gallery-toggle focus-ring';
      moreBtn.addEventListener('click', showMore);
      footer.appendChild(moreBtn);

      lessBtn = document.createElement('button');
      lessBtn.type = 'button';
      lessBtn.className = 'gallery-toggle gallery-toggle-less focus-ring';
      lessBtn.textContent = 'Show less ↑';
      lessBtn.addEventListener('click', showLess);
      footer.appendChild(lessBtn);

      // Clicking the gallery's own name/number opens or closes it.
      const h2 = section && section.querySelector('.section-head h2');
      const titleWrap = h2 && h2.closest('div');
      if (titleWrap) {
        titleWrap.style.cursor = 'pointer';
        titleWrap.addEventListener('click', () => (shown > PREVIEW_COUNT ? showLess() : showMore()));
      }
    }
    render();

    const backLink = document.createElement('a');
    backLink.href = 'index.html#ensoStage';
    backLink.className = 'gallery-back-link focus-ring';
    backLink.textContent = '← Back to the wheel';
    footer.appendChild(backLink);
  });

  // Mark active nav link based on current page
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // Auto-fill aperture/shutter/ISO captions from each photo's real EXIF data,
  // then (on the homepage only) auto-build the "6 latest" contact sheet.
  autoFillExifCaptions();
  buildHomepageContactSheet();
  buildRandomGalleryTeasers();
});

// ---- EXIF auto-captions ----
// Requires exif-js (loaded via CDN <script> tag before this file).
// Docs: https://github.com/exif-js/exif-js

// EXIF dates look like "2026:07:12 14:33:02" — convert to a real JS Date.
function parseExifDate(dateStr) {
  if (!dateStr) return null;
  const [datePart, timePart] = dateStr.split(' ');
  if (!datePart) return null;
  const [y, m, d] = datePart.split(':');
  const parsed = new Date(`${y}-${m}-${d}T${timePart || '00:00:00'}`);
  return isNaN(parsed) ? null : parsed;
}

// Builds a caption string like "f/2.8 · 1/250 · ISO 400" from raw EXIF tags.
// Any missing tag is skipped rather than shown as blank/undefined. If a photo
// has no usable EXIF at all (common if it's been re-exported by editing
// software that strips metadata), falls back to an em dash rather than
// leaving the caption looking broken.
function formatExifCaption(tags) {
  const parts = [];
  if (tags.FNumber) parts.push(`f/${tags.FNumber}`);
  if (tags.ExposureTime) {
    const et = tags.ExposureTime;
    parts.push(et >= 1 ? `${et}s` : `1/${Math.round(1 / et)}`);
  }
  if (tags.ISOSpeedRatings) parts.push(`ISO ${tags.ISOSpeedRatings}`);
  return parts.length ? parts.join(' · ') : '—';
}

// Finds every frame that has both a real photo AND a caption span marked
// class="exif-auto" (our placeholder for "read this from the file"), and
// fills it in from that photo's actual EXIF data.
function autoFillExifCaptions() {
  if (typeof EXIF === 'undefined') return; // library didn't load (e.g. offline)
  document.querySelectorAll('.frame .frame-caption .exif-auto').forEach((span) => {
    const frame = span.closest('.frame');
    const img = frame && frame.querySelector('.frame-photo img');
    if (!img) return;

    const readTags = function () {
      const tags = {
        FNumber: EXIF.getTag(this, 'FNumber'),
        ExposureTime: EXIF.getTag(this, 'ExposureTime'),
        ISOSpeedRatings: EXIF.getTag(this, 'ISOSpeedRatings'),
      };
      span.textContent = formatExifCaption(tags);
    };

    // exif-js silently does nothing if the <img> hasn't finished loading yet
    // (img.complete === false) — which, now that photos are lazy-loaded, is
    // true for almost every photo below the fold at page-load time. Wait for
    // the image's own 'load' event before asking exif-js to read it.
    if (img.complete) {
      EXIF.getData(img, readTags);
    } else {
      img.addEventListener('load', function () {
        EXIF.getData(img, readTags);
      }, { once: true });
    }
  });
}

// Small copy of a photo (photos/name.jpg -> photos/thumbs/name.jpg). The
// homepage uses these for display AND for reading dates, so it never has to
// download the big originals just to show a few pictures.
function thumbOf(src) {
  return /^photos\/[^/]+$/.test(src || '') ? src.replace('photos/', 'photos/thumbs/') : src;
}
// Loads an <Image> from the thumbnail; if that file doesn't exist yet, retries
// with the full-size photo.
function loadImageWithFallback(im, src) {
  const prev = im.onerror;   // the caller's own "it failed" handler
  let retried = false;
  im.onerror = (e) => {
    if (!retried && thumbOf(src) !== src) { retried = true; im.src = src; }
    else if (prev) prev.call(im, e);
  };
  im.src = thumbOf(src);
}

// Homepage-only: reads every real photo currently in galleries.html, checks
// each one's EXIF capture date, and renders the 6 most recently-taken photos
// into the homepage contact sheet automatically. Nothing to maintain by
// hand — add a photo to any gallery and, if it's the newest, it appears here
// on its own next time the homepage loads.
//
// Location text: uses each photo's `alt` attribute from galleries.html, so
// setting a meaningful alt (e.g. alt="Fremantle") on a gallery photo also
// gives it a location on the homepage for free. Leave alt as the default
// "Describe this photo" and no location will be shown.
async function buildHomepageContactSheet() {
  const container = document.querySelector('#auto-contact-sheet');
  if (!container) return; // not the homepage

  try {
    const res = await fetch('galleries.html');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const imgs = Array.from(doc.querySelectorAll('.frame-photo img'));

    // De-duplicate — the same photo can legitimately appear in more than
    // one gallery, but should only show once here.
    const seen = new Set();
    const photos = [];
    imgs.forEach((img) => {
      const src = img.getAttribute('src');
      if (!src || seen.has(src)) return;
      seen.add(src);
      photos.push({ src, alt: img.getAttribute('alt') || '' });
    });

    if (!photos.length) {
      container.innerHTML = '<p class="muted center" style="grid-column:1/-1;">Add photos to your galleries and they\'ll appear here automatically.</p>';
      return;
    }

    // Read each photo's EXIF capture date in parallel.
    const withDates = await Promise.all(
      photos.map(
        (p) =>
          new Promise((resolve) => {
            if (typeof EXIF === 'undefined') return resolve({ ...p, date: null });
            const im = new Image();
            im.onload = function () {
              EXIF.getData(im, function () {
                const dateStr = EXIF.getTag(this, 'DateTimeOriginal') || EXIF.getTag(this, 'DateTime');
                resolve({ ...p, date: parseExifDate(dateStr) });
              });
            };
            im.onerror = function () {
              resolve({ ...p, date: null });
            };
            loadImageWithFallback(im, p.src);
          })
      )
    );

    // Newest first. Photos with no readable date (EXIF stripped) sink to
    // the bottom rather than being excluded entirely.
    withDates.sort((a, b) => {
      if (a.date && b.date) return b.date - a.date;
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });

    const latest6 = withDates.slice(0, 6);

    container.innerHTML = latest6
      .map((p) => {
        const loc = p.alt && p.alt !== 'Describe this photo' ? p.alt : '';
        return `
        <div class="frame">
          <div class="frame-photo"><img src="${thumbOf(p.src)}" data-full="${p.src}" alt="${p.alt}" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src=this.dataset.full}" style="width:100%; height:100%; object-fit:cover;" loading="lazy"></div>
          <div class="frame-caption"><span class="exif-auto">…</span><span class="loc">${loc}</span></div>
        </div>`;
      })
      .join('');

    autoFillExifCaptions(); // fill in aperture/shutter/ISO for the frames just injected
  } catch (err) {
    console.error('Could not build homepage contact sheet:', err);
    container.innerHTML = '<p class="muted center" style="grid-column:1/-1;">Could not load latest photos — check the console for details.</p>';
  }
}

// Picks 3 different galleries at random on every homepage visit, and builds
// their teaser cards entirely from what's already in galleries.html (title,
// quote/description, colour, and a thumbnail of that gallery's most recent
// photo) — so there's nothing to keep in sync by hand as galleries change.
const REAL_GALLERY_IDS = [
  'all-that-is', 'skies', 'mountains', 'rivers', 'waterfalls', 'coastlines',
  'forests', 'wildflowers', 'creatures', 'portraits', 'streets', 'story',
  'in-the-zone', 'tathata', 'golden-hour', 'night', 'fungi', 'wabi-sabi',
];

async function buildRandomGalleryTeasers() {
  const container = document.getElementById('random-gallery-teasers');
  if (!container) return; // not the homepage

  try {
    const res = await fetch('galleries.html');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const shuffled = [...REAL_GALLERY_IDS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const picked = shuffled.slice(0, 3);

    const cardsHtml = await Promise.all(picked.map(async (galleryId) => {
      const section = doc.querySelector('#' + galleryId);
      if (!section) return '';
      const eyebrow = section.querySelector('.section-head .eyebrow');
      const h2 = section.querySelector('.section-head h2');
      const desc = section.querySelector('.section-head p');
      const imgs = Array.from(section.querySelectorAll('.frame-photo img'));

      let thumbSrc = imgs.length ? imgs[0].getAttribute('src') : null;
      if (imgs.length && typeof EXIF !== 'undefined') {
        const withDates = await Promise.all(imgs.map((img) => new Promise((resolve) => {
          const src = img.getAttribute('src');
          const im = new Image();
          im.onload = function () {
            EXIF.getData(im, function () {
              const dateStr = EXIF.getTag(this, 'DateTimeOriginal') || EXIF.getTag(this, 'DateTime');
              resolve({ src, date: parseExifDate(dateStr) });
            });
          };
          im.onerror = function () { resolve({ src, date: null }); };
          loadImageWithFallback(im, src);
        })));
        withDates.sort((a, b) => (b.date || 0) - (a.date || 0));
        if (withDates[0]) thumbSrc = withDates[0].src;
      }

      const descText = desc ? desc.textContent.split('.')[0] + '.' : '';
      const thumbImg = thumbSrc ? `<img src="${thumbOf(thumbSrc)}" alt="" loading="lazy" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='${thumbSrc}'}">` : '';

      return `<a href="galleries.html#${galleryId}" class="card focus-ring" style="text-decoration:none;">
        <div class="card-thumb">${thumbImg}</div>
        ${eyebrow ? eyebrow.outerHTML : ''}
        <h3>${h2 ? h2.innerHTML : ''}</h3>
        <p>${descText}</p>
      </a>`;
    }));

    container.innerHTML = cardsHtml.join('');
  } catch (err) {
    console.error('Could not build random gallery teasers:', err);
    container.innerHTML = '<p class="muted center" style="grid-column:1/-1;">Could not load galleries — check the console for details.</p>';
  }
}
