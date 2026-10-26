"""Builds the Android launcher icons and splash screens from frontend/public/campus1cloud-logo.png.
Run from the repo root: python3 tools/make_icons.py   (needs Pillow)"""
import glob, os
from PIL import Image

LOGO = Image.open('frontend/public/campus1cloud-logo.png').convert('RGB')
RES = 'android/app/src/main/res'
WHITE = (255, 255, 255)

def ink_bbox(img, thr=235):
    g = img.convert('L').point(lambda v: 255 if v < thr else 0)
    return g.getbbox()

# the cloud-and-cap mark only (the top part, above the "campus1cloud" word)
w, h = LOGO.size
mark = LOGO.crop((0, 0, w, int(h * 0.68)))
mark = mark.crop(ink_bbox(mark))
full = LOGO.crop(ink_bbox(LOGO))

def fit(img, box_w, box_h):
    s = min(box_w / img.width, box_h / img.height)
    return img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)

def canvas(size, content, scale, bg=WHITE):
    c = Image.new('RGBA', size, bg + (255,) if bg else (0, 0, 0, 0))
    m = fit(content, size[0] * scale, size[1] * scale)
    c.paste(m, ((size[0] - m.width) // 2, (size[1] - m.height) // 2))
    return c

def make_transparent(img):
    """white -> transparent, so the adaptive foreground sits on the icon background colour."""
    img = img.convert('RGBA'); px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, _ = px[x, y]; m = min(r, g, b)
            a = 0 if m >= 245 else 255 if m <= 200 else int((245 - m) / 45 * 255)
            px[x, y] = (r, g, b, a)
    return img

dens = {'mdpi': (48, 108), 'hdpi': (72, 162), 'xhdpi': (96, 216), 'xxhdpi': (144, 324), 'xxxhdpi': (192, 432)}
for d, (leg, fg) in dens.items():
    out = f'{RES}/mipmap-{d}'
    os.makedirs(out, exist_ok=True)
    canvas((leg, leg), mark, 0.88).convert('RGB').save(f'{out}/ic_launcher.png')
    round_ = canvas((leg, leg), mark, 0.78)
    mask = Image.new('L', (leg, leg), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).ellipse((0, 0, leg - 1, leg - 1), fill=255)
    round_.putalpha(mask); round_.save(f'{out}/ic_launcher_round.png')
    # adaptive foreground: the mark inside the 66% safe zone, transparent background
    make_transparent(canvas((fg, fg), mark, 0.58)).save(f'{out}/ic_launcher_foreground.png')

# splash: white screen with the full logo, same sizes as the files Capacitor generated
for f in glob.glob(f'{RES}/drawable*/splash.png'):
    sz = Image.open(f).size
    canvas(sz, full, 0.55 if sz[0] < sz[1] else 0.4).convert('RGB').save(f)
print('icons and splash written')
