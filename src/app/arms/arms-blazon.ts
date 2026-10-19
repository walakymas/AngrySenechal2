// Blazoning: the coat of arms described in words, "from the bottom up" (field, ordinaries, charges on them, other charges).
import { CHARGE_DEFS, ChargeDef, ORDINARY_NAMES, PERIPHERAL_TYPES } from './arms-data';
import type { ChargeGroup, Design, Field, PatternSpec } from './arms-generator';

const NUMBERS = ['', 'a', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen'];

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const lower = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);
const article = (next: string): string => /^(?!uni)[aeiou]/i.test(next) ? 'an' : 'a';

export function pluralOf(def: ChargeDef): string {
  if (def.plural) {
    return def.plural;
  }
  const n = def.name;
  if (/(s|x|ch|sh)$/.test(n)) {
    return n + 'es';
  }
  return /[^aeiou]y$/.test(n) ? n.slice(0, -1) + 'ies' : n + 's';
}

// The charge of the group as the blazon words it: the tincture stands before a simple name ("a sable wolf"), after a
// complex one ("a lion rampant or", "two mullets of eight points argent")
function chargeText(g: ChargeGroup, counter: boolean, withTincture = true): { text: string; tincture: string; before: boolean } {
  const def = CHARGE_DEFS[g.key];
  const pose = g.pose ?? def.pose;
  const tincture = counter ? 'counterchanged' : g.tincture;
  let noun: string;
  if (g.head) {
    noun = g.count === 1 ? `${def.name}'s head` : `${pluralOf(def)}' heads`;
  } else {
    noun = g.count === 1 ? def.name : pluralOf(def);
  }
  const before = !counter && g.tincture !== 'proper' && !pose && !g.head
    && !/ of |pierced|crosslet|patée|moline|patonce|potent|flory|bottony|couped|crown/.test(def.name);
  const body = `${noun}${pose && !g.head ? ' ' + pose : ''}`;
  let text: string;
  if (before && withTincture) {
    text = g.count === 1 ? `${article(tincture)} ${tincture} ${body}` : `${NUMBERS[g.count]} ${tincture} ${body}`;
  } else {
    const start = g.count === 1 ? `${article(body)} ${body}` : `${NUMBERS[g.count]} ${body}`;
    text = withTincture ? `${start} ${tincture}` : start;
  }
  return { text, tincture, before };
}

function patternText(p: PatternSpec, a: string, b: string, counter: boolean): string {
  const ab = counter ? '' : ` ${a} and ${b}`;
  switch (p.pattern) {
    case 'barry': return `barry of ${NUMBERS[p.count!]}${ab}`;
    case 'bendy-sinister': return `bendy sinister${ab}`;
    case 'gyronny': return `gyronny of ${NUMBERS[p.count!]}${ab}`;
    case 'fretty': return counter ? 'fretty' : `${a} fretty ${b}`;
    case 'seme': {
      const g = p.seme!;
      return `semé of ${pluralOf(CHARGE_DEFS[g.key])} ${counter ? 'counterchanged' : g.tincture}`;
    }
    default: return `${p.pattern}${ab}`;
  }
}

function fieldText(f: Field): string {
  switch (f.kind) {
    case 'solid':
      return cap(f.tincture);
    case 'division': {
      const name = f.division === 'quarterly' ? 'Quarterly' : `Per ${f.division.replace('-', ' ')}`;
      const text = `${name} ${f.a} and ${f.b}`;
      return f.pattern ? `${text}, ${patternText(f.pattern, f.a, f.b, true)} counterchanged` : text;
    }
    case 'variation': {
      if (f.pattern === 'seme') {
        const base = f.base ? fieldText(f.base) : cap(f.a);
        return `${base}, ${patternText(f, f.a, f.b, !!f.semeCounter)}`;
      }
      return cap(patternText(f, f.a, f.b, false));
    }
  }
}

const ordinaryName = (type: keyof typeof ORDINARY_NAMES): string => {
  const name = ORDINARY_NAMES[type];
  return type === 'flaunches' ? name : `${article(name)} ${name}`;
};

// The ordinary and the charges after the field
function bodyText(d: Design): string[] {
  const counter = !!d.counter;
  const parts: string[] = [];
  const groups = d.charges.map(g => chargeText(g, counter));
  const o = d.ordinary;
  const minor = d.minor ? chargeText(d.minor, counter) : undefined;
  if (o) {
    const tincture = counter ? 'counterchanged' : o.tincture;
    const name = ordinaryName(o.type);
    if (o.charges) {
      parts.push(`on ${name} ${tincture} ${chargeText(o.charges, counter).text}`);
    } else if (groups.length && !PERIPHERAL_TYPES.includes(o.type)) {
      // "a bend between two mullets of eight points argent" (one tincture for both)
      const g = d.charges[0];
      if (groups.length === 1 && !counter && !groups[0].before && g.tincture === o.tincture) {
        parts.push(`${name} between ${chargeText(g, false, false).text} ${tincture}`);
      } else {
        parts.push(`${name} ${tincture} between ${groups.map(x => x.text).join(' and ')}`);
      }
      return parts;
    } else {
      parts.push(`${name} ${tincture}`);
    }
  }
  if (groups.length) {
    parts.push((o ? 'and ' : '') + groups.map(x => x.text).join(' and ') + (minor ? ` between ${minor.text}` : ''));
  }
  return parts;
}

function blazonBody(d: Design): string {
  if (d.halves) {
    return `Per pale: dexter, ${lower(blazonBody(d.halves[0]))}; sinister, ${lower(blazonBody(d.halves[1]))}`;
  }
  const parts = [fieldText(d.field!), ...bodyText(d)];
  return parts.join(', ');
}

export function blazonOf(d: Design): string {
  return blazonBody(d) + '.';
}
