// The random coat of arms of Appendix B (Pendragon core rulebook): Step 1 shield design, Step 2 tinctures, Step 3 charges.
import {
  CHARGE_COLUMNS, CHARGE_DEFS, ChargeDef, ChargeTincture, COLOR_ROWS, Column, DIVISION_ROWS, Division, DivisionDesign,
  FIELD_ROWS, isFur, isMetal, lookup, METAL_ROWS, ORDINARY_NAMES, OrdinaryType, Pattern, SINGLE_SUBTABLES, SUBTABLES,
  Tincture, VARIATION_ROWS } from './arms-data';
import { blazonOf } from './arms-blazon';

export interface ChargeGroup {
  key: string;             // key of CHARGE_DEFS
  count: number;
  tincture: ChargeTincture;
  head?: boolean;          // only the head of the animal is shown
  pose?: string;           // animation of a quadruped (optional rule 3)
}

export interface Ordinary {
  type: OrdinaryType;
  tincture: Tincture;
  charges?: ChargeGroup;   // charges on the ordinary
}

export interface SolidField { kind: 'solid'; tincture: Tincture; }
export interface PatternSpec { pattern: Pattern; count?: number; seme?: ChargeGroup; }
export interface VariationField extends PatternSpec {
  kind: 'variation';
  a: Tincture;
  b: Tincture;
  base?: Field;            // Semé: the field the charges are strewn on
  semeCounter?: boolean;   // Semé: the charges take the tincture of the opposing division
}
export interface DivisionField {
  kind: 'division';
  division: Division;
  a: Tincture;
  b: Tincture;
  counter?: boolean;       // the design is countercharged
  pattern?: PatternSpec;   // countercharged Variation: the "band" colors swap position
}
export type Field = SolidField | VariationField | DivisionField;

export interface Design {
  field?: Field;           // missing only on a design of two separate halves
  halves?: [Design, Design];
  ordinary?: Ordinary;
  charges: ChargeGroup[];  // on the field
  minor?: ChargeGroup;     // minor charges around a single main charge
  counter?: boolean;       // everything on the field takes the tincture of the opposing division
}

export interface LogEntry { scope: string; step: 1 | 2 | 3; text: string; }
export interface ArmsResult { design: Design; blazon: string; log: LogEntry[]; }

export interface ArmsOptions {
  headOnly: boolean;       // optional rule 1: italicized charges, 1D6 5+: only the head
  moreCharges: boolean;    // optional rule 2: 1D6 6: an additional charge
  animation: boolean;      // optional rule 3: animation of quadrupeds (except lions)
  swapFur: boolean;        // optional rule: ordinary on a fur field, 1D6 5+: swap the fur and the ordinary tincture
}
export const DEFAULT_OPTIONS: ArmsOptions = { headOnly: false, moreCharges: false, animation: false, swapFur: false };

export type Roller = (sides: number) => number;
export const randomRoller: Roller = sides => 1 + Math.floor(Math.random() * sides);

export function generateArms(roller: Roller = randomRoller, options: ArmsOptions = DEFAULT_OPTIONS): ArmsResult {
  const generator = new ArmsGenerator(roller, options);
  const design = generator.shield(false, 'free');
  return { design, blazon: blazonOf(design), log: generator.log };
}

export const isGeometric = (def: ChargeDef): boolean => !!def.shape || !def.natural;

// How the tinctures are chosen: free (Rule of Tincture), overall (a charge on a Division: 1D2 selects the column),
// counter (countercharged: the tinctures come from the Division)
type Mode = 'free' | 'overall' | 'counter';

type Rolled = { kind: 'ordinary'; type: OrdinaryType } | { kind: 'charge'; key: string; single: boolean };

const POSES = ['rampant', 'rampant', 'rampant', 'couchant', 'statant', 'passant', 'passant'];  // column 1 of Table B.3

class ArmsGenerator {
  log: LogEntry[] = [];
  private scope = '';

  constructor(private roll: Roller, private o: ArmsOptions) { }

  private note(step: 1 | 2 | 3, text: string): void {
    this.log.push({ scope: this.scope, step, text });
  }

  // Step 1: Shield Design (Table B.1). A rerolled result (inside a Division) can't be a Variation or a Division again.
  shield(rerolled: boolean, mode: Mode): Design {
    const r = this.roll(20);
    const kind = r <= 6 ? 'charge' : r === 7 ? 'minor' : r <= 9 ? 'charge-minor' : r === 10 ? 'peripheral'
      : r === 11 ? 'peripheral-field' : r === 12 ? 'peripheral-on' : r === 13 ? 'ordinary' : r === 14 ? 'ordinary-field'
      : r === 15 ? 'ordinary-on' : r <= 18 ? 'variation' : 'division';
    const labels: Record<string, string> = {
      'charge': 'Charge', 'minor': 'Minor Charge', 'charge-minor': 'Charge (single) + Minor Charge',
      'peripheral': 'Peripheral Ordinary', 'peripheral-field': 'Peripheral Ordinary + Charge on the Field',
      'peripheral-on': 'Peripheral Ordinary + Charge on the Ordinary', 'ordinary': 'Ordinary',
      'ordinary-field': 'Ordinary + Charge on the Field', 'ordinary-on': 'Ordinary + Charge on the Ordinary',
      'variation': 'Variation', 'division': 'Division'};

    if (rerolled && (kind === 'variation' || kind === 'division')) {
      this.note(1, `Shield design: 1D20 = ${r} → ${labels[kind]}, but a rerolled result means a Solid Variation (no charges)`);
      return this.variation(mode);
    }
    this.note(1, `Shield design: 1D20 = ${r} → ${labels[kind]}`);
    if (kind === 'variation') {
      return this.variation(mode);
    }
    if (kind === 'division') {
      return this.divided(mode);
    }

    const design: Design = { charges: [] };
    switch (kind) {
      case 'charge': {
        const rolled = this.rollCharge(6);
        if (rolled.kind === 'ordinary') {
          design.ordinary = { type: rolled.type, tincture: 'argent' };
        } else {
          design.charges.push(this.group(rolled, 'd3'));
        }
        break;
      }
      case 'minor':
        design.charges.push(this.group(this.rollCharge(5, 5), '2d6'));
        break;
      case 'charge-minor': {
        const main = this.rollCharge(6);
        const minor = this.group(this.rollCharge(5, 5), '2d6');
        if (main.kind === 'ordinary') {
          design.ordinary = { type: main.type, tincture: 'argent' };
          design.charges.push(minor);
        } else {
          design.charges.push(this.group(main, 1));
          design.minor = minor;
        }
        break;
      }
      case 'peripheral':
      case 'peripheral-field':
      case 'peripheral-on': {
        const type = this.rollPeripheral();
        design.ordinary = { type, tincture: 'argent' };
        this.addCharges(design, kind === 'peripheral-field' ? 'field' : kind === 'peripheral-on' ? 'on' : null);
        break;
      }
      default: {  // ordinary, ordinary-field, ordinary-on
        const rolled = this.rollCharge(6, 6, kind === 'ordinary' ? 20 : 6);
        design.ordinary = { type: (rolled as { type: OrdinaryType }).type, tincture: 'argent' };
        this.addCharges(design, kind === 'ordinary-field' ? 'field' : kind === 'ordinary-on' ? 'on' : null);
      }
    }
    // Optional rule 2: more charges
    if (this.o.moreCharges && design.charges.length > 0) {
      const d = this.roll(6);
      this.note(3, `More charges: 1D6 = ${d}${d === 6 ? ' → an additional charge' : ''}`);
      if (d === 6) {
        const rolled = this.rollCharge(5);
        design.charges.push(this.group(rolled, 'd3'));
      }
    }
    this.tinctures(design, mode);
    return design;
  }

  // A charge on the field / on the ordinary of an ordinary design (Step 3: columns 1-5, reroll 6s)
  private addCharges(design: Design, where: 'field' | 'on' | null): void {
    if (!where) {
      return;
    }
    const type = design.ordinary!.type;
    if (where === 'field') {
      design.charges.push(this.group(this.rollCharge(5), 'd3'));
    } else if (type === 'bordure' || type === 'orle') {
      // "If a Charge is on a Bordure, roll a group of 2D6+5 from column 5" (the same for an orle)
      design.ordinary!.charges = this.group(this.rollCharge(5, 5), '2d6+5');
    } else {
      design.ordinary!.charges = this.group(this.rollCharge(5), 'd3');
    }
  }

  private rollPeripheral(): OrdinaryType {
    const d = this.roll(6);
    const picked = this.pick(SUBTABLES['Peripherals'][d - 1]);
    const type = picked.slice(1) as OrdinaryType;
    this.note(1, `Peripheral ordinary: 1D6 = ${d} → ${ORDINARY_NAMES[type]}`);
    return type;
  }

  // Step 3: roll 1D6 (column) and 1D20 (row) on Table B.3, 1D6 on the sub-table at an asterisk, 1D2 at two choices
  private rollCharge(maxColumn: number, column?: number, rowDie = 20): Rolled {
    let col = column;
    const rerolled: number[] = [];
    while (!col) {
      const d = this.roll(6);
      if (d > maxColumn) {
        rerolled.push(d);
      } else {
        col = d;
      }
    }
    const row = this.roll(rowDie);
    let entry = CHARGE_COLUMNS[col - 1][row - 1];
    let text = `Charge: column ${column ? col : `1D6 = ${col}`}${rerolled.length ? ` (rerolled ${rerolled.join(', ')})` : ''}, `
      + `row 1D${rowDie} = ${row}`;
    let single = col === 6;
    if (entry.startsWith('*')) {
      const name = entry.slice(1);
      const d = this.roll(6);
      entry = SUBTABLES[name][d - 1];
      text += ` → ${name}, 1D6 = ${d}`;
      single = single || SINGLE_SUBTABLES.includes(name);
    }
    const key = this.pick(entry);
    this.note(3, `${text} → ${key.startsWith('@') ? ORDINARY_NAMES[key.slice(1) as OrdinaryType] : CHARGE_DEFS[key].name}`);
    return key.startsWith('@')
      ? { kind: 'ordinary', type: key.slice(1) as OrdinaryType }
      : { kind: 'charge', key, single };
  }

  // "If a result has two choices, pick one or roll 1D2."
  private pick(entry: string): string {
    const options = entry.split('|');
    if (options.length === 1) {
      return entry;
    }
    const d = this.roll(2);
    this.note(3, `Two choices (${options.map(o => o.replace('@', '')).join(' / ')}): 1D2 = ${d}`);
    return options[d - 1];
  }

  // The group of charges: 1D3 unless otherwise specified; ordinaries and religious symbols are singles
  private group(rolled: Rolled, count: number | 'd3' | '2d6' | '2d6+5'): ChargeGroup {
    const key = (rolled as { key: string }).key;
    const def = CHARGE_DEFS[key];
    let n: number;
    let how = '';
    if (typeof count === 'number' || (rolled as { single: boolean }).single) {
      n = typeof count === 'number' ? count : 1;
    } else if (count === 'd3') {
      n = this.roll(3);
      how = `1D3 = ${n}`;
    } else {
      const a = this.roll(6);
      const b = this.roll(6);
      n = a + b + (count === '2d6+5' ? 5 : 0);
      how = `2D6${count === '2d6+5' ? '+5' : ''} = ${a}+${b}${count === '2d6+5' ? '+5' : ''} = ${n}`;
    }
    if (how) {
      this.note(3, `${def.name}: group of ${how}`);
    }
    const group: ChargeGroup = { key, count: n, tincture: 'proper' };
    if (this.o.headOnly && def.italic) {
      const d = this.roll(6);
      group.head = d >= 5;
      this.note(3, `${def.name}: 1D6 = ${d} → ${group.head ? 'only the head' : 'the full figure'}`);
    }
    if (this.o.animation && def.quad && !def.pose) {
      const d = this.roll(6);
      const idx = d + (def.quad === 'h' ? 1 : 0);
      group.pose = POSES[idx - 1];
      this.note(3, `${def.name} animation: 1D6${def.quad === 'h' ? '+1' : ''} = ${idx} → ${group.pose}`);
    }
    return group;
  }

  // Step 2: Tinctures (Table B.2) with the Rule of Tincture
  private rollFieldTincture(furAllowed = true): Tincture {
    for (; ;) {
      const r = this.roll(20);
      const t = lookup(FIELD_ROWS, r);
      if (t !== 'fur') {
        this.note(2, `Field tincture: 1D20 = ${r} → ${t}`);
        return t;
      }
      if (furAllowed) {
        const d = this.roll(6);
        const fur = d <= 4 ? 'ermine' : 'vair';
        this.note(2, `Field tincture: 1D20 = ${r} → fur, 1D6 = ${d} → ${fur}`);
        return fur;
      }
      this.note(2, `Field tincture: 1D20 = ${r} → fur, rerolled`);
    }
  }

  private distinctTinctures(): [Tincture, Tincture] {
    const a = this.rollFieldTincture();
    let b = this.rollFieldTincture();
    while (b === a) {
      this.note(2, 'The same tincture twice, rerolled');
      b = this.rollFieldTincture();
    }
    return [a, b];
  }

  // The column for charges on a field/ordinary of this tincture: a metal on a color and vice-versa, furs: 1D2
  private columnFor(t: Tincture): Column {
    if (isFur(t)) {
      return this.columnD2('Fur');
    }
    return isMetal(t) ? 'color' : 'metal';
  }

  private columnD2(why: string): Column {
    const d = this.roll(2);
    this.note(2, `${why}: 1D2 = ${d} → ${d === 1 ? 'Metal' : 'Color'} Charge column`);
    return d === 1 ? 'metal' : 'color';
  }

  private chargeTincture(column: Column, geometric: boolean, what: string): ChargeTincture {
    const r = this.roll(20);
    let t = lookup(column === 'metal' ? METAL_ROWS : COLOR_ROWS, r);
    let text = `${what} (${column} column): 1D20 = ${r} → ${t}`;
    if (t === 'proper' && geometric) {  // "For Ordinaries and geometric Charges, read this result as Or (metal) or Gules (color)"
      t = column === 'metal' ? 'or' : 'gules';
      text += ` → ${t} (not a natural charge)`;
    }
    this.note(2, text);
    return t;
  }

  private tinctures(design: Design, mode: Mode): void {
    let field: Tincture | undefined;
    if (mode === 'free') {
      field = this.rollFieldTincture();
      design.field = { kind: 'solid', tincture: field };
    }
    const columnForField = (): Column => mode === 'overall' ? this.columnD2('Charge on a Division')
      : this.columnFor(field!);
    const o = design.ordinary;
    if (mode === 'counter') {  // countercharged: the tinctures of the Division apply
      if (o) {
        o.tincture = 'argent';
        if (o.charges) {
          o.charges.tincture = 'argent';
        }
      }
      design.charges.forEach(c => c.tincture = 'argent');
      if (design.minor) {
        design.minor.tincture = 'argent';
      }
      design.counter = true;
      return;
    }
    if (o) {
      o.tincture = this.chargeTincture(columnForField(), true, 'Ordinary tincture') as Tincture;
      const fieldField = design.field as SolidField | undefined;
      if (this.o.swapFur && fieldField && isFur(fieldField.tincture)) {
        const d = this.roll(6);
        this.note(2, `Ordinary on a fur: 1D6 = ${d}${d >= 5 ? ' → the fur and the ordinary tincture swap' : ''}`);
        if (d >= 5) {
          [fieldField.tincture, o.tincture] = [o.tincture, fieldField.tincture];
          field = fieldField.tincture;
        }
      }
    }
    for (const g of [...design.charges, ...(design.minor ? [design.minor] : [])]) {
      g.tincture = this.chargeTincture(columnForField(), isGeometric(CHARGE_DEFS[g.key]), 'Charge tincture');
    }
    if (o?.charges) {
      o.charges.tincture = this.chargeTincture(this.columnFor(o.tincture), isGeometric(CHARGE_DEFS[o.charges.key]),
        'Charge tincture (on the ordinary)');
    }
  }

  // Sub-table B.1.1: Variations
  private variation(mode: Mode): Design {
    const r = this.roll(20);
    const row = lookup(VARIATION_ROWS, r);
    let count = row.count;
    if (row.pattern === 'gyronny') {
      const d = this.roll(6);
      count = d <= 3 ? 8 : d <= 5 ? 12 : 16;
      this.note(1, `Variation: 1D20 = ${r} → gyronny, 1D6 = ${d} → ${count} sectors`);
    } else {
      this.note(1, `Variation: 1D20 = ${r} → ${row.pattern}${count ? ` of ${count}` : ''}`);
    }
    if (row.pattern === 'seme') {
      return this.seme(mode);
    }
    if (mode === 'counter') {
      return { field: { kind: 'variation', pattern: row.pattern, count, a: 'argent', b: 'argent' }, charges: [] };
    }
    // the two-color pattern: a Field Tincture (no fur) and the appropriate Charge Tincture
    const a = this.rollFieldTincture(false);
    const b = this.chargeTincture(this.columnFor(a), true, 'Pattern tincture') as Tincture;
    return { field: { kind: 'variation', pattern: row.pattern, count, a, b }, charges: [] };
  }

  // Semé: a charge of column 5 strewn all over a field (which may be divided)
  private seme(mode: Mode): Design {
    const rolled = this.rollCharge(5, 5);
    const group = this.group(rolled, 1);
    if (mode === 'counter') {
      return { field: { kind: 'variation', pattern: 'seme', seme: group, a: 'argent', b: 'argent' }, charges: [] };
    }
    const dr = this.roll(20);
    const { division } = lookup(DIVISION_ROWS, dr);
    const modifier = division === 'quarterly' || division === 'saltire' ? -2 : 2;
    const dd = this.roll(20);
    const result = Math.min(20, Math.max(1, dd + modifier));
    const design = DIVISION_ROWS.find(row => result <= row[0])![1].design;
    const divided = design === 'solid' || design === 'separate' || design === 'counter';
    this.note(1, `Semé field: division 1D20 = ${dr} → ${division}, design 1D20 = ${dd}${modifier > 0 ? '+' : ''}${modifier}`
      + ` = ${result} → ${divided ? (design === 'counter' ? 'divided, countercharged' : 'divided') : 'the division is ignored'}`);
    let base: Field;
    if (divided) {
      const [a, b] = this.distinctTinctures();
      base = { kind: 'division', division, a, b };
      group.tincture = design === 'counter' ? 'argent'
        : this.chargeTincture(this.columnD2('Charge on a Division'), true, 'Semé tincture');
    } else {
      const a = this.rollFieldTincture();
      base = { kind: 'solid', tincture: a };
      group.tincture = this.chargeTincture(this.columnFor(a), true, 'Semé tincture');
    }
    const b = group.tincture === 'proper' ? 'or' : group.tincture;
    return {
      field: { kind: 'variation', pattern: 'seme', seme: group, a: base.kind === 'solid' ? base.tincture : base.a,
        b: b as Tincture, base, semeCounter: design === 'counter' }, charges: []
    };
  }

  // Sub-table B.1.2: Divisions, then the Design column of the rolled row
  private divided(mode: Mode): Design {
    let row: { division: Division; design: DivisionDesign };
    for (; ;) {
      const r = this.roll(20);
      row = lookup(DIVISION_ROWS, r);
      if (row.design !== 'none') {
        this.note(1, `Division: 1D20 = ${r} → per ${row.division.replace('-', ' ')}${row.design === 'counter' ? ' countercharged' : ''}`);
        break;
      }
      this.note(1, `Division: 1D20 = ${r} → no result, roll again`);
    }
    if (row.design === 'solid') {
      const [a, b] = this.distinctTinctures();
      return { field: { kind: 'division', division: row.division, a, b }, charges: [] };
    }
    if (row.design === 'separate') {
      // "Reroll twice on the Shield Design table, treating each half as their own shield"
      const halves = ['Dexter half', 'Sinister half'].map(name => {
        const outer = this.scope;
        this.scope = name;
        const half = this.shield(true, 'free');
        this.scope = outer;
        return half;
      }) as [Design, Design];
      return { halves, charges: [] };
    }
    const [a, b] = this.distinctTinctures();
    const field: DivisionField = { kind: 'division', division: row.division, a, b };
    if (row.design === 'overall') {  // the shield design ignores the divisions
      const inner = this.shield(true, 'overall');
      if (!inner.field) {
        inner.field = field;
      }
      return inner;
    }
    // countercharged: the charges take the tincture of the opposing division, the "band" colors of a Variation swap
    const inner = this.shield(true, 'counter');
    field.counter = true;
    if (inner.field?.kind === 'variation') {
      field.pattern = { pattern: inner.field.pattern, count: inner.field.count, seme: inner.field.seme };
    }
    inner.field = field;
    inner.counter = true;
    return inner;
  }
}
