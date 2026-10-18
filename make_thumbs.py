#!/usr/bin/env python3
"""
make_thumbs.py  -  makes small "thumbnail" copies of your site photos.

WHY: the gallery grids only show photos about 380 pixels wide, but were loading
the full 2000 pixel originals. This makes a small copy of each photo (about
900 pixels on the long side) in  photos/thumbs/  . The grids load the small
copies; the full-size photo only loads when a visitor clicks to enlarge it.

YOUR ORIGINAL PHOTOS ARE NEVER CHANGED.

HOW TO RUN
  1. Put this file in your site folder, next to galleries.html and the
     "photos" folder.
  2. One-off setup (needs Python 3): open a terminal/command prompt and run
         pip install pillow
     (on Windows, if that fails, try:  py -m pip install pillow )
  3. In the same terminal, in the site folder, run
         python make_thumbs.py
     (on Windows, if that fails, try:  py make_thumbs.py )
  4. Upload/copy the new photos/thumbs folder along with everything else.

Run it again whenever you add photos. It skips thumbnails that already exist
and are up to date, so it only does the new ones.

If a thumbnail is ever missing, the site simply uses the full-size photo
instead - nothing breaks, it just loads a bit slower.
"""
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is not installed. Run:  pip install pillow   (then run this again)")

MAX_SIDE = 900      # long side of the thumbnail, in pixels
QUALITY = 80        # JPEG quality (80 looks good and keeps files small)
EXTS = {".jpg", ".jpeg", ".png"}

here = Path(__file__).resolve().parent
photos = here / "photos"
thumbs = photos / "thumbs"

if not photos.is_dir():
    sys.exit(f"Can't find a 'photos' folder next to this script ({here}).")
thumbs.mkdir(exist_ok=True)

made = skipped = failed = 0
bytes_full = bytes_thumb = 0

for src in sorted(photos.iterdir()):
    if not src.is_file() or src.suffix.lower() not in EXTS:
        continue
    dst = thumbs / src.name
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        skipped += 1
        continue
    try:
        with Image.open(src) as im:
            exif = im.getexif()                  # keep shutter/aperture/ISO/date for the captions
            im = ImageOps.exif_transpose(im)     # bake in any rotation...
            exif[0x0112] = 1                     # ...and mark it as upright, so it isn't rotated twice
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            if src.suffix.lower() == ".png":
                im.save(dst, optimize=True)
            else:
                im.convert("RGB").save(dst, "JPEG", quality=QUALITY, optimize=True,
                                       progressive=True, exif=exif)
        bytes_full += src.stat().st_size
        bytes_thumb += dst.stat().st_size
        made += 1
    except Exception as e:
        failed += 1
        print(f"  could not do {src.name}: {e}")

print(f"\nDone. Made {made}, already up to date {skipped}, failed {failed}.")
if made:
    print(f"Those {made} photos: {bytes_full/1e6:.1f} MB of originals -> {bytes_thumb/1e6:.1f} MB of thumbnails "
          f"({100 - 100*bytes_thumb/bytes_full:.0f}% smaller for the grids).")
