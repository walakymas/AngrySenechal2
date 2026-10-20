// A coat of arms chosen by hand instead of rolled: the choices of the form, and the Design built from them.
import { CHARGE_DEFS, ChargeTincture, Division, ORDINARY_NAMES, OrdinaryType, Pattern, Tincture } from './arms-data';
import type { ChargeGroup, Design, Field } from './arms-generator';

export type FieldKind = 'solid' | 'division' | 'variation';

export interface ChargeChoice {
  key: string;
  count: number;
  tincture: ChargeTincture;
  pose: string;            // only for quadrupeds, '' = none
  head: boolean;           // only for the animals that can be shown by the head
}

export interface BuilderChoice {
  fieldKind: FieldKind;
  a: Tincture;
  b: Tincture;
  division: Division;
  pattern: Pattern;
  count: number;           // barry and gyronny
  ordinary: OrdinaryType | '';
  ordinaryTincture: Tincture;
  onOrdinary: ChargeChoice | null;
  charges: ChargeChoice[];
}

export const TINCTURE_OPTIONS: Tincture[] = ['argent', 'or', 'gules', 'azure', 'vert', 'purpure', 'sable', 'ermine', 'vair'];
export const CHARGE_TINCTURE_OPTIONS: ChargeTincture[] = [...TINCTURE_OPTIONS, 'proper'];
export const DIVISION_OPTIONS: Division[] = ['quarterly', 'pale', 'fess', 'bend', 'bend-sinister', 'saltire', 'chevron'];
export const PATTERN_OPTIONS: Pattern[] = ['barry', 'bendy', 'bendy-sinister', 'chequy', 'chevronny', 'fretty', 'gyronny', 'lozengy',
  'paly'];
export const ORDINARY_OPTIONS = Object.entries(ORDINARY_NAMES).map(([type, name]) => ({ type: type as OrdinaryType, name }));
export const POSE_OPTIONS = ['rampant', 'couchant', 'statant', 'passant'];
export const MAX_FIELD_CHARGES = 3;

// The counts a pattern can have (barry and gyronny only)
export const patternCounts = (p: Pattern): number[] => p === 'barry' ? [6, 8, 10] : p === 'gyronny' ? [8, 12, 16] : [];

export const CHARGE_OPTIONS = Object.values(CHARGE_DEFS)
  .map(d => ({ key: d.key, label: d.pose ? `${d.name} ${d.pose}` : d.name }))
  .sort((x, y) => x.label.localeCompare(y.label));

export const canHead = (key: string): boolean => !!CHARGE_DEFS[key]?.italic;
export const canPose = (key: string): boolean => !!CHARGE_DEFS[key]?.quad && !CHARGE_DEFS[key].pose;

export function newCharge(key = 'Lion rearing'): ChargeChoice {
  return { key, count: 1, tincture: CHARGE_DEFS[key]?.natural ? 'proper' : 'or', pose: '', head: false };
}

export function defaultChoice(): BuilderChoice {
  return {
    fieldKind: 'solid', a: 'azure', b: 'argent', division: 'pale', pattern: 'barry', count: 6, ordinary: '', ordinaryTincture: 'argent',
    onOrdinary: null, charges: [newCharge()]
  };
}

function group(c: ChargeChoice): ChargeGroup {
  const g: ChargeGroup = { key: c.key, count: Math.max(1, Math.floor(c.count) || 1), tincture: c.tincture };
  if (c.head && canHead(c.key)) {
    g.head = true;
  }
  if (c.pose && canPose(c.key)) {
    g.pose = c.pose;
  }
  return g;
}

export function buildDesign(c: BuilderChoice): Design {
  let field: Field;
  switch (c.fieldKind) {
    case 'division':
      field = { kind: 'division', division: c.division, a: c.a, b: c.b };
      break;
    case 'variation': {
      const counts = patternCounts(c.pattern);
      field = { kind: 'variation', pattern: c.pattern, a: c.a, b: c.b, count: counts.length ? (counts.includes(c.count) ? c.count : counts[0]) : undefined };
      break;
    }
    default:
      field = { kind: 'solid', tincture: c.a };
  }
  const design: Design = { field, charges: c.charges.filter(ch => CHARGE_DEFS[ch.key]).map(group) };
  if (c.ordinary) {
    design.ordinary = { type: c.ordinary, tincture: c.ordinaryTincture };
    if (c.onOrdinary && CHARGE_DEFS[c.onOrdinary.key]) {
      design.ordinary.charges = group(c.onOrdinary);
    }
  }
  return design;
}

// ---- Stored coats of arms (the `arms` field of the character) --------------------------------------------------------

export interface StoredArms { blazon: string; design: Design; }

const own = (o: object, k: unknown): boolean => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
const isTincture = (t: unknown, allowed: readonly string[]): boolean => typeof t === 'string' && allowed.includes(t);

function validGroup(g: any): boolean {
  return !!g && own(CHARGE_DEFS, g.key) && Number.isInteger(g.count) && g.count >= 1 && g.count <= 99
    && isTincture(g.tincture, CHARGE_TINCTURE_OPTIONS);
}

function validField(f: any): boolean {
  switch (f?.kind) {
    case 'solid': return isTincture(f.tincture, TINCTURE_OPTIONS);
    case 'division': return DIVISION_OPTIONS.includes(f.division) && isTincture(f.a, TINCTURE_OPTIONS) && isTincture(f.b, TINCTURE_OPTIONS)
      && (!f.pattern || PATTERN_OPTIONS.includes(f.pattern.pattern) || (f.pattern.pattern === 'seme' && validGroup(f.pattern.seme)));
    case 'variation': return (PATTERN_OPTIONS.includes(f.pattern) || (f.pattern === 'seme' && validGroup(f.seme)))
      && isTincture(f.a, TINCTURE_OPTIONS) && isTincture(f.b, TINCTURE_OPTIONS) && (!f.base || validField(f.base));
    default: return false;
  }
}

// A design read from the stored data is drawn only when everything in it is a known value
export function validDesign(d: any, depth = 0): boolean {
  if (!d || typeof d !== 'object' || depth > 1 || !Array.isArray(d.charges) || !d.charges.every(validGroup)) {
    return false;
  }
  if (d.minor && !validGroup(d.minor)) {
    return false;
  }
  if (d.ordinary && (!own(ORDINARY_NAMES, d.ordinary.type) || !isTincture(d.ordinary.tincture, TINCTURE_OPTIONS)
    || (d.ordinary.charges && !validGroup(d.ordinary.charges)))) {
    return false;
  }
  if (d.halves) {
    return Array.isArray(d.halves) && d.halves.length === 2 && d.halves.every((h: any) => validDesign(h, depth + 1));
  }
  return validField(d.field);
}

const chargeChoice = (g: ChargeGroup): ChargeChoice => ({ key: g.key, count: g.count, tincture: g.tincture, pose: g.pose ?? '', head: !!g.head });

// The choices of a design for the form, or null when the design can't be edited by hand (rolled only: countercharged,
// semé, minor charges, halves)
export function designToChoice(d: Design): BuilderChoice | null {
  const f = d.field;
  if (d.halves || d.minor || d.counter || !f || d.charges.length > MAX_FIELD_CHARGES) {
    return null;
  }
  const c = defaultChoice();
  switch (f.kind) {
    case 'solid':
      c.fieldKind = 'solid';
      c.a = f.tincture;
      break;
    case 'division':
      if (f.counter || f.pattern) {
        return null;
      }
      Object.assign(c, { fieldKind: 'division', division: f.division, a: f.a, b: f.b });
      break;
    default:
      if (f.pattern === 'seme') {
        return null;
      }
      Object.assign(c, { fieldKind: 'variation', pattern: f.pattern, count: f.count ?? patternCounts(f.pattern)[0] ?? 6, a: f.a, b: f.b });
  }
  if (d.ordinary) {
    c.ordinary = d.ordinary.type;
    c.ordinaryTincture = d.ordinary.tincture;
    c.onOrdinary = d.ordinary.charges ? chargeChoice(d.ordinary.charges) : null;
  }
  c.charges = d.charges.map(chargeChoice);
  return c;
}
