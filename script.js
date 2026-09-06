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

// Direct photo list — no need to fetch galleries.html.
// These are your actual photos in the /photos folder.
const allPhotos = [
  { src: 'photos/wildflowers-01.jpg', alt: 'Southwest WA' },
  { src: 'photos/wildflowers-02.jpg', alt: 'Southwest WA' },
  { src: 'photos/wildflowers-03.jpg', alt: 'Southwest WA' },
  { src: 'photos/wildflowers-04.jpg', alt: 'Southwest WA' },
  { src: 'photos/wildflowers-05.jpg', alt: 'Southwest WA' },
  { src: 'photos/fungi-01.jpg', alt: 'Perth Hills' },
  { src: 'photos/fungi-02.jpg', alt: 'Perth Hills' },
  { src: 'photos/fungi-03.jpg', alt: 'Perth Hills' },
  { src: 'photos/fungi-04.jpg', alt: 'Perth Hills' },
  { src: 'photos/streets-01.jpg', alt: 'Perth' },
  { src: 'photos/streets-02.jpg', alt: 'Perth' },
  { src: 'photos/streets-03.jpg', alt: 'Perth' },
  { src: 'photos/streets-04.jpg', alt: 'Perth' },
  { src: 'photos/streets-05.jpg', alt: 'Perth' },
  { src: 'photos/coastlines-01.jpg', alt: 'Western Australia' },
  { src: 'photos/coastlines-02.jpg', alt: 'Western Australia' },
  { src: 'photos/coastlines-03.jpg', alt: 'Western Australia' },
  { src: 'photos/coastlines-04.jpg', alt: 'Western Australia' },
  { src: 'photos/coastlines-05.jpg', alt: 'Western Australia' },
  { src: 'photos/coastlines-06.jpg', alt: 'Western Australia' },
  { src: 'photos/golden-hour-01.jpg', alt: 'Sanur, Bali' },
  { src: 'photos/golden-hour-02.jpg', alt: 'Sanur, Bali' },
  { src: 'photos/golden-hour-03.jpg', alt: 'Sanur, Bali' },
  { src: 'photos/golden-hour-04.jpg', alt: 'Sanur, Bali' },
  { src: 'photos/golden-hour-05.jpg', alt: 'Sanur, Bali' },
  { src: 'photos/golden-hour-06.jpg', alt: 'Sanur, Bali' },
  { src: 'photos/golden-hour-07.jpg', alt: 'Perth' },
  { src: 'photos/golden-hour-08.jpg', alt: 'Perth' },
  { src: 'photos/golden-hour-09.jpg', alt: 'Perth' },
  { src: 'photos/golden-hour-10.jpg', alt: 'Perth' },
  { src: 'photos/golden-hour-11.jpg', alt: 'Perth' },
  { src: 'photos/waterfalls-01.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-01.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-02.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-03.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-04.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-05.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-06.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-07.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-08.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-09.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-10.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-11.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-12.jpg', alt: 'Western Australia' },
  { src: 'photos/creatures-13.jpg', alt: 'Western Australia' },
  { src: 'photos/portraits-01.jpg', alt: 'Perth' },
  { src: 'photos/portraits-02.jpg', alt: 'Perth' },
  { src: 'photos/portraits-03.jpg', alt: 'Perth' },
  { src: 'photos/portraits-04.jpg', alt: 'Perth' },
  { src: 'photos/portraits-05.jpg', alt: 'Perth' },
  { src: 'photos/portraits-06.jpg', alt: 'Perth' },
  { src: 'photos/portraits-07.jpg', alt: 'Perth' },
  { src: 'photos/portraits-08.jpg', alt: 'Perth' },
  { src: 'photos/portraits-09.jpg', alt: 'Perth' },
  { src: 'photos/portraits-10.jpg', alt: 'Perth' },
  { src: 'photos/portraits-11.jpg', alt: 'Perth' },
  { src: 'photos/portraits-12.jpg', alt: 'Perth' },
  { src: 'photos/portraits-13.jpg', alt: 'Perth' },
  { src: 'photos/portraits-14.jpg', alt: 'Perth' },
  { src: 'photos/portraits-15.jpg', alt: 'Perth' },
  { src: 'photos/portraits-16.jpg', alt: 'Perth' },
  { src: 'photos/portraits-17.jpg', alt: 'Perth' },
  { src: 'photos/portraits-18.jpg', alt: 'Perth' },
  { src: 'photos/portraits-19.jpg', alt: 'Perth' },
  { src: 'photos/portraits-20.jpg', alt: 'Perth' },
  { src: 'photos/portraits-21.jpg', alt: 'Perth' },
  { src: 'photos/portraits-22.jpg', alt: 'Perth' },
  { src: 'photos/portraits-23.jpg', alt: 'Perth' },
  { src: 'photos/portraits-24.jpg', alt: 'Perth' },
  { src: 'photos/portraits-25.jpg', alt: 'Perth' },
  { src: 'photos/portraits-26.jpg', alt: 'Perth' },
  { src: 'photos/portraits-27.jpg', alt: 'Perth' },
  { src: 'photos/portraits-28.jpg', alt: 'Perth' },
  { src: 'photos/portraits-29.jpg', alt: 'Perth' },
  { src: 'photos/portraits-30.jpg', alt: 'Perth' },
  { src: 'photos/portraits-31.jpg', alt: 'Perth' },
  { src: 'photos/portraits-32.jpg', alt: 'Perth' },
  { src: 'photos/portraits-33.jpg', alt: 'Perth' },
  { src: 'photos/portraits-35.jpg', alt: 'Perth' },
  { src: 'photos/portraits-36.jpg', alt: 'Perth' },
  { src: 'photos/portraits-37.jpg', alt: 'Perth' },
  { src: 'photos/portraits-38.jpg', alt: 'Perth' },
  { src: 'photos/night-01.jpg', alt: 'Perth' },
  { src: 'photos/night-02.jpg', alt: 'Perth' },
  { src: 'photos/night-03.jpg', alt: 'Perth' },
  { src: 'photos/night-04.jpg', alt: 'Perth' },
  { src: 'photos/night-05.jpg', alt: 'Perth' },
  { src: 'photos/night-06.jpg', alt: 'Perth' },
  { src: 'photos/night-07.jpg', alt: 'Perth' },
  { src: 'photos/night-08.jpg', alt: 'Perth' },
  { src: 'photos/night-09.jpg', alt: 'Perth' },
  { src: 'photos/story-01.jpg', alt: 'Untitled' },
  { src: 'photos/story-02.jpg', alt: 'Untitled' },
  { src: 'photos/story-03.jpg', alt: 'Untitled' },
  { src: 'photos/story-04.jpg', alt: 'Untitled' },
  { src: 'photos/story-05.jpg', alt: 'Untitled' },
  { src: 'photos/story-06.jpg', alt: 'Untitled' },
  { src: 'photos/story-07.jpg', alt: 'Untitled' },
  { src: 'photos/story-08.jpg', alt: 'Untitled' },
  { src: 'photos/story-09.jpg', alt: 'Untitled' },
  { src: 'photos/story-10.jpg', alt: 'Untitled' },
  { src: 'photos/story-11.jpg', alt: 'Untitled' },
  { src: 'photos/story-12.jpg', alt: 'Untitled' },
  { src: 'photos/story-13.jpg', alt: 'Untitled' },
  { src: 'photos/story-14.jpg', alt: 'Untitled' },
  { src: 'photos/story-15.jpg', alt: 'Untitled' },
  { src: 'photos/story-16.jpg', alt: 'Untitled' },
  { src: 'photos/story-17.jpg', alt: 'Untitled' },
  { src: 'photos/story-18.jpg', alt: 'Untitled' },
  { src: 'photos/story-19.jpg', alt: 'Untitled' },
  { src: 'photos/story-20.jpg', alt: 'Untitled' },
  { src: 'photos/story-21.jpg', alt: 'Untitled' },
  { src: 'photos/P6200085.jpg', alt: 'Untitled' },
  { src: 'photos/P6200086.jpg', alt: 'Untitled' },
  { src: 'photos/P6200101.jpg', alt: 'Untitled' },
  { src: 'photos/P6280204.jpg', alt: 'Untitled' },
  { src: 'photos/P6280244.jpg', alt: 'Untitled' },
  { src: 'photos/P7040268.jpg', alt: 'Untitled' },
  { src: 'photos/P7070399 (2).jpg', alt: 'Untitled' },
  { src: 'photos/P7070401 (2).jpg', alt: 'Untitled' },
  { src: 'photos/P7070402 (2).jpg', alt: 'Untitled' },
  { src: 'photos/P7080471 (3).jpg', alt: 'Untitled' },
  { src: 'photos/P7120605.jpg', alt: 'Untitled' },
  { src: 'photos/P7120606.jpg', alt: 'Untitled' },
  { src: 'photos/P7130640.02.jpg', alt: 'Untitled' },
  { src: 'photos/P7130643.jpg', alt: 'Untitled' },
  { src: 'photos/P7130667.01 (2).jpg', alt: 'Untitled' },
  { src: 'photos/P7130691.01.jpg', alt: 'Untitled' },
  { src: 'photos/P7130702.01.jpg', alt: 'Untitled' },
  { src: 'photos/P7130715.jpg', alt: 'Untitled' },
  { src: 'photos/P7150768.jpg', alt: 'Untitled' },
  { src: 'photos/P7150783.jpg', alt: 'Untitled' },
  { src: 'photos/P7150808.jpg', alt: 'Untitled' },
  { src: 'photos/P7150839.jpg', alt: 'Untitled' },
  { src: 'photos/P7150840.jpg', alt: 'Untitled' },
  { src: 'photos/about-01.jpg', alt: 'Untitled' },
];

// Homepage-only: display the last 6 photos from the full list
// If you upload new photos in the future, update the allPhotos array above
function buildHomepageContactSheet() {
  const container = document.querySelector('#auto-contact-sheet');
  if (!container) return; // not the homepage

  if (allPhotos.length === 0) {
    container.innerHTML = '<p class="muted center" style="grid-column:1/-1;">Add photos to your galleries and they\'ll appear here automatically.</p>';
    return;
  }

  // Get the latest 6 photos (last 6 in the array)
  const latest6 = allPhotos.slice(-6).reverse();

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
}
