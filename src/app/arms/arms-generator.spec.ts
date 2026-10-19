import { CHARGE_COLUMNS, CHARGE_DEFS, isFur, isMetal, ORDINARY_NAMES, SUBTABLES } from './arms-data';
import { ArmsOptions, generateArms, Roller } from './arms-generator';
import { renderArmsSvg } from './arms-svg';

// A roller that gives the rolls of the book's examples, in the order the generator asks for them
const scripted = (rolls: number[]): Roller => sides => {
  const r = rolls.shift();
  if (r === undefined || r > sides) {
    throw new Error(`Unexpected 1D${sides} (script: ${r})`);
  }
  return r;
};

// A small deterministic generator, so a failure can be reproduced
const seeded = (seed: number): Roller => sides => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return 1 + Math.floor((seed / 4294967296) * sides);
};

const ALL: ArmsOptions = { headOnly: true, moreCharges: true, animation: true, swapFur: true };
const NONE: ArmsOptions = { headOnly: false, moreCharges: false, animation: false, swapFur: false };

describe('Coat of Arms generator (Appendix B)', () => {
  it('every entry of the tables is a known charge, ordinary or sub-table', () => {
    const entries = [...CHARGE_COLUMNS.flat(), ...Object.values(SUBTABLES).flat()];
    for (const entry of entries.flatMap(e => e.split('|'))) {
      if (entry.startsWith('*')) {
        expect(SUBTABLES[entry.slice(1)]).withContext(entry).toBeDefined();
      } else if (entry.startsWith('@')) {
        expect(ORDINARY_NAMES[entry.slice(1) as keyof typeof ORDINARY_NAMES]).withContext(entry).toBeDefined();
      } else {
        expect(CHARGE_DEFS[entry]).withContext(entry).toBeDefined();
      }
    }
    expect(CHARGE_COLUMNS.every(c => c.length === 20)).toBeTrue();
  });

  it('gives Sir Lycus\'s coat of arms', () => {
    // 1D20 = 12 (Peripheral Ordinary + Charge on the Ordinary), 1D6 = 3 (chief), column 1, row 16 (wolf), 1D3 = 1,
    // field 17 (vert), ordinary: metal, 1 (argent), charge: color, 15 (sable)
    const r = generateArms(scripted([12, 3, 1, 16, 1, 17, 1, 15]), NONE);
    expect(r.blazon).toBe('Vert, on a chief argent a sable wolf.');
  });

  it('gives Sir Iowerth\'s coat of arms', () => {
    // 1D20 = 14 (Ordinary + Charge on the Field), 1D6 = 4 (bend), column 5, row 12 (mullet of 6 or 8), 1D2 = 2 (8 points),
    // 1D3 = 2, field 10 (purpure), ordinary: metal, 6 (argent), charge: metal, 1 (argent)
    const r = generateArms(scripted([14, 4, 5, 12, 2, 2, 10, 6, 1]), NONE);
    expect(r.blazon).toBe('Purpure, a bend between two mullets of eight points argent.');
  });

  it('keeps the Rule of Tincture on a normal shield', () => {
    const roller = seeded(7);
    let checked = 0;
    for (let i = 0; i < 3000; i++) {
      const { design } = generateArms(roller, NONE);
      if (design.field?.kind !== 'solid' || isFur(design.field.tincture)) {
        continue;
      }
      const field = design.field.tincture;
      const ordinary = design.ordinary;
      const onField = [...design.charges, ...(design.minor ? [design.minor] : [])].map(g => g.tincture);
      for (const t of [...onField, ...(ordinary ? [ordinary.tincture] : [])]) {
        if (t !== 'proper') {
          expect(isMetal(t)).withContext(`${t} on ${field}`).toBe(!isMetal(field));
          checked++;
        }
      }
      if (ordinary?.charges && ordinary.charges.tincture !== 'proper') {
        expect(isMetal(ordinary.charges.tincture)).toBe(!isMetal(ordinary.tincture));
      }
    }
    expect(checked).toBeGreaterThan(500);
  });

  it('generates and draws every kind of design without a flaw', () => {
    const roller = seeded(2024);
    for (let i = 0; i < 4000; i++) {
      const r = generateArms(roller, i % 2 ? ALL : NONE);
      expect(r.blazon).withContext(r.blazon).toMatch(/^[A-Z][^.]*\.$/);
      expect(r.blazon).not.toContain('undefined');
      expect(r.log.length).toBeGreaterThan(0);
      const svg = renderArmsSvg(r.design, 't' + i);
      expect(svg.startsWith('<svg')).toBeTrue();
      expect(svg.endsWith('</svg>')).toBeTrue();
      expect(svg).withContext(r.blazon).not.toMatch(/NaN|undefined|Infinity/);
    }
  });

  it('draws every charge of the tables', () => {
    for (const key of Object.keys(CHARGE_DEFS)) {
      const def = CHARGE_DEFS[key];
      expect(def.shape || def.glyph).withContext(key).toBeTruthy();
    }
  });
});
