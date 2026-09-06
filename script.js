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

  // Contact form (static placeholder — no backend)
  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = document.querySelector('#form-status');
      if (status) {
        status.textContent = "This is a placeholder form — connect it to a form service (e.g. Formspree) or backend to actually receive messages.";
        status.classList.add('accent-amber');
      }
    });
  }

  // Auto-fill aperture/shutter/ISO captions from each photo's real EXIF data,
  // then (on the homepage only) auto-build the "6 latest" contact sheet.
  autoFillExifCaptions();
  buildHomepageContactSheet();
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
    EXIF.getData(img, function () {
      const tags = {
        FNumber: EXIF.getTag(this, 'FNumber'),
        ExposureTime: EXIF.getTag(this, 'ExposureTime'),
        ISOSpeedRatings: EXIF.getTag(this, 'ISOSpeedRatings'),
      };
      span.textContent = formatExifCaption(tags);
    });
  });
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
            im.src = p.src;
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
          <div class="frame-photo"><img src="${p.src}" alt="${p.alt}" style="width:100%; height:100%; object-fit:cover;"></div>
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
