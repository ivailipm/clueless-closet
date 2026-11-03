# Usage: python3 scripts/make-lace.py src/shared/lace.svg [seed]
"""Generate a seamless red-lace SVG tile: fishnet ground, honeycomb patches, flowers, leaves and swirls."""
import math, random, sys
random.seed(int(sys.argv[2]) if len(sys.argv) > 2 else 5)
T = 280
RED, DEEP, CREAM = '#A3192F', '#7E1022', '#F3E6DA'
out = []

def wrap(draw, x, y, r):
    """Draw a motif and its copies across tile edges so the tile repeats seamlessly."""
    for dx in (-T, 0, T):
        for dy in (-T, 0, T):
            if -r < x + dx < T + r and -r < y + dy < T + r:
                draw(x + dx, y + dy)

def petal(cx, cy, ang, length, width):
    a = math.radians(ang)
    tip = (cx + length * math.cos(a), cy + length * math.sin(a))
    nx, ny = -math.sin(a), math.cos(a)
    c1 = (cx + length * .55 * math.cos(a) + width * nx, cy + length * .55 * math.sin(a) + width * ny)
    c2 = (cx + length * .55 * math.cos(a) - width * nx, cy + length * .55 * math.sin(a) - width * ny)
    return f'M{cx:.1f} {cy:.1f} Q{c1[0]:.1f} {c1[1]:.1f} {tip[0]:.1f} {tip[1]:.1f} Q{c2[0]:.1f} {c2[1]:.1f} {cx:.1f} {cy:.1f}Z'

def flower(x, y, size, rot):
    def d(x, y):
        n = 6
        for i in range(n):
            ang = rot + i * 360 / n
            p = petal(x, y, ang, size, size * .62)
            out.append(f'<path d="{p}" fill="url(#dots)" stroke="{RED}" stroke-width="2.4"/>')
            # inner vein
            a = math.radians(ang)
            out.append(f'<path d="M{x + size*.25*math.cos(a):.1f} {y + size*.25*math.sin(a):.1f} L{x + size*.8*math.cos(a):.1f} {y + size*.8*math.sin(a):.1f}" stroke="{RED}" stroke-width="1.4"/>')
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{size*.26:.1f}" fill="{RED}"/>')
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{size*.14:.1f}" fill="none" stroke="{CREAM}" stroke-width="1.2" stroke-dasharray="1.5 2"/>')
    wrap(d, x, y, size + 4)

def leaf(x, y, length, ang):
    def d(x, y):
        p = petal(x, y, ang, length * 1.15, length * .45)
        out.append(f'<path d="{p}" fill="{RED}" stroke="{DEEP}" stroke-width="1"/>')
        a = math.radians(ang)
        out.append(f'<path d="M{x:.1f} {y:.1f} L{x + length*.85*math.cos(a):.1f} {y + length*.85*math.sin(a):.1f}" stroke="{CREAM}" stroke-width="1" stroke-dasharray="2 2"/>')
    wrap(d, x, y, length + 2)

def swirl(x, y, r, turns, rot, cw=1):
    def d(x, y):
        pts = []
        steps = int(60 * turns)
        for i in range(steps + 1):
            t = i / steps
            ang = math.radians(rot) + cw * t * turns * 2 * math.pi
            rr = r * (1 - t * .85)
            pts.append((x + rr * math.cos(ang), y + rr * math.sin(ang)))
        path = 'M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in pts)
        out.append(f'<path d="{path}" fill="none" stroke="{RED}" stroke-width="7" stroke-linecap="round"/>')
        out.append(f'<path d="{path}" fill="none" stroke="{CREAM}" stroke-width="1.3" stroke-dasharray="1.5 3" stroke-linecap="round"/>')
        ex, ey = pts[-1]
        out.append(f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="6" fill="{RED}"/>')
    wrap(d, x, y, r + 6)

def patch(x, y, r):
    jit = [random.uniform(.78, 1.12) for _ in range(14)]
    def d(x, y):
        pts = [(x + r*j*math.cos(i*2*math.pi/14), y + r*j*math.sin(i*2*math.pi/14)) for i, j in enumerate(jit)]
        path = 'M' + ' '.join(f'{(pts[i][0]+pts[(i+1)%14][0])/2:.1f} {(pts[i][1]+pts[(i+1)%14][1])/2:.1f} Q{pts[(i+1)%14][0]:.1f} {pts[(i+1)%14][1]:.1f}' for i in range(14))
        # turn "a b Qc d" sequence into a closed smooth path
        segs = []
        for i in range(14):
            p0 = ((pts[i][0]+pts[(i+1)%14][0])/2, (pts[i][1]+pts[(i+1)%14][1])/2)
            c = pts[(i+1)%14]
            p1 = ((pts[(i+1)%14][0]+pts[(i+2)%14][0])/2, (pts[(i+1)%14][1]+pts[(i+2)%14][1])/2)
            segs.append((p0, c, p1))
        path = f'M{segs[0][0][0]:.1f} {segs[0][0][1]:.1f} ' + ' '.join(f'Q{c[0]:.1f} {c[1]:.1f} {p1[0]:.1f} {p1[1]:.1f}' for _, c, p1 in segs) + 'Z'
        out.append(f'<path d="{path}" fill="url(#comb)" stroke="{RED}" stroke-width="2.2"/>')
    wrap(d, x, y, r*1.15 + 2)

def stem(x1, y1, x2, y2, bend):
    def d(dx, dy):
        mx, my = (x1 + x2) / 2 + bend, (y1 + y2) / 2 - bend
        out.append(f'<path d="M{x1+dx:.1f} {y1+dy:.1f} Q{mx+dx:.1f} {my+dy:.1f} {x2+dx:.1f} {y2+dy:.1f}" fill="none" stroke="{RED}" stroke-width="5" stroke-linecap="round"/>')
    for ox in (-T, 0, T):
        for oy in (-T, 0, T):
            d(ox, oy)

# Layout: two big flowers on honeycomb, linked by scrolling stems, with leaves and swirls filling the gaps
patch(70, 70, 62); patch(205, 200, 66); patch(215, 45, 30); patch(55, 220, 34)
stem(70, 70, 205, 200, 45); stem(205, 200, 350, 330, -40); stem(-75, -60, 70, 70, -40)
stem(70, 70, 215, 45, -25); stem(205, 200, 55, 220, 20)
swirl(150, 120, 38, 1.7, 200); swirl(130, 255, 30, 1.5, 20, -1); swirl(255, 120, 32, 1.6, 300, -1); swirl(20, 145, 30, 1.5, 120)
for (lx, ly, ln, la) in [(110, 95, 32, -30), (118, 120, 28, 70), (160, 175, 32, 210), (170, 150, 28, 120),
                         (30, 105, 28, 240), (100, 30, 26, -70), (240, 160, 28, -50), (245, 240, 28, 40),
                         (175, 245, 26, 160), (225, 85, 24, 100), (40, 175, 26, 300), (265, 15, 22, 150),
                         (90, 200, 24, 20), (15, 60, 22, 200)]:
    leaf(lx, ly, ln, la)
flower(70, 70, 44, 10)
flower(205, 200, 48, 40)
for (dx, dy) in [(130, 30), (110, 170), (260, 75), (20, 260), (160, 90), (230, 270)]:
    def berries(x, y):
        for k in range(5):
            out.append(f'<circle cx="{x + 7*math.cos(k*1.3):.1f}" cy="{y + 7*math.sin(k*1.3):.1f}" r="3.2" fill="{RED}"/>')
    wrap(berries, dx, dy, 12)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{T}" height="{T}" viewBox="0 0 {T} {T}">
<defs>
<pattern id="net" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 5 L5 0 L10 5 L5 10 Z" fill="none" stroke="{RED}" stroke-width="1" opacity=".9"/></pattern>
<pattern id="comb" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="{CREAM}"/><circle cx="4" cy="4" r="3" fill="none" stroke="{RED}" stroke-width="1"/></pattern>
<pattern id="dots" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#B42A40"/><circle cx="2.5" cy="2.5" r=".9" fill="{CREAM}"/></pattern>
</defs>
<rect width="{T}" height="{T}" fill="{CREAM}"/>
<rect width="{T}" height="{T}" fill="url(#net)"/>
{chr(10).join(out)}
</svg>'''
open(sys.argv[1], 'w').write(svg)
print(len(svg))
