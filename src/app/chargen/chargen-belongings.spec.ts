import { isPaganReligion, rollBelongings } from './chargen-belongings';

/** Előre megadott dobássorozat; ha elfogy, hibát jelez. */
function scripted(values: number[]) {
  const queue = [...values];
  return (sides: number) => {
    const v = queue.shift();
    if (v === undefined) {
      throw new Error('elfogytak a dobások');
    }
    expect(v).toBeGreaterThanOrEqual(1);
    expect(v).toBeLessThanOrEqual(sides);
    return v;
  };
}

describe('chargen-belongings', () => {
  const christian = 'British Christian';

  it('01: 3d20 denár', () => {
    const r = rollBelongings(scripted([1, 10, 5, 20]), christian);
    expect(r.money).toEqual({ silver: 35, font: 0 });
  });

  it('02-03: 3d20+100 denár', () => {
    const r = rollBelongings(scripted([3, 1, 1, 1]), christian);
    expect(r.money.silver).toBe(103);
  });

  it('04-06: £1, 07: £1d6', () => {
    expect(rollBelongings(scripted([5]), christian).money.font).toBe(1);
    expect(rollBelongings(scripted([7, 4]), christian).money.font).toBe(4);
  });

  it('08: ereklye a d6 szerint, pogánynál újradobás', () => {
    const r = rollBelongings(scripted([8, 6]), christian);
    expect(r.items[0].name).toBe('Sacred Christian relic (blood)');
    const pagan = rollBelongings(scripted([8, 8, 5]), 'British Pagan');
    expect(pagan.items).toEqual([]);
    expect(pagan.money.font).toBe(1);
  });

  it('09-11, 15: fix tárgyak', () => {
    expect(rollBelongings(scripted([9]), christian).items[0].name).toBe('Ancient bronze sword');
    expect(rollBelongings(scripted([10]), christian).items[0].value).toBe('25d.');
    expect(rollBelongings(scripted([11]), christian).items[0].name).toBe('Decorated saddle');
    expect(rollBelongings(scripted([15]), christian).items[0].name).toBe('Magic healing potion');
  });

  it('12-14: d6 szerinti anyag és érték', () => {
    expect(rollBelongings(scripted([12, 4]), christian).items[0]).toEqual(jasmine.objectContaining({ name: 'Engraved silver ring', value: '120d.' }));
    expect(rollBelongings(scripted([12, 5]), christian).items[0]).toEqual(jasmine.objectContaining({ name: 'Engraved gold ring', value: '£2' }));
    expect(rollBelongings(scripted([13, 5]), christian).items[0].value).toBe('£1');
    expect(rollBelongings(scripted([13, 6]), christian).items[0].value).toBe('£8');
    expect(rollBelongings(scripted([14, 4]), christian).items[0].name).toBe('Valuable cloak (Spain)');
  });

  it('16-19: lovak', () => {
    expect(rollBelongings(scripted([16]), christian).horses).toEqual(['rouncy']);
    expect(rollBelongings(scripted([17]), christian).horses).toEqual(['rouncy']);
    expect(rollBelongings(scripted([18]), christian).horses).toEqual(['charger']);
    expect(rollBelongings(scripted([19]), christian).horses).toEqual(['courser']);
  });

  it('20: két további dobás, a további 20-asokat újradobja', () => {
    const r = rollBelongings(scripted([20, 20, 18, 19]), christian);
    expect(r.horses).toEqual(['charger', 'courser']);
    expect(r.rolls.length).toBe(3);
  });

  it('isPaganReligion', () => {
    expect(isPaganReligion('British Pagan')).toBeTrue();
    expect(isPaganReligion('Heathenism')).toBeTrue();
    expect(isPaganReligion('Roman Christian')).toBeFalse();
    expect(isPaganReligion(undefined)).toBeFalse();
  });
});
