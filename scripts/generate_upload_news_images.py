import io
import json
import math
import os
import random
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from create_reliable_news import (
    API_BASE,
    NEWS,
    SPANISH_LANGUAGE_ID,
    content_html,
)


ROOT = Path.cwd()
COVERS_DIR = ROOT / "assets" / "news_covers"
REPORT_PATH = ROOT / "uploaded_news_images.json"
FONT_BOLD = "C:/Windows/Fonts/seguibl.ttf"
FONT_SEMIBOLD = "C:/Windows/Fonts/seguisb.ttf"
FONT_REGULAR = "C:/Windows/Fonts/SegUIVar.ttf"

THEMES = [
    {"name": "salud mental", "palette": [(12, 31, 68), (29, 111, 147), (131, 214, 205)], "motif": "mind"},
    {"name": "tecnologia movil", "palette": [(16, 24, 39), (67, 56, 202), (45, 212, 191)], "motif": "phone"},
    {"name": "juventud", "palette": [(30, 41, 59), (219, 39, 119), (250, 204, 21)], "motif": "generation"},
    {"name": "mercado", "palette": [(6, 78, 59), (20, 184, 166), (244, 181, 48)], "motif": "growth"},
    {"name": "alerta social", "palette": [(69, 10, 10), (220, 38, 38), (251, 146, 60)], "motif": "risk"},
    {"name": "apuestas deportivas", "palette": [(15, 23, 42), (37, 99, 235), (34, 197, 94)], "motif": "sport"},
]


def post_multipart_file(path, token, file_path, retries=3):
    boundary = f"----codexBoundary{int(time.time() * 1000)}"
    file_name = file_path.name
    file_bytes = file_path.read_bytes()
    body = io.BytesIO()
    body.write(f"--{boundary}\r\n".encode())
    body.write(
        f'Content-Disposition: form-data; name="file"; filename="{file_name}"\r\n'.encode()
    )
    body.write(b"Content-Type: image/png\r\n\r\n")
    body.write(file_bytes)
    body.write(f"\r\n--{boundary}--\r\n".encode())
    data = body.getvalue()

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(data)),
    }
    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method="POST")
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if not payload.get("status", False):
                    raise RuntimeError(f"API status=false: {payload}")
                return payload
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, RuntimeError):
            if attempt == retries:
                raise
            time.sleep(1.5 * attempt)


def put_json(path, token, body, retries=3):
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method="PUT")
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if not payload.get("status", False):
                    raise RuntimeError(f"API status=false: {payload}")
                return payload
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, RuntimeError):
            if attempt == retries:
                raise
            time.sleep(1.5 * attempt)


def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9áéíóúñü]+", "-", text, flags=re.IGNORECASE)
    return text.strip("-")[:70]


def lerp(a, b, t):
    return int(a + (b - a) * t)


def gradient_background(width, height, palette):
    img = Image.new("RGB", (width, height), palette[0])
    pix = img.load()
    c1, c2, c3 = palette
    for y in range(height):
        for x in range(width):
            tx = x / width
            ty = y / height
            t = (tx * 0.65 + ty * 0.35)
            mid = tuple(lerp(c1[i], c2[i], min(1, t * 1.35)) for i in range(3))
            glow = max(0, 1 - math.dist((tx, ty), (0.78, 0.22)) * 1.8)
            pix[x, y] = tuple(lerp(mid[i], c3[i], glow * 0.55) for i in range(3))
    return img


def font(size, bold=False, semibold=False):
    path = FONT_BOLD if bold else FONT_SEMIBOLD if semibold else FONT_REGULAR
    return ImageFont.truetype(path, size)


def wrap_text(draw, text, font_obj, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=font_obj)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_glass_panel(draw, box, radius=42):
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=radius, fill=(255, 255, 255, 32), outline=(255, 255, 255, 84), width=2)
    draw.line((x1 + 30, y1 + 2, x2 - 30, y1 + 2), fill=(255, 255, 255, 105), width=2)


def draw_phone(draw, cx, cy, scale, accent):
    w, h = int(210 * scale), int(360 * scale)
    x1, y1 = cx - w // 2, cy - h // 2
    draw.rounded_rectangle((x1, y1, x1 + w, y1 + h), radius=int(36 * scale), fill=(8, 13, 30), outline=(255, 255, 255, 130), width=max(2, int(4 * scale)))
    draw.rounded_rectangle((x1 + 18, y1 + 48, x1 + w - 18, y1 + h - 28), radius=int(22 * scale), fill=(255, 255, 255, 30))
    for i, val in enumerate([0.42, 0.68, 0.32, 0.78]):
        y = y1 + 90 + i * int(48 * scale)
        draw.rounded_rectangle((x1 + 38, y, x1 + int(w * val), y + int(20 * scale)), radius=8, fill=accent + (210,))
    draw.ellipse((cx - int(20 * scale), y1 + h - int(52 * scale), cx + int(20 * scale), y1 + h - int(12 * scale)), fill=(255, 255, 255, 120))


def draw_growth(draw, cx, cy, scale, accent):
    base_y = cy + int(130 * scale)
    for i, h in enumerate([90, 140, 210, 290]):
        x = cx - int(190 * scale) + i * int(105 * scale)
        draw.rounded_rectangle((x, base_y - int(h * scale), x + int(62 * scale), base_y), radius=14, fill=accent + (210,))
    points = [
        (cx - int(185 * scale), base_y - int(105 * scale)),
        (cx - int(80 * scale), base_y - int(170 * scale)),
        (cx + int(20 * scale), base_y - int(210 * scale)),
        (cx + int(150 * scale), base_y - int(330 * scale)),
    ]
    draw.line(points, fill=(255, 255, 255, 220), width=max(4, int(8 * scale)))
    draw.polygon([(points[-1][0], points[-1][1]), (points[-1][0] - 30, points[-1][1] + 8), (points[-1][0] - 8, points[-1][1] + 32)], fill=(255, 255, 255, 220))


def draw_mind(draw, cx, cy, scale, accent):
    r = int(150 * scale)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(255, 255, 255, 180), width=max(3, int(6 * scale)))
    for angle in range(0, 360, 45):
        ax = cx + int(math.cos(math.radians(angle)) * r * 0.52)
        ay = cy + int(math.sin(math.radians(angle)) * r * 0.52)
        bx = cx + int(math.cos(math.radians(angle + 28)) * r * 0.88)
        by = cy + int(math.sin(math.radians(angle + 28)) * r * 0.88)
        draw.line((ax, ay, bx, by), fill=accent + (190,), width=max(2, int(4 * scale)))
        draw.ellipse((bx - 10, by - 10, bx + 10, by + 10), fill=(255, 255, 255, 210))
    draw.arc((cx - r // 2, cy - r // 2, cx + r // 2, cy + r // 2), 20, 320, fill=(255, 255, 255, 210), width=max(3, int(6 * scale)))


def draw_risk(draw, cx, cy, scale, accent):
    size = int(260 * scale)
    pts = [(cx, cy - size // 2), (cx - size // 2, cy + size // 2), (cx + size // 2, cy + size // 2)]
    draw.polygon(pts, outline=(255, 255, 255, 210), fill=accent + (120,))
    draw.line((cx, cy - int(80 * scale), cx, cy + int(45 * scale)), fill=(255, 255, 255, 230), width=max(5, int(10 * scale)))
    draw.ellipse((cx - 9, cy + int(80 * scale), cx + 9, cy + int(98 * scale)), fill=(255, 255, 255, 230))


def draw_sport(draw, cx, cy, scale, accent):
    r = int(135 * scale)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(255, 255, 255, 210), width=max(3, int(6 * scale)))
    draw.arc((cx - r, cy - r, cx + r, cy + r), 50, 130, fill=accent + (210,), width=max(3, int(8 * scale)))
    draw.arc((cx - r, cy - r, cx + r, cy + r), 230, 310, fill=accent + (210,), width=max(3, int(8 * scale)))
    draw.line((cx - r, cy, cx + r, cy), fill=(255, 255, 255, 150), width=max(2, int(4 * scale)))
    draw.line((cx, cy - r, cx, cy + r), fill=(255, 255, 255, 150), width=max(2, int(4 * scale)))
    draw.rounded_rectangle((cx + int(150 * scale), cy - int(80 * scale), cx + int(250 * scale), cy + int(80 * scale)), radius=22, fill=accent + (170,), outline=(255, 255, 255, 170), width=3)


def draw_generation(draw, cx, cy, scale, accent):
    for i, offset in enumerate([-130, 0, 130]):
        r = int((55 + i * 4) * scale)
        x = cx + int(offset * scale)
        draw.ellipse((x - r, cy - int(130 * scale) - r, x + r, cy - int(130 * scale) + r), fill=(255, 255, 255, 190))
        draw.rounded_rectangle((x - int(70 * scale), cy - int(50 * scale), x + int(70 * scale), cy + int(130 * scale)), radius=42, fill=accent + (150,), outline=(255, 255, 255, 160), width=3)
    draw.arc((cx - int(250 * scale), cy - int(230 * scale), cx + int(250 * scale), cy + int(230 * scale)), 205, 335, fill=(255, 255, 255, 170), width=max(3, int(7 * scale)))


def draw_motif(draw, motif, accent, seed):
    random.seed(seed)
    cx, cy = 1205, 472
    scale = 1.0
    if motif == "phone":
        draw_phone(draw, cx, cy, scale, accent)
    elif motif == "growth":
        draw_growth(draw, cx, cy, scale, accent)
    elif motif == "risk":
        draw_risk(draw, cx, cy, scale, accent)
    elif motif == "sport":
        draw_sport(draw, cx, cy, scale, accent)
    elif motif == "generation":
        draw_generation(draw, cx, cy, scale, accent)
    else:
        draw_mind(draw, cx, cy, scale, accent)


def topic_for_title(title):
    lower = title.lower()
    if any(term in lower for term in ["celular", "digital", "online", "tecnología", "publicidad", "datos"]):
        return THEMES[1]
    if any(term in lower for term in ["jóvenes", "generaciones", "juvenil"]):
        return THEMES[2]
    if any(term in lower for term in ["ganancias", "industria", "mercado", "igaming", "crecimiento"]):
        return THEMES[3]
    if any(term in lower for term in ["riesgo", "pérdida", "deuda", "control", "daños"]):
        return THEMES[4]
    if any(term in lower for term in ["deporte", "apuestas deportivas", "partido"]):
        return THEMES[5]
    return THEMES[0]


def generate_cover(index, title, source_name):
    width, height = 1600, 900
    theme = topic_for_title(title)
    palette = theme["palette"]
    accent = palette[2]
    img = gradient_background(width, height, palette).convert("RGBA")

    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow, "RGBA")
    random.seed(index * 97)
    for _ in range(11):
        x = random.randint(650, 1650)
        y = random.randint(-80, 940)
        r = random.randint(55, 210)
        color = random.choice(palette)
        gd.ellipse((x - r, y - r, x + r, y + r), fill=color + (random.randint(32, 78),))
    glow = glow.filter(ImageFilter.GaussianBlur(18))
    img = Image.alpha_composite(img, glow)

    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")

    for i in range(-200, width + 250, 125):
        draw.line((i, height, i + 420, -50), fill=(255, 255, 255, 18), width=2)

    draw_glass_panel(draw, (82, 96, 920, 788))
    draw_motif(draw, theme["motif"], accent, index)

    small_font = font(32, semibold=True)
    badge_font = font(25, semibold=True)
    title_font = font(68, bold=True)
    source_font = font(28)

    draw.rounded_rectangle((128, 138, 416, 194), radius=24, fill=accent + (220,))
    draw.text((154, 150), "NOTICIA VERIFICADA", fill=(10, 18, 32, 255), font=badge_font)

    lines = wrap_text(draw, title, title_font, 700)
    if len(lines) > 4:
        title_font = font(58, bold=True)
        lines = wrap_text(draw, title, title_font, 700)
    y = 252
    for line in lines[:5]:
        draw.text((128, y), line, fill=(255, 255, 255, 255), font=title_font)
        y += int(title_font.size * 1.08)

    draw.line((128, 652, 710, 652), fill=accent + (230,), width=5)
    draw.text((128, 686), "Fuente", fill=(255, 255, 255, 165), font=small_font)
    source_lines = wrap_text(draw, source_name, source_font, 650)
    sy = 730
    for line in source_lines[:2]:
        draw.text((128, sy), line, fill=(255, 255, 255, 225), font=source_font)
        sy += 36

    draw.text((1360, 790), f"{index:02d}/25", fill=(255, 255, 255, 120), font=font(42, bold=True))
    img = Image.alpha_composite(img, overlay).convert("RGB")
    return img


def main():
    token = os.environ.get("GAMBLER_ADMIN_TOKEN")
    if not token:
        raise SystemExit("Set GAMBLER_ADMIN_TOKEN before running this script.")

    with open(ROOT / "created_reliable_news.json", encoding="utf-8") as source:
        created = json.load(source)
    ids_by_title = {item["title"]: item["newsId"] for item in created}

    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    report = []

    for index, item in enumerate(NEWS, start=1):
        news_id = ids_by_title[item["title"]]
        file_path = COVERS_DIR / f"{index:02d}-{slugify(item['title'])}.png"
        image = generate_cover(index, item["title"], item["source_name"])
        image.save(file_path, "PNG", optimize=True)
        upload = post_multipart_file("/api/Media/upload", token, file_path)
        media_url = upload["data"]["url"]

        update_body = {
            "newsId": news_id,
            "languageId": SPANISH_LANGUAGE_ID,
            "title": item["title"],
            "mediaUrl": media_url,
            "mediaType": 0,
            "contentHtml": content_html(
                item["summary"],
                item["why"],
                item["reality"],
                item["source_name"],
                item["source_url"],
            ),
        }
        put_json("/api/News/updateNews", token, update_body)
        print(f"[{index:02d}/25] Uploaded and updated: {news_id} -> {media_url}")
        report.append({
            "newsId": news_id,
            "title": item["title"],
            "localImage": str(file_path),
            "mediaUrl": media_url,
            "s3Key": upload["data"].get("key"),
            "sizeBytes": upload["data"].get("sizeBytes"),
        })

    with open(REPORT_PATH, "w", encoding="utf-8") as output:
        json.dump(report, output, ensure_ascii=False, indent=2)
    print(f"Report written: {REPORT_PATH}")


if __name__ == "__main__":
    main()
