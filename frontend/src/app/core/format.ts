import { Pipe, PipeTransform } from '@angular/core';

export const PERIODS = ['9:00', '9:45', '10:30', '11:30', '12:15', '1:45', '2:30'];
export const MAX_PERIODS = 12;
/** Start time of period index i. Beyond the standard 7, each extra period starts 45 minutes after the previous one. */
export function periodTime(i: number): string {
  if (i < PERIODS.length) return PERIODS[i];
  const [h, m] = PERIODS[PERIODS.length - 1].split(':').map(Number);
  const mins = ((h < 8 ? h + 12 : h) * 60 + m) + 45 * (i - PERIODS.length + 1);
  const hh = Math.floor(mins / 60), mm = mins % 60;
  return (hh > 12 ? hh - 12 : hh) + ':' + String(mm).padStart(2, '0');
}
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const SUBJECTS = ['Maths', 'Science', 'English', 'Hindi', 'Telugu', 'Social', 'Computer', 'PE'];
export const CORE = ['Maths', 'Science', 'English', 'Social', 'Hindi', 'Telugu'];
export const todayIdx = () => { const d = new Date().getDay(); return d === 0 ? 0 : d - 1; };

@Pipe({ name: 'inr', standalone: true })
export class InrPipe implements PipeTransform {
  transform(n: number | null | undefined): string { return '₹' + Math.round(n ?? 0).toLocaleString('en-IN'); }
}
/** "8A" -> "8-A" */
@Pipe({ name: 'cls', standalone: true })
export class ClassPipe implements PipeTransform {
  transform(c: string | null | undefined): string { return (c ?? '').replace(/^(\d+)(\w)$/, '$1-$2'); }
}
