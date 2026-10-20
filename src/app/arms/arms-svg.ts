// Draws a generated coat of arms as an SVG string (viewBox around 0 0 100 120). Everything in it comes from the tables of
// arms-data.ts, never from user input.
import type { ArmsImage } from './arms-images';
import { CHARGE_DEFS, ChargeTincture, isFur, OrdinaryType, TINCTURE_COLORS, Tincture } from './arms-data';
import type { ChargeGroup, Design, Field, PatternSpec } from './arms-generator';

const SHIELD = 'M0,0 H100 V58 C100,92 78,110 50,120 C22,110 0,92 0,58 Z';
const INK = '#2a1d12';

// The heraldic drawings (~1.5 MB) are a separate chunk, loaded when the first coat of arms is shown; until then (or when the
// load fails) the animals are drawn as emoji silhouettes
let ARMS_IMAGES: Record<string, ArmsImage> = {};
export const armsImagesLoaded = (): boolean => Object.keys(ARMS_IMAGES).length > 0;
export function loadArmsImages(): Promise<void> {
  return import('./arms-images').then(m => { ARMS_IMAGES = m.ARMS_IMAGES; }, () => { });
}
const EMOJI_FONT = "'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji','Segoe UI Symbol',sans-serif";

type Pt = [number, number];
interface Box { x: number; y: number; w: number; h: number; }
const FULL: Box = { x: 0, y: 0, w: 100, h: 120 };

const f = (n: number): number => Math.round(n * 100) / 100;
const pts = (p: Pt[]): string => p.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');

class Ctx {
  defs: string[] = [];
  private n = 0;
  private known = new Set<string>();

  constructor(private prefix: string) { }

  id(kind: string): string {
    return `${this.prefix}-${kind}${this.n++}`;
  }

  // The fill of a tincture: a color, or the pattern of a fur
  fill(t: Tincture | ChargeTincture): string {
    if (t === 'ermine' || t === 'vair') {
      const id = `${this.prefix}-${t}`;
      if (!this.known.has(id)) {
        this.known.add(id);
        const white = TINCTURE_COLORS.argent;
        this.defs.push(t === 'ermine'
          ? `<pattern id="${id}" width="20" height="24" patternUnits="userSpaceOnUse"><rect width="20" height="24" fill="${white}"/>`
          + `<g fill="${TINCTURE_COLORS.sable}"><g transform="translate(10 7)">${ERMINE_SPOT}</g>`
          + `<g transform="translate(0 19)">${ERMINE_SPOT}</g><g transform="translate(20 19)">${ERMINE_SPOT}</g></g></pattern>`
          : `<pattern id="${id}" width="24" height="20" patternUnits="userSpaceOnUse"><rect width="24" height="20" fill="${white}"/>`
          + `<g fill="${TINCTURE_COLORS.azure}"><path d="M0,0 H12 L9,10 H3 Z"/><path d="M12,10 H24 L21,20 H15 Z"/></g></pattern>`);
      }
      return `url(#${id})`;
    }
    return TINCTURE_COLORS[(t === 'proper' ? 'or' : t) as keyof typeof TINCTURE_COLORS];
  }

  clip(inner: string): string {
    const id = this.id('c');
    this.defs.push(`<clipPath id="${id}">${inner}</clipPath>`);
    return id;
  }

  // A symbol is drawn as a silhouette of this tincture (or in its own colors, proper) with a dark outline
  glyphFilter(t: ChargeTincture): string {
    const id = `${this.prefix}-g-${t}`;
    if (!this.known.has(id)) {
      this.known.add(id);
      let flatNode = '';
      if (t !== 'proper') {
        const hex = this.fill(t);
        const [r, g, b] = [1, 3, 5].map(i => f(parseInt(hex.slice(i, i + 2), 16) / 255));
        // the tincture, shaded by the luminance of the symbol so its details stay visible
        const row = (c: number) => `${f(c * 0.26)} ${f(c * 0.5)} ${f(c * 0.1)} 0 ${f(c * 0.3)}`;
        flatNode = `<feColorMatrix in="SourceGraphic" type="matrix" values="${row(r)} ${row(g)} ${row(b)} 0 0 0 1 0" result="flat"/>`;
      }
      this.defs.push(`<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">`
        + `<feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="grow"/>`
        + `<feFlood flood-color="${INK}" result="ink"/><feComposite in="ink" in2="grow" operator="in" result="outline"/>${flatNode}`
        + `<feMerge><feMergeNode in="outline"/><feMergeNode in="${t === 'proper' ? 'SourceGraphic' : 'flat'}"/></feMerge></filter>`);
    }
    return id;
  }
}

const ERMINE_SPOT = '<path d="M0,-6 C1.2,-3 3.2,-1 2.2,3 L0,1.5 L-2.2,3 C-3.2,-1 -1.2,-3 0,-6Z"/>'
  + '<circle cx="-3.4" cy="-4" r="0.9"/><circle cx="3.4" cy="-4" r="0.9"/><circle cx="0" cy="5.5" r="0.9"/>';

// ---- Charges (shapes in a -50..50 square) ----------------------------------------------------------------------------

const starPath = (n: number, ro: number, ri: number): string => {
  const p: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro;
    const a = (-90 + i * 180 / n) * Math.PI / 180;
    p.push(`${f(r * Math.cos(a))},${f(r * Math.sin(a))}`);
  }
  return `M${p.join(' L')} Z`;
};
const circle = (cx: number, cy: number, r: number): string => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const hole = (r: number): string => `M${r},0 A${r},${r} 0 1 0 ${-r},0 A${r},${r} 0 1 0 ${r},0 Z`;
const arms4 = (inner: string): string => [0, 90, 180, 270].map(a => `<g transform="rotate(${a})">${inner}</g>`).join('');
const crossBase = (hw: number, ext: number): string =>
  `<path d="M${-hw},${-ext} H${hw} V${-hw} H${ext} V${hw} H${hw} V${ext} H${-hw} V${hw} H${-ext} V${-hw} H${-hw} Z"/>`;
const poly = (p: Pt[]): string => `<polygon points="${pts(p)}"/>`;

const SHAPES: Record<string, string> = {
  'cross': crossBase(11, 46),
  'crosslet': crossBase(7, 46) + arms4('<path d="M-16,-38 H16 V-30 H-16 Z"/>'),
  'patee': poly([[-16, -46], [16, -46], [6, -6], [46, -16], [46, 16], [6, 6], [16, 46], [-16, 46], [-6, 6], [-46, 16],
    [-46, -16], [-6, -6]]),
  'maltese': poly([[-14, -46], [0, -36], [14, -46], [6, -6], [46, -14], [36, 0], [46, 14], [6, 6], [14, 46], [0, 36],
    [-14, 46], [-6, 6], [-46, 14], [-36, 0], [-46, -14], [-6, -6]]),
  'moline': poly([[-16, -46], [0, -38], [16, -46], [6, -6], [46, -16], [38, 0], [46, 16], [6, 6], [16, 46], [0, 38],
    [-16, 46], [-6, 6], [-46, 16], [-38, 0], [-46, -16], [-6, -6]]),
  'patonce': crossBase(8, 34) + arms4(circle(0, -41, 9) + circle(-10, -33, 7) + circle(10, -33, 7)),
  'bottony': crossBase(6, 34) + arms4(circle(0, -41, 8) + circle(-10, -35, 7) + circle(10, -35, 7)),
  'potent': crossBase(10, 36) + arms4('<rect x="-22" y="-46" width="44" height="10"/>'),
  'flory': crossBase(7, 34) + arms4('<path d="M0,-50 L9,-40 L0,-30 L-9,-40Z"/>' + circle(-10, -33, 6) + circle(10, -33, 6)),
  'trefoil': circle(0, -19, 17) + circle(-19, 11, 17) + circle(19, 11, 17) + '<path d="M-5,18 L5,18 L9,48 L-9,48Z"/>',
  'quatrefoil': circle(0, -22, 19) + circle(22, 0, 19) + circle(0, 22, 19) + circle(-22, 0, 19) + circle(0, 0, 14),
  'cinquefoil': [0, 1, 2, 3, 4].map(i => circle(f(26 * Math.cos((-90 + 72 * i) * Math.PI / 180)),
    f(26 * Math.sin((-90 + 72 * i) * Math.PI / 180)), 17)).join('') + circle(0, 0, 16),
  'crescent': '<path d="M-38,-29.3 A48,48 0 1 0 38,-29.3 A43,43 0 1 1 -38,-29.3 Z"/>',
  'increscent': '<g transform="rotate(-90)"><path d="M-38,-29.3 A48,48 0 1 0 38,-29.3 A43,43 0 1 1 -38,-29.3 Z"/></g>',
  'decrescent': '<g transform="rotate(90)"><path d="M-38,-29.3 A48,48 0 1 0 38,-29.3 A43,43 0 1 1 -38,-29.3 Z"/></g>',
  'estoile': `<path d="${starPath(6, 48, 17)}"/>`,
  'mullet': `<path d="${starPath(5, 48, 19)}"/>`,
  'mullet-pierced': `<path fill-rule="evenodd" d="${starPath(5, 48, 19)} ${hole(9)}"/>`,
  'mullet6': `<path d="${starPath(6, 48, 22)}"/>`,
  'mullet8': `<path d="${starPath(8, 48, 24)}"/>`,
  'lozenge': poly([[0, -48], [32, 0], [0, 48], [-32, 0]]),
  'rustre': `<path fill-rule="evenodd" d="M0,-48 L32,0 L0,48 L-32,0 Z ${hole(11)}"/>`,
  'mascle': '<path fill-rule="evenodd" d="M0,-48 L32,0 L0,48 L-32,0 Z M0,-24 L-15,0 L0,24 L15,0 Z"/>',
  'roundel': circle(0, 0, 38),
  'annulet': `<path fill-rule="evenodd" d="M40,0 A40,40 0 1 0 -40,0 A40,40 0 1 0 40,0 Z ${hole(24)}"/>`,
  'fleur': '<path d="M0,-48 C14,-30 14,-10 0,6 C-14,-10 -14,-30 0,-48Z"/>'
    + '<path d="M4,-4 C30,-24 50,-8 38,14 C34,6 26,2 12,8 Z"/>'
    + '<g transform="scale(-1 1)"><path d="M4,-4 C30,-24 50,-8 38,14 C34,6 26,2 12,8 Z"/></g>'
    + '<rect x="-24" y="10" width="48" height="10" rx="3"/><path d="M-12,22 L0,48 L12,22Z"/>',
  'heart': '<path d="M0,44 C-52,6 -36,-40 0,-18 C36,-40 52,6 0,44Z"/>',
  'billet': '<rect x="-24" y="-36" width="48" height="72"/>',
};

function drawCharge(ctx: Ctx, g: ChargeGroup, tincture: ChargeTincture, x: number, y: number, size: number): string {
  const def = CHARGE_DEFS[g.key];
  const s = size / 100;
  let t = tincture;
  if (t === 'proper' && !def.natural) {
    t = 'or';
  }
  let inner: string;
  if (def.shape) {
    inner = `<g fill="${ctx.fill(t)}" stroke="${INK}" stroke-width="${f(1.3 / s)}" stroke-linejoin="round">${SHAPES[def.shape]}</g>`;
  } else {
    const image = ARMS_IMAGES[g.head && def.headImage ? def.headImage : def.image ?? ''];
    if (image) {
      inner = `<g filter="url(#${ctx.glyphFilter(t)})"><svg x="-47" y="-47" width="94" height="94" viewBox="${image.viewBox}" `
        + `preserveAspectRatio="xMidYMid meet">${image.body}</svg></g>`;
    } else {
      const glyph = g.head && def.headGlyph ? def.headGlyph : def.glyph;
      inner = `<g filter="url(#${ctx.glyphFilter(t)})"><text x="0" y="0" font-size="86" text-anchor="middle" `
        + `dominant-baseline="central" font-family="${EMOJI_FONT}">${glyph}</text></g>`;
    }
  }
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${+s.toFixed(4)})">${inner}</g>`;
}

// ---- Placing charges -------------------------------------------------------------------------------------------------

interface Rect { cx: number; cy: number; w: number; h: number; }
type Zone = { rect: Rect } | { line: Pt[]; closed?: boolean };

// Rows of a group of n charges in a tall zone: the widest first, as on a shield
const ROWS: number[][] = [[], [1], [1, 1], [2, 1], [2, 2], [3, 2], [3, 2, 1], [3, 3, 1], [3, 3, 2], [3, 3, 3], [4, 3, 2, 1],
  [4, 4, 3], [4, 4, 3, 1], [4, 4, 3, 2], [5, 4, 3, 2], [5, 4, 3, 2, 1], [5, 5, 4, 2], [5, 5, 4, 3]];

function rowsFor(n: number, aspect: number): number[] {
  if (aspect >= 1.6) {  // a wide zone: in a line, or in two or three
    const rows = n <= 4 ? 1 : n <= 9 ? 2 : 3;
    const out: number[] = [];
    for (let i = 0; i < rows; i++) {
      out.push(Math.floor(n / rows) + (i < n % rows ? 1 : 0));
    }
    return out;
  }
  return ROWS[n] ?? [n];
}

function gridSlots(n: number, r: Rect, maxSize: number): { pos: Pt[]; size: number } {
  const rows = rowsFor(n, r.w / r.h);
  const cols = Math.max(...rows);
  const dx = r.w / cols;
  const dy = r.h / rows.length;
  const pos: Pt[] = [];
  rows.forEach((count, j) => {
    for (let i = 0; i < count; i++) {
      pos.push([r.cx + (i - (count - 1) / 2) * dx, r.cy + (j - (rows.length - 1) / 2) * dy]);
    }
  });
  return { pos, size: Math.min(maxSize, Math.min(dx, dy) * 0.86) };
}

function lineSlots(n: number, line: Pt[], closed: boolean, maxSize: number): { pos: Pt[]; size: number } {
  const path = closed ? [...line, line[0]] : line;
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    lens.push(l);
    total += l;
  }
  const pos: Pt[] = [];
  for (let k = 0; k < n; k++) {
    let d = (closed ? k / n : (k + 0.5) / n) * total;
    let i = 0;
    while (i < lens.length - 1 && d > lens[i]) {
      d -= lens[i];
      i++;
    }
    const t = lens[i] ? d / lens[i] : 0;
    pos.push([path[i][0] + (path[i + 1][0] - path[i][0]) * t, path[i][1] + (path[i + 1][1] - path[i][1]) * t]);
  }
  return { pos, size: Math.min(maxSize, (total / n) * 0.8) };
}

// Charges (one entry per charge) spread over the zones: "between two mullets", "three X, two above one below"
function placeItems(ctx: Ctx, items: ChargeGroup[], zones: Zone[], ov: Tincture | undefined, maxSize = 54): string {
  const n = items.length;
  const counts = zones.map((_, i) => Math.floor(n / zones.length) + (i < n % zones.length ? 1 : 0));
  const slots = zones.map((z, i) => counts[i] === 0 ? { pos: [] as Pt[], size: 99 }
    : 'rect' in z ? gridSlots(counts[i], z.rect, maxSize) : lineSlots(counts[i], z.line, !!z.closed, Math.min(maxSize, 30)));
  const size = Math.max(7, Math.min(...slots.map(s => s.size)));
  let k = 0;
  let out = '';
  for (const s of slots) {
    for (const [x, y] of s.pos) {
      const g = items[k++];
      out += drawCharge(ctx, g, g.tincture === 'proper' ? 'proper' : (ov ?? g.tincture), x, y, size);
    }
  }
  return out;
}

const flat = (groups: ChargeGroup[]): ChargeGroup[] => groups.flatMap(g => Array.from({ length: g.count }, () => g));
const rectZone = (b: Box, z: number[]): Zone => ({ rect: { cx: b.x + z[0] * b.w, cy: b.y + z[1] * b.h, w: z[2] * b.w, h: z[3] * b.h } });
const lineZone = (b: Box, p: Pt[], closed = false): Zone => ({ line: p.map(([x, y]) => [b.x + x * b.w, b.y + y * b.h] as Pt), closed });

// The free areas of the field around an ordinary ("between ...")
function fieldZones(type: OrdinaryType | undefined, b: Box): Zone[] {
  const z = (...l: number[][]) => l.map(a => rectZone(b, a));
  switch (type) {
    case 'chief': return z([.5, .65, .74, .6]);
    case 'fess': return z([.5, .2, .7, .26], [.5, .8, .5, .28]);
    case 'pale': return z([.19, .5, .28, .78], [.81, .5, .28, .78]);
    case 'bend': return z([.74, .27, .34, .34], [.26, .76, .34, .34]);
    case 'bend-sinister': return z([.26, .27, .34, .34], [.74, .76, .34, .34]);
    case 'cross': return z([.2, .15, .32, .24], [.8, .15, .32, .24], [.22, .68, .3, .3], [.78, .68, .3, .3]);
    case 'saltire': return z([.5, .17, .28, .2], [.14, .5, .18, .3], [.86, .5, .18, .3], [.5, .85, .2, .2]);
    case 'chevron': return z([.5, .13, .5, .2], [.5, .78, .34, .3]);
    case 'pile': return z([.11, .3, .18, .44], [.89, .3, .18, .44]);
    case 'flaunches': return z([.5, .5, .4, .7]);
    case 'bordure': case 'orle': return z([.5, .5, .56, .66]);
    case 'quarter': return z([.5, .74, .7, .42]);
    case 'canton': return z([.56, .58, .72, .78]);
    default: return z([.5, .5, .74, .82]);
  }
}

// The border of the shield, a little inside, clockwise from the middle of the chief
function borderLine(): Pt[] {
  const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt[] => Array.from({ length: 12 }, (_, i) => {
    const t = (i + 1) / 12;
    const u = 1 - t;
    return [0, 1].map(k => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]) as Pt;
  });
  return [[50, 6.5], [93.5, 6.5], [93.5, 58], ...bez([93.5, 58], [93.5, 89], [74.5, 104], [50, 112.5]),
    ...bez([50, 112.5], [25.5, 104], [6.5, 89], [6.5, 58]), [6.5, 6.5]];
}

// The areas of an ordinary the charges on it are placed on
function onZones(type: OrdinaryType, b: Box): Zone[] {
  const z = (...l: number[][]) => l.map(a => rectZone(b, a));
  switch (type) {
    case 'chief': return z([.5, .14, .84, .24]);
    case 'fess': return z([.5, .49, .84, .2]);
    case 'pale': return z([.5, .5, .2, .8]);
    case 'bend': return [lineZone(b, [[.15, .13], [.85, .8]])];
    case 'bend-sinister': return [lineZone(b, [[.85, .13], [.15, .8]])];
    case 'cross': return z([.5, .4, .3, .3]);
    case 'pile': return z([.5, .26, .3, .46]);
    case 'flaunches': return z([.1, .5, .14, .4], [.9, .5, .14, .4]);
    case 'chevron': return [lineZone(b, [[.14, .6], [.5, .365], [.86, .6]])];
    case 'saltire': return z([.5, .5, .3, .3]);
    case 'bordure': case 'orle': return [lineZone(b, borderLine().map(([x, y]) => [x / 100, y / 120] as Pt), true)];
    case 'quarter': return z([.25, .23, .42, .38]);
    default: return z([.17, .15, .28, .24]);
  }
}

// ---- Ordinaries ------------------------------------------------------------------------------------------------------

function band(a: Pt, c: Pt, thick: number): Pt[] {
  const l = Math.hypot(c[0] - a[0], c[1] - a[1]);
  const d: Pt = [(c[0] - a[0]) / l, (c[1] - a[1]) / l];
  const n: Pt = [-d[1] * thick / 2, d[0] * thick / 2];
  const e = l * 0.1;
  const p = [a[0] - d[0] * e, a[1] - d[1] * e];
  const q = [c[0] + d[0] * e, c[1] + d[1] * e];
  return [[p[0] + n[0], p[1] + n[1]], [q[0] + n[0], q[1] + n[1]], [q[0] - n[0], q[1] - n[1]], [p[0] - n[0], p[1] - n[1]]];
}

function ordinarySvg(ctx: Ctx, type: OrdinaryType, b: Box, tincture: Tincture): string {
  const fill = ctx.fill(tincture);
  const { x, y, w, h } = b;
  const cx = x + w / 2;
  const diag = Math.hypot(w, h);
  const P = (fx: number, fy: number): Pt => [x + fx * w, y + fy * h];
  const shape = (p: Pt[]) => `<polygon points="${pts(p)}" fill="${fill}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  switch (type) {
    case 'chief': return shape([P(0, 0), P(1, 0), P(1, .28), P(0, .28)]);
    case 'fess': return shape([P(0, .36), P(1, .36), P(1, .62), P(0, .62)]);
    case 'pale': return shape([P(.36, 0), P(.64, 0), P(.64, 1), P(.36, 1)]);
    case 'bend': return shape(band([x, y], [x + w, y + h], diag * .17));
    case 'bend-sinister': return shape(band([x + w, y], [x, y + h], diag * .17));
    case 'saltire': return shape(band([x, y], [x + w, y + h], diag * .12)) + shape(band([x + w, y], [x, y + h], diag * .12));
    case 'cross': return shape([P(.4, 0), P(.6, 0), P(.6, .3), P(1, .3), P(1, .47), P(.6, .47), P(.6, 1), P(.4, 1), P(.4, .47),
      P(0, .47), P(0, .3), P(.4, .3)]);
    case 'chevron': return shape([P(0, .62), [cx, y + .28 * h], P(1, .62), P(1, .79), [cx, y + .45 * h], P(0, .79)]);
    case 'pile': return shape([P(.18, 0), P(.82, 0), [cx, y + .8 * h]]);
    case 'flaunches': return `<g fill="${fill}" stroke="${INK}" stroke-width="1.2">`
      + `<path d="M${f(x)},${f(y + .1 * h)} C${f(x + .45 * w)},${f(y + .35 * h)} ${f(x + .45 * w)},${f(y + .65 * h)} ${f(x)},${f(y + .9 * h)} Z"/>`
      + `<path d="M${f(x + w)},${f(y + .1 * h)} C${f(x + .55 * w)},${f(y + .35 * h)} ${f(x + .55 * w)},${f(y + .65 * h)} ${f(x + w)},${f(y + .9 * h)} Z"/></g>`;
    case 'quarter': return shape([P(0, 0), P(.5, 0), P(.5, .46), P(0, .46)]);
    case 'canton': return shape([P(0, 0), P(.34, 0), P(.34, .3), P(0, .3)]);
    case 'bordure': {  // a wide stroke along the shield's edge, clipped by it
      const tr = `translate(${f(x)} ${f(y)}) scale(${f(w / 100)} ${f(h / 120)})`;
      return `<path d="${SHIELD}" transform="${tr}" fill="none" stroke="${INK}" stroke-width="26"/>`
        + `<path d="${SHIELD}" transform="${tr}" fill="none" stroke="${fill}" stroke-width="24"/>`;
    }
    default: {  // orle
      const tr = `translate(${f(x + .07 * w)} ${f(y + .06 * h)}) scale(${f(w / 100 * .86)} ${f(h / 120 * .88)})`;
      return `<path d="${SHIELD}" transform="${tr}" fill="none" stroke="${INK}" stroke-width="6"/>`
        + `<path d="${SHIELD}" transform="${tr}" fill="none" stroke="${fill}" stroke-width="4.4"/>`;
    }
  }
}

// ---- Fields ----------------------------------------------------------------------------------------------------------

const rect = (b: Box, fill: string, stroke = ''): string =>
  `<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" fill="${fill}"${stroke}/>`;

// The two parts of a divided field
const R = (...p: Pt[]): Pt[] => p;
function divisionRegions(div: string, b: Box): { a: Pt[][]; b: Pt[][] } {
  const { x, y, w, h } = b;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const P = (fx: number, fy: number): Pt => [x + fx * w, y + fy * h];
  switch (div) {
    case 'quarterly':
      return { a: [R(P(0, 0), [cx, y], [cx, cy], [x, cy]), R([cx, cy], [x + w, cy], P(1, 1), [cx, y + h])],
        b: [R([cx, y], P(1, 0), [x + w, cy], [cx, cy]), R([x, cy], [cx, cy], [cx, y + h], P(0, 1))] };
    case 'pale': return { a: [R(P(0, 0), [cx, y], [cx, y + h], P(0, 1))], b: [R([cx, y], P(1, 0), P(1, 1), [cx, y + h])] };
    case 'fess': return { a: [R(P(0, 0), P(1, 0), [x + w, cy], [x, cy])], b: [R([x, cy], [x + w, cy], P(1, 1), P(0, 1))] };
    case 'bend': return { a: [R(P(0, 0), P(1, 0), P(1, 1))], b: [R(P(0, 0), P(1, 1), P(0, 1))] };
    case 'bend-sinister': return { a: [R(P(0, 0), P(1, 0), P(0, 1))], b: [R(P(1, 0), P(1, 1), P(0, 1))] };
    case 'saltire':
      return { a: [R(P(0, 0), P(1, 0), [cx, cy]), R(P(0, 1), P(1, 1), [cx, cy])],
        b: [R(P(0, 0), [cx, cy], P(0, 1)), R(P(1, 0), P(1, 1), [cx, cy])] };
    default:  // chevron
      return { a: [R(P(0, 0), P(1, 0), P(1, .78), [cx, y + .45 * h], P(0, .78))],
        b: [R(P(0, .78), [cx, y + .45 * h], P(1, .78), P(1, 1), P(0, 1))] };
  }
}

const polys = (r: Pt[][], fill: string): string => r.map(p => `<polygon points="${pts(p)}" fill="${fill}"/>`).join('');
const clipPolys = (ctx: Ctx, r: Pt[][]): string => ctx.clip(r.map(p => `<polygon points="${pts(p)}"/>`).join(''));

function semeCharges(ctx: Ctx, g: ChargeGroup, tincture: ChargeTincture, b: Box): string {
  const step = 25;
  const dy = 21;
  let out = '';
  for (let j = 0; j * dy < b.h + 8; j++) {
    const offset = j % 2 ? step / 2 : 0;
    for (let px = b.x + 6 + offset; px < b.x + b.w + 6; px += step) {
      out += drawCharge(ctx, g, tincture, px, b.y + 6 + j * dy, 15);
    }
  }
  return out;
}

// A variation of the field in the tinctures a and b (swapped: b is the field, a the pattern)
function patternSvg(ctx: Ctx, p: PatternSpec, a: Tincture, b2: Tincture, b: Box, swap: boolean): string {
  const A = ctx.fill(swap ? b2 : a);
  const B = ctx.fill(swap ? a : b2);
  const { x, y, w, h } = b;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const D = Math.hypot(w, h);
  let out = rect(b, A);
  const odd = (n: number, fn: (i: number) => string) => {
    for (let i = 1; i < n; i += 2) {
      out += fn(i);
    }
  };
  switch (p.pattern) {
    case 'barry': odd(p.count!, i => rect({ x, y: y + i * h / p.count!, w, h: h / p.count! }, B)); break;
    case 'paly': odd(6, i => rect({ x: x + i * w / 6, y, w: w / 6, h }, B)); break;
    case 'bendy':
    case 'bendy-sinister': {
      const ang = Math.atan2(h, w) * 180 / Math.PI * (p.pattern === 'bendy' ? 1 : -1);
      out += `<g transform="rotate(${f(ang)} ${f(cx)} ${f(cy)})">`;
      odd(6, i => rect({ x: cx - D / 2, y: cy - D / 2 + i * D / 6, w: D, h: D / 6 }, B));
      out += '</g>';
      break;
    }
    case 'chequy': {
      const cell = 100 / 6;
      for (let j = 0; j * cell < h; j++) {
        for (let i = 0; i * cell < w; i++) {
          if ((i + j) % 2) {
            out += rect({ x: x + i * cell, y: y + j * cell, w: cell, h: cell }, B);
          }
        }
      }
      break;
    }
    case 'chevronny': {
      const t = 15;
      for (let k = 0; y - w / 2 + k * 2 * t < y + h; k++) {
        const yk = y - w / 2 + (k * 2 + 1) * t;
        out += `<polygon points="${pts([[x, yk + w / 2], [cx, yk], [x + w, yk + w / 2], [x + w, yk + w / 2 + t], [cx, yk + t],
          [x, yk + w / 2 + t]])}" fill="${B}"/>`;
      }
      break;
    }
    case 'fretty': {
      for (const ang of [45, -45]) {
        out += `<g transform="rotate(${ang} ${f(cx)} ${f(cy)})">`;
        for (let k = -Math.ceil(D / 26); k <= Math.ceil(D / 26); k++) {
          out += rect({ x: cx - D, y: cy + k * 26 - 3.5, w: 2 * D, h: 7 }, B, ` stroke="${INK}" stroke-width="0.7"`);
        }
        out += '</g>';
      }
      break;
    }
    case 'gyronny': {
      const n = p.count!;
      for (let i = 1; i < n; i += 2) {
        const a1 = (i * 360 / n) * Math.PI / 180;
        const a2 = ((i + 1) * 360 / n) * Math.PI / 180;
        out += `<path d="M${f(cx)},${f(cy)} L${f(cx + D * Math.cos(a1))},${f(cy + D * Math.sin(a1))} `
          + `L${f(cx + D * Math.cos(a2))},${f(cy + D * Math.sin(a2))} Z" fill="${B}"/>`;
      }
      break;
    }
    case 'lozengy':
      for (let j = -1; j * 28 < h + 28; j++) {
        for (let i = -1; i * 20 < w + 20; i++) {
          out += `<polygon points="${pts([[x + i * 20, y + j * 28 - 14], [x + i * 20 + 10, y + j * 28], [x + i * 20, y + j * 28 + 14],
            [x + i * 20 - 10, y + j * 28]])}" fill="${B}"/>`;
        }
      }
      break;
    default:  // seme (counterchanged: the charges in the tincture of the opposing part)
      if (p.seme) {
        out += semeCharges(ctx, p.seme, swap ? a : b2, b);
      }
  }
  return out;
}

function fieldSvg(ctx: Ctx, fld: Field, b: Box): string {
  switch (fld.kind) {
    case 'solid':
      return rect(b, ctx.fill(fld.tincture));
    case 'division': {
      const r = divisionRegions(fld.division, b);
      return polys(r.a, ctx.fill(fld.a)) + polys(r.b, ctx.fill(fld.b));
    }
    default: {
      if (fld.pattern !== 'seme') {
        return patternSvg(ctx, fld, fld.a, fld.b, b, false);
      }
      const base = fld.base ?? { kind: 'solid', tincture: fld.a } as Field;
      let out = fieldSvg(ctx, base, b);
      if (fld.semeCounter && base.kind === 'division') {  // each part strewn with the tincture of the other
        const r = divisionRegions(base.division, b);
        out += `<g clip-path="url(#${clipPolys(ctx, r.a)})">${semeCharges(ctx, fld.seme!, base.b, b)}</g>`
          + `<g clip-path="url(#${clipPolys(ctx, r.b)})">${semeCharges(ctx, fld.seme!, base.a, b)}</g>`;
      } else {
        out += semeCharges(ctx, fld.seme!, fld.seme!.tincture, b);
      }
      return out;
    }
  }
}

// ---- The design ------------------------------------------------------------------------------------------------------

// The ordinary and the charges (ov: they are all in this tincture, countercharged)
function content(ctx: Ctx, d: Design, b: Box, ov?: Tincture): string {
  let out = '';
  const o = d.ordinary;
  if (o) {
    out += ordinarySvg(ctx, o.type, b, ov ?? o.tincture);
    if (o.charges) {
      out += placeItems(ctx, flat([o.charges]), onZones(o.type, b), ov, o.type === 'bordure' || o.type === 'orle' ? 18 : 36);
    }
  }
  if (d.minor) {  // one main charge between a group of minor charges around it
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h * 0.47;
    const m = flat([d.minor]);
    const ring = lineSlots(m.length, Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * 2 * Math.PI - Math.PI / 2;
      return [cx + Math.cos(a) * b.w * 0.4, cy + Math.sin(a) * b.h * 0.4] as Pt;
    }), true, 26);
    out += placeItems(ctx, flat(d.charges), [rectZone(b, [.5, .47, .5, .5])], ov, 56);
    m.forEach((g, i) => {
      out += drawCharge(ctx, g, g.tincture === 'proper' ? 'proper' : (ov ?? g.tincture), ring.pos[i][0], ring.pos[i][1], ring.size);
    });
  } else if (d.charges.length) {
    out += placeItems(ctx, flat(d.charges), fieldZones(o?.type, b), ov);
  }
  return out;
}

function designSvg(ctx: Ctx, d: Design, b: Box): string {
  if (d.halves) {  // each half is a shield of its own
    const half = (i: number) => {
      const hb: Box = { x: b.x + i * b.w / 2, y: b.y, w: b.w / 2, h: b.h };
      return `<g clip-path="url(#${ctx.clip(rect(hb, '#000'))})">${designSvg(ctx, d.halves![i], hb)}</g>`;
    };
    return half(0) + half(1)
      + `<line x1="${f(b.x + b.w / 2)}" y1="${f(b.y)}" x2="${f(b.x + b.w / 2)}" y2="${f(b.y + b.h)}" stroke="${INK}" stroke-width="1.2"/>`;
  }
  const fld = d.field!;
  if (d.counter && fld.kind === 'division') {  // countercharged: the other tincture on each part
    const r = divisionRegions(fld.division, b);
    const part = (regs: Pt[][], own: Tincture, other: Tincture, swap: boolean) =>
      `<g clip-path="url(#${clipPolys(ctx, regs)})">`
      + (fld.pattern ? patternSvg(ctx, fld.pattern, fld.a, fld.b, b, swap) : rect(b, ctx.fill(own)))
      + content(ctx, d, b, other) + '</g>';
    return part(r.a, fld.a, fld.b, false) + part(r.b, fld.b, fld.a, true)
      + divisionLine(fld.division, b);
  }
  return fieldSvg(ctx, fld, b) + content(ctx, d, b);
}

// The line between the parts of a countercharged field, so it stays visible under the charges
function divisionLine(div: string, b: Box): string {
  const { x, y, w, h } = b;
  const L = (a: Pt, c: Pt) => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(c[0])}" y2="${f(c[1])}" stroke="${INK}" stroke-width="0.8"/>`;
  switch (div) {
    case 'bend': return L([x, y], [x + w, y + h]);
    case 'bend-sinister': return L([x + w, y], [x, y + h]);
    case 'pale': return L([x + w / 2, y], [x + w / 2, y + h]);
    case 'fess': return L([x, y + h / 2], [x + w, y + h / 2]);
    default: return '';
  }
}

export function renderArmsSvg(design: Design, idPrefix = 'arms'): string {
  const ctx = new Ctx(idPrefix);
  const shield = ctx.clip(`<path d="${SHIELD}"/>`);
  const body = designSvg(ctx, design, FULL);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 106 126" role="img" aria-label="Coat of arms">`
    + `<defs>${ctx.defs.join('')}</defs><g clip-path="url(#${shield})">${body}</g>`
    + `<path d="${SHIELD}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
}
