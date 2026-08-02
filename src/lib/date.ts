/** Tanggal disimpan sebagai string ISO `YYYY-MM-DD` agar mudah diurutkan di SQL. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(): string {
  return toISODate(new Date());
}

export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return null;
  return date;
}

export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = parseISODate(value);
  if (!date) return value;
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export type Age = { years: number; months: number; days: number };

/** Selisih umur kalender antara `birth` dan `now`. */
export function calculateAge(birthISO: string, now: Date = new Date()): Age | null {
  const birth = parseISODate(birthISO);
  if (!birth || birth > now) return null;

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    // Jumlah hari pada bulan sebelum `now`.
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export function formatAge(birthISO: string | null | undefined): string {
  if (!birthISO) return 'Umur belum diketahui';
  const age = calculateAge(birthISO);
  if (!age) return 'Tanggal lahir tidak valid';

  const parts: string[] = [];
  if (age.years > 0) parts.push(`${age.years} tahun`);
  if (age.months > 0) parts.push(`${age.months} bulan`);
  parts.push(`${age.days} hari`);
  return parts.join(' ');
}

/** Lama hari antara dua tanggal (inklusif hari pertama). */
export function daysBetween(startISO: string, endISO: string | null): number | null {
  const start = parseISODate(startISO);
  const end = endISO ? parseISODate(endISO) : new Date();
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}
