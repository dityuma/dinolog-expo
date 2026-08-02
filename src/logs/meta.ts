import type { Ionicons } from '@expo/vector-icons';
import type { PhotoOwnerType } from '../db/types';

export type TabKey = PhotoOwnerType;

export const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'growth', label: 'Tumbuh', icon: 'trending-up-outline' },
  { key: 'feeding', label: 'Makan', icon: 'restaurant-outline' },
  { key: 'shell', label: 'Karapas', icon: 'shield-outline' },
  { key: 'health', label: 'Riwayat', icon: 'medkit-outline' },
  { key: 'brumation', label: 'Brumasi', icon: 'snow-outline' },
];

export const TAB_TITLE: Record<TabKey, string> = {
  growth: 'Log Pertumbuhan',
  feeding: 'Log Makan',
  shell: 'Log Karapas',
  health: 'Riwayat Sakit',
  brumation: 'Log Brumasi',
};

/** Preset pakan umum untuk kura-kura darat. */
export const FOOD_PRESETS = [
  'Rumput odot',
  'Rumput gajah mini',
  'Kangkung',
  'Sawi hijau',
  'Selada',
  'Timun',
  'Wortel parut',
  'Labu kuning',
  'Pepaya',
  'Bunga sepatu',
  'Pelet tortoise',
  'Kalsium + D3',
];

export const FEEDING_FREQUENCIES = ['1x sehari', '2x sehari', 'Selang sehari', '2 hari sekali', 'Mingguan'];

export type ShellCondition = {
  value: string;
  label: string;
  /** Kondisi kritis memunculkan kartu peringatan edukatif. */
  critical: boolean;
  warning?: string;
};

export const SHELL_CONDITIONS: ShellCondition[] = [
  { value: 'normal', label: 'Normal', critical: false },
  {
    value: 'piramiding',
    label: 'Piramiding',
    critical: true,
    warning:
      'Piramiding menandakan scute tumbuh meninggi, umumnya akibat kelembapan terlalu rendah, protein berlebih, atau kekurangan kalsium/UVB. Perbaiki kelembapan kandang dan pola makan berserat tinggi, lalu konsultasikan ke dokter hewan eksotik.',
  },
  {
    value: 'soft-shell',
    label: 'Soft Shell',
    critical: true,
    warning:
      'Karapas lunak adalah gejala Metabolic Bone Disease akibat defisit kalsium atau UVB. Ini kondisi serius — segera periksakan ke dokter hewan eksotik dan evaluasi sumber UVB serta suplementasi kalsium.',
  },
  {
    value: 'jamur',
    label: 'Jamur',
    critical: true,
    warning:
      'Bercak jamur menandakan kandang terlalu lembap atau kotor. Keringkan dan bersihkan kandang, pisahkan hewan bila perlu, dan minta resep antifungal dari dokter hewan. Jangan gunakan obat manusia tanpa arahan.',
  },
  {
    value: 'retak',
    label: 'Retak / Luka',
    critical: true,
    warning:
      'Retak atau luka pada karapas berisiko infeksi. Jaga area tetap kering dan bersih, hindari substrat kotor, dan segera bawa ke dokter hewan untuk penanganan luka.',
  },
  { value: 'shedding', label: 'Shedding Normal', critical: false },
];

export const SEVERITIES = ['ringan', 'sedang', 'berat'];

export function shellCondition(value: string): ShellCondition {
  return SHELL_CONDITIONS.find(c => c.value === value) ?? SHELL_CONDITIONS[0];
}
