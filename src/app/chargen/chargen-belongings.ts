/** Table 2.2: Additional Belongings (1d20). A pénz a karakter `economy.money` mezőibe, a lovak a `winter.horses` listába, a tárgyak a `belongings` listába kerülnek. */

export interface Belonging {
  name: string;
  value?: string;
  description?: string;
}

export interface BelongingsResult {
  /** a dobások olvasható leírása, sorrendben */
  rolls: string[];
  /** silver = denár, font = £ */
  money: { silver: number, font: number };
  horses: string[];
  items: Belonging[];
}

/** dice(n): 1..n közötti egész, injektálható a teszteléshez */
export type DiceFn = (sides: number) => number;

const RELICS = ['finger', 'tears', 'hair', 'hair', 'bone fragment', 'blood'];
const CLOAKS = ['Byzantium', 'Byzantium', 'Germany', 'Spain', 'Spain', 'Rome'];

function sum(dice: DiceFn, count: number, sides: number): number {
  let result = 0;
  for (let i = 0; i < count; i++) {
    result += dice(sides);
  }
  return result;
}

export function isPaganReligion(religion: string): boolean {
  return /pagan|heathen/i.test(religion || '');
}

export function emptyBelongings(): BelongingsResult {
  return { rolls: [], money: { silver: 0, font: 0 }, horses: [], items: [] };
}

/** Egy dobás eredményét hozzáadja az összesítőhöz. A 20 két további dobást jelent (a további 20-asokat újradobva). */
function applyRoll(result: BelongingsResult, dice: DiceFn, pagan: boolean): void {
  let r = dice(20);
  // a keresztény ereklye pogánynak nem jár: újradobás
  while (r == 8 && pagan) {
    r = dice(20);
  }
  if (r == 20) {
    result.rolls.push('20: Roll twice more');
    for (let i = 0; i < 2; i++) {
      let again = dice(20);
      while (again == 20 || (again == 8 && pagan)) {
        again = dice(20);
      }
      applyResult(result, again, dice);
    }
    return;
  }
  applyResult(result, r, dice);
}

function applyResult(result: BelongingsResult, r: number, dice: DiceFn): void {
  const label = String(r).padStart(2, '0');
  if (r == 1) {
    const d = sum(dice, 3, 20);
    result.money.silver += d;
    result.rolls.push(`${label}: Money (${d}d.)`);
  } else if (r <= 3) {
    const d = sum(dice, 3, 20) + 100;
    result.money.silver += d;
    result.rolls.push(`${label}: Money (${d}d.)`);
  } else if (r <= 6) {
    result.money.font += 1;
    result.rolls.push(`${label}: Money (£1)`);
  } else if (r == 7) {
    const f = dice(6);
    result.money.font += f;
    result.rolls.push(`${label}: Money (£${f})`);
  } else if (r == 8) {
    const relic = RELICS[dice(6) - 1];
    result.items.push({ name: `Sacred Christian relic (${relic})`, description: 'Heirloom' });
    result.rolls.push(`${label}: Heirloom — sacred Christian relic (${relic})`);
  } else if (r == 9) {
    result.items.push({ name: 'Ancient bronze sword', value: '£2', description: 'Heirloom. +1 modifier to Sword skill when used; breaks in combat as if it was not a sword.' });
    result.rolls.push(`${label}: Heirloom — ancient bronze sword (£2)`);
  } else if (r == 10) {
    result.items.push({ name: 'Blessed lance', value: '25d.', description: 'Heirloom. +1 modifier to Lance skill for mounted charges until it breaks.' });
    result.rolls.push(`${label}: Heirloom — blessed lance (25d.)`);
  } else if (r == 11) {
    result.items.push({ name: 'Decorated saddle', value: '£1', description: 'Heirloom' });
    result.rolls.push(`${label}: Heirloom — decorated saddle (£1)`);
  } else if (r == 12) {
    const gold = dice(6) >= 5;
    result.items.push({ name: gold ? 'Engraved gold ring' : 'Engraved silver ring', value: gold ? '£2' : '120d.', description: 'Heirloom' });
    result.rolls.push(`${label}: Heirloom — engraved ${gold ? 'gold ring (£2)' : 'silver ring (120d.)'}`);
  } else if (r == 13) {
    const gold = dice(6) == 6;
    result.items.push({ name: gold ? 'Gold arm band' : 'Silver arm band', value: gold ? '£8' : '£1', description: 'Heirloom' });
    result.rolls.push(`${label}: Heirloom — ${gold ? 'gold arm band (£8)' : 'silver arm band (£1)'}`);
  } else if (r == 14) {
    const origin = CLOAKS[dice(6) - 1];
    result.items.push({ name: `Valuable cloak (${origin})`, value: '£1', description: 'Heirloom' });
    result.rolls.push(`${label}: Heirloom — valuable cloak from ${origin} (£1)`);
  } else if (r == 15) {
    result.items.push({ name: 'Magic healing potion', value: 'priceless', description: 'Cures 1d6 damage, once.' });
    result.rolls.push(`${label}: Magic healing potion`);
  } else if (r <= 17) {
    result.horses.push('rouncy');
    result.rolls.push(`${label}: An extra rouncy`);
  } else if (r == 18) {
    result.horses.push('charger');
    result.rolls.push(`${label}: A second charger`);
  } else if (r == 19) {
    result.horses.push('courser');
    result.rolls.push(`${label}: A courser`);
  }
}

export function rollBelongings(dice: DiceFn, religion: string): BelongingsResult {
  const result = emptyBelongings();
  applyRoll(result, dice, isPaganReligion(religion));
  return result;
}
