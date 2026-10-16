import { increaseCount, markStatusColor, MarkYear, yearSummary, yearToOpen } from './marks';

describe('marks', () => {
  const year: MarkYear = {
    year: 481,
    marks: [
      { id: 1, spec: 'Sword', status: 'Increase' },
      { id: 2, spec: 'Honest', status: 'Increase' },
      { id: 3, spec: 'Courtesy', status: 'Failed' },
      { id: 4, spec: 'Hunting', status: 'Updated' },
    ],
  };

  it('counts the marks to update', () => {
    expect(increaseCount(year)).toBe(2);
    expect(increaseCount({ year: 482, marks: [] })).toBe(0);
  });

  it('summarizes the statuses of a year', () => {
    expect(yearSummary(year)).toBe('Failed: 1, Increase: 2, Updated: 1');
    expect(yearSummary({ year: 482, marks: [] })).toBe('');
  });

  it('opens the current year, else the latest one', () => {
    const years = [{ year: 482, marks: [] }, { year: 481, marks: [] }, { year: 480, marks: [] }];
    expect(yearToOpen(years, 481)).toBe(481);
    expect(yearToOpen(years, 490)).toBe(482);
    expect(yearToOpen([], 481)).toBeNull();
  });

  it('has a color for every status', () => {
    for (const s of ['Unchecked', 'Failed', 'Increase', 'Updated']) {
      expect(markStatusColor(s)).withContext(s).toMatch(/^#/);
    }
    expect(markStatusColor('whatever')).toBe(markStatusColor('Unchecked'));
  });
});
