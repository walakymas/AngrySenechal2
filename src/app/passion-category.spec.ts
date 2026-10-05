import { groupPassions, passionCategory } from './passion-category';

describe('passion-category', () => {
  it('derives the category from the first word', () => {
    const expected: { [name: string]: string } = {
      'Loyalty (Lord)': 'Fidelitas',
      'Fealthy (Lord)': 'Fidelitas',
      'Love(Family)': 'Fervor',
      'Hate Saxons': 'Fervor',
      'Amor (Ygraine)': 'Adoratio',
      'Honor': 'Other',
      'Hospitability': 'Civilitas',
      'Directed Trait: Generous (Family)': 'Other',
      '': 'Other',
    };
    for (const [name, category] of Object.entries(expected)) {
      expect(passionCategory(name)).withContext(name).toBe(category);
    }
  });

  it('groups in category order and skips empty categories', () => {
    const groups = groupPassions({ 'Honor': 15, 'Love (Family)': 12, 'Loyalty (Lord)': 15 });
    expect(groups.map(g => g.category)).toEqual(['Other', 'Fidelitas', 'Fervor']);
    expect(groups.map(g => g.total)).toEqual([15, 15, 12]);
  });

  it('handles missing passions', () => {
    expect(groupPassions(undefined)).toEqual([]);
    expect(groupPassions({})).toEqual([]);
  });
});
