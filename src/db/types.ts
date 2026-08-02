export type Gender = 'male' | 'female' | 'unknown';

export type Pet = {
  id: number;
  name: string;
  species: string;
  gender: Gender;
  birth_date: string | null;
  adoption_date: string | null;
  photo_uri: string | null;
  note: string;
  created_at: number;
};

export type GrowthLog = {
  id: number;
  pet_id: number;
  date: string;
  weight_g: number | null;
  length_cm: number | null;
  note: string;
  created_at: number;
};

export type FeedingLog = {
  id: number;
  pet_id: number;
  date: string;
  food_type: string;
  amount: string;
  frequency: string;
  note: string;
  created_at: number;
};

export type HealthLog = {
  id: number;
  pet_id: number;
  title: string;
  start_date: string;
  end_date: string | null;
  ongoing: number;
  treatment: string;
  note: string;
  created_at: number;
};

export type ShellLog = {
  id: number;
  pet_id: number;
  date: string;
  condition: string;
  severity: string;
  note: string;
  created_at: number;
};

export type BrumationLog = {
  id: number;
  pet_id: number;
  start_date: string;
  end_date: string | null;
  weight_before: number | null;
  weight_after: number | null;
  note: string;
  created_at: number;
};

export type Photo = {
  id: number;
  owner_type: PhotoOwnerType;
  owner_id: number;
  uri: string;
  created_at: number;
};

export type PhotoOwnerType = 'growth' | 'feeding' | 'health' | 'shell' | 'brumation';

/** Maksimum foto per entri log, sesuai PRD. */
export const MAX_PHOTOS_PER_LOG = 4;

export const LOG_TABLES: Record<PhotoOwnerType, string> = {
  growth: 'growth_logs',
  feeding: 'feeding_logs',
  health: 'health_logs',
  shell: 'shell_logs',
  brumation: 'brumation_logs',
};
