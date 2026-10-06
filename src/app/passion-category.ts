import { Pipe, PipeTransform } from '@angular/core';

// Mirrors senechal/passions.py: the category is derived from the first word of the passion name
export const PASSION_CATEGORIES: { [category: string]: string[] } = {
  Fidelitas: ['duty', 'fealty', 'homage', 'loyalty'],
  Fervor: ['hate', 'love'],
  Adoratio: ['adoration', 'devotion'],
  Civilitas: ['chivalry', 'hospitality', 'station'],
};
const PASSION_ALIASES: { [word: string]: string } = {
  fealthy: 'fealty',
  hospitability: 'hospitality',
  amor: 'adoration',
};
export const OTHER_CATEGORY = 'Other';
export const PASSION_WARN_TOTAL = 40;

export interface PassionGroup {
  category: string;
  items: { key: string; value: any }[];
  total: number;
}

export function passionCategory(name: string): string {
  const m = /^\s*([A-Za-z]+)/.exec(name);
  if (m) {
    let word = m[1].toLowerCase();
    word = PASSION_ALIASES[word] || word;
    for (const [category, types] of Object.entries(PASSION_CATEGORIES)) {
      if (types.includes(word)) {
        return category;
      }
    }
  }
  return OTHER_CATEGORY;
}

export function groupPassions(passions: { [name: string]: any } | undefined | null): PassionGroup[] {
  const groups = [OTHER_CATEGORY, ...Object.keys(PASSION_CATEGORIES)].map(category => ({ category, items: [] as { key: string; value: any }[], total: 0 }));
  for (const [key, value] of Object.entries(passions || {})) {
    const category = passionCategory(key);
    const group = groups.find(g => g.category === category)!;
    group.items.push({ key, value });
    group.total += parseInt(value, 10) || 0;
  }
  return groups.filter(g => g.items.length > 0);
}

@Pipe({
    name: 'passionGroups',
    standalone: false
})
export class PassionGroupsPipe implements PipeTransform {
  transform(passions: { [name: string]: any } | undefined | null): PassionGroup[] {
    return groupPassions(passions);
  }
}
