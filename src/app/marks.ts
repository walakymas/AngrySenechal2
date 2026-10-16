// Marks ("pipák") of a character: the winter checks a mark (Unchecked -> Failed | Increase) and the update raises the
// value of the Increase ones (-> Updated). The data comes from the `marks` API call.

export type MarkStatus = 'Unchecked' | 'Failed' | 'Increase' | 'Updated';

export interface MarkInfo {
  id: number;
  spec: string;
  status: MarkStatus | string;
}

export interface MarkYear {
  year: number;
  marks: MarkInfo[];
}

export interface MarksResponse {
  year: number;
  years: MarkYear[];
  changes?: { name: string; old: number; new: number }[];
  text?: string;
}

const STATUS_COLORS: { [status: string]: string } = {
  Unchecked: '#757575',
  Failed: '#c62828',
  Increase: '#2e7d32',
  Updated: '#1565c0',
};

export function markStatusColor(status: string): string {
  return STATUS_COLORS[status] || STATUS_COLORS['Unchecked'];
}

export function increaseCount(year: MarkYear): number {
  return year.marks.filter(m => m.status === 'Increase').length;
}

// 'Increase: 2, Failed: 1' (statuses without marks are left out)
export function yearSummary(year: MarkYear): string {
  const counts: { [status: string]: number } = {};
  for (const m of year.marks) {
    counts[m.status] = (counts[m.status] || 0) + 1;
  }
  return ['Unchecked', 'Failed', 'Increase', 'Updated']
    .filter(s => counts[s])
    .map(s => `${s}: ${counts[s]}`)
    .join(', ');
}

// the year to open in the dialog: the current one when it has marks, else the latest
export function yearToOpen(years: MarkYear[], current: number): number | null {
  if (!years || years.length === 0) {
    return null;
  }
  return years.some(y => y.year === current) ? current : Math.max(...years.map(y => y.year));
}
