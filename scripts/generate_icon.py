import zlib
import struct
import math
import os

WIDTH = 1024
HEIGHT = 1024

def generate_islamic_icon(output_path, transparent_bg=False):
    pixels = bytearray(WIDTH * HEIGHT * 4)

    def set_pixel(x, y, r, g, b, a=255):
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            idx = (y * WIDTH + x) * 4
            if a == 255 or pixels[idx + 3] == 0:
                pixels[idx] = r
                pixels[idx + 1] = g
                pixels[idx + 2] = b
                pixels[idx + 3] = a
            else:
                # Alpha blending
                sa = a / 255.0
                da = (pixels[idx + 3] / 255.0) * (1.0 - sa)
                out_a = sa + da
                if out_a > 0:
                    pixels[idx] = int((r * sa + pixels[idx] * da) / out_a)
                    pixels[idx + 1] = int((g * sa + pixels[idx + 1] * da) / out_a)
                    pixels[idx + 2] = int((b * sa + pixels[idx + 2] * da) / out_a)
                    pixels[idx + 3] = int(out_a * 255)

    cx, cy = 512, 512
    corner_r = 240

    for y in range(HEIGHT):
        for x in range(WIDTH):
            dx = abs(x - cx)
            dy = abs(y - cy)
            
            # Check rounded squircle / circle mask
            is_inside = False
            border_dist = 0
            
            if transparent_bg:
                # Circular icon-only for adaptive icon foreground
                dist = math.hypot(x - cx, y - cy)
                if dist <= 480:
                    is_inside = True
                    border_dist = 480 - dist
            else:
                # Rounded square for full icon
                max_inner_x = 512 - corner_r
                max_inner_y = 512 - corner_r
                if dx <= max_inner_x or dy <= max_inner_y:
                    is_inside = (dx <= 490 and dy <= 490)
                else:
                    corner_dist = math.hypot(dx - max_inner_x, dy - max_inner_y)
                    is_inside = (corner_dist <= corner_r)

            if is_inside:
                # Radial Islamic emerald gradient
                dist_center = math.hypot(x - cx, y - cy) / 512.0
                # From #0F5132 to #062819
                r = int(15 * (1 - dist_center) + 6 * dist_center)
                g = int(81 * (1 - dist_center) + 40 * dist_center)
                b = int(50 * (1 - dist_center) + 25 * dist_center)
                
                # Delicate gold inner border
                dist_to_edge = math.hypot(x - cx, y - cy)
                if 455 <= dist_to_edge <= 468:
                    # Gold border
                    r, g, b = 234, 179, 8
                elif 450 <= dist_to_edge <= 454:
                    r, g, b = 202, 138, 4

                set_pixel(x, y, r, g, b, 255)
            else:
                if not transparent_bg:
                    set_pixel(x, y, 0, 0, 0, 0)

    # 1. Crescent Moon (Gold)
    crescent_cx, crescent_cy = 590, 400
    sub_cx, sub_cy = 650, 360
    r_outer = 190
    r_inner = 165

    for y in range(HEIGHT):
        for x in range(WIDTH):
            d1 = math.hypot(x - crescent_cx, y - crescent_cy)
            d2 = math.hypot(x - sub_cx, y - sub_cy)
            if d1 <= r_outer and d2 >= r_inner:
                # Warm gold gradient
                t = (y - (crescent_cy - r_outer)) / (2.0 * r_outer)
                t = max(0.0, min(1.0, t))
                gr = int(254 * (1 - t) + 217 * t)
                gg = int(224 * (1 - t) + 119 * t)
                gb = int(71 * (1 - t) + 6 * t)
                set_pixel(x, y, gr, gg, gb, 255)

    # 2. Islamic 8-Point Star
    star_cx, star_cy = 420, 330
    for y in range(star_cy - 70, star_cy + 71):
        for x in range(star_cx - 70, star_cx + 71):
            dx = abs(x - star_cx)
            dy = abs(y - star_cy)
            # Square 1: dx + dy <= 55
            # Square 2 rotated 45 deg: max(dx, dy) <= 40
            d_rot1 = dx + dy
            d_rot2 = abs(dx - dy) + max(dx, dy)
            if d_rot1 <= 58 or (dx <= 40 and dy <= 40):
                set_pixel(x, y, 254, 240, 138, 255)

    # 3. Wooden Rehal Stand
    for y in range(710, 850):
        for x in range(WIDTH):
            # Left leg: (440, 720) to (380, 840)
            # Right leg: (584, 720) to (644, 840)
            prog = (y - 720) / 120.0
            left_leg_x = 450 - prog * 70
            right_leg_x = 574 + prog * 70
            cross_x1 = 490 + prog * 60
            cross_x2 = 534 - prog * 60

            if abs(x - left_leg_x) < 18 or abs(x - right_leg_x) < 18:
                set_pixel(x, y, 113, 63, 18, 255)
            elif abs(x - cross_x1) < 14 or abs(x - cross_x2) < 14:
                set_pixel(x, y, 146, 64, 14, 255)

    # 4. Open Quran Book Base & Pages
    for y in range(HEIGHT):
        for x in range(WIDTH):
            if 500 <= y <= 730:
                # Left Page: from spine x=512 to x=280
                if 280 <= x <= 512:
                    norm_x = (512 - x) / 232.0 # 0 at spine, 1 at edge
                    curve_top = 512 + 25 * math.sin(norm_x * math.pi * 0.7) - 10 * norm_x
                    curve_bottom = 690 + 25 * math.sin(norm_x * math.pi * 0.7) - 10 * norm_x
                    if curve_top <= y <= curve_bottom:
                        # Page color (Ivory / warm cream)
                        shade = 0.9 + 0.1 * math.cos(norm_x * math.pi)
                        pr = int(255 * shade)
                        pg = int(251 * shade)
                        pb = int(235 * shade)
                        set_pixel(x, y, pr, pg, pb, 255)

                # Right Page: from spine x=512 to x=744
                elif 512 < x <= 744:
                    norm_x = (x - 512) / 232.0 # 0 at spine, 1 at edge
                    curve_top = 512 + 25 * math.sin(norm_x * math.pi * 0.7) - 10 * norm_x
                    curve_bottom = 690 + 25 * math.sin(norm_x * math.pi * 0.7) - 10 * norm_x
                    if curve_top <= y <= curve_bottom:
                        # Page color (Golden cream)
                        shade = 0.88 + 0.12 * math.cos(norm_x * math.pi)
                        pr = int(254 * shade)
                        pg = int(243 * shade)
                        pb = int(199 * shade)
                        set_pixel(x, y, pr, pg, pb, 255)

    # 5. Quran Text Lines (Gold / Amber lines)
    for row in range(5):
        line_y = 560 + row * 26
        # Left page lines
        for x in range(330, 485):
            for y in range(line_y, line_y + 4):
                set_pixel(x, y, 217, 119, 6, 230)
        # Right page lines
        for x in range(540, 695):
            for y in range(line_y, line_y + 4):
                set_pixel(x, y, 180, 83, 9, 230)

    # 6. Golden Spine & Ribbon
    for y in range(500, 730):
        for x in range(509, 516):
            set_pixel(x, y, 217, 119, 6, 255)
    # Dangling Ribbon
    for y in range(710, 780):
        ribbon_x = int(512 + 10 * math.sin((y - 710) / 20.0))
        for x in range(ribbon_x - 4, ribbon_x + 5):
            set_pixel(x, y, 245, 158, 11, 255)

    # Save PNG
    png = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', WIDTH, HEIGHT, 8, 6, 0, 0, 0)
    png += struct.pack('>I', len(ihdr)) + b'IHDR' + ihdr + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr))

    raw = bytearray()
    for y in range(HEIGHT):
        raw.append(0) # None filter
        start = y * WIDTH * 4
        raw.extend(pixels[start:start + WIDTH * 4])

    compressed = zlib.compress(bytes(raw), 9)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', zlib.crc32(b'IDAT' + compressed))

    iend = b''
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND'))

    with open(output_path, 'wb') as f:
        f.write(png)

    print(f"Generated {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == '__main__':
    os.makedirs('assets', exist_ok=True)
    generate_islamic_icon('assets/icon-only.png', transparent_bg=False)
    generate_islamic_icon('assets/icon.png', transparent_bg=False)
    generate_islamic_icon('assets/splash.png', transparent_bg=False)
