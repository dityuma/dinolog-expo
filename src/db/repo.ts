import type { SQLiteDatabase } from 'expo-sqlite';
import { deleteImage } from '../lib/media';
import {
  cancelAllReminders,
  cancelReminder,
  ensureAndroidChannel,
  scheduleReminder,
} from '../lib/notifications';
import {
  LOG_TABLES,
  type BrumationLog,
  type FeedingLog,
  type GrowthLog,
  type HealthLog,
  type Pet,
  type Photo,
  type PhotoOwnerType,
  type Reminder,
  type ShellLog,
} from './types';

type Row = Record<string, unknown>;

function buildInsert(table: string, data: Row) {
  const keys = Object.keys(data);
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
  return { sql, values: keys.map(k => data[k] as never) };
}

function buildUpdate(table: string, id: number, data: Row) {
  const keys = Object.keys(data);
  const sql = `UPDATE ${table} SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`;
  return { sql, values: [...keys.map(k => data[k] as never), id as never] };
}

// ---------------------------------------------------------------- pets

export async function listPets(db: SQLiteDatabase): Promise<Pet[]> {
  return db.getAllAsync<Pet>('SELECT * FROM pets ORDER BY created_at DESC');
}

export async function getPet(db: SQLiteDatabase, id: number): Promise<Pet | null> {
  return db.getFirstAsync<Pet>('SELECT * FROM pets WHERE id = ?', id);
}

export type PetInput = Omit<Pet, 'id' | 'created_at'>;

export async function createPet(db: SQLiteDatabase, input: PetInput): Promise<number> {
  const { sql, values } = buildInsert('pets', { ...input, created_at: Date.now() });
  const result = await db.runAsync(sql, ...values);
  return result.lastInsertRowId;
}

export async function updatePet(db: SQLiteDatabase, id: number, input: PetInput) {
  const previous = await getPet(db, id);
  const { sql, values } = buildUpdate('pets', id, { ...input });
  await db.runAsync(sql, ...values);
  if (previous?.photo_uri && previous.photo_uri !== input.photo_uri) {
    deleteImage(previous.photo_uri);
  }
}

/**
 * Hapus profil beserta seluruh log turunannya (cascade lewat foreign key)
 * dan seluruh file foto yang terkait dari penyimpanan internal.
 */
export async function deletePet(db: SQLiteDatabase, id: number) {
  const pet = await getPet(db, id);
  const uris: string[] = [];
  if (pet?.photo_uri) uris.push(pet.photo_uri);

  for (const [ownerType, table] of Object.entries(LOG_TABLES)) {
    const photos = await db.getAllAsync<{ uri: string }>(
      `SELECT p.uri FROM photos p
       JOIN ${table} l ON l.id = p.owner_id
       WHERE p.owner_type = ? AND l.pet_id = ?`,
      ownerType,
      id
    );
    uris.push(...photos.map(p => p.uri));
    await db.runAsync(
      `DELETE FROM photos WHERE owner_type = ? AND owner_id IN (SELECT id FROM ${table} WHERE pet_id = ?)`,
      ownerType,
      id
    );
  }

  // Baris pengingat ikut terhapus lewat cascade, tapi notifikasi terjadwalnya
  // hidup di luar database dan harus dibatalkan sendiri.
  const reminders = await db.getAllAsync<{ notification_id: string | null }>(
    'SELECT notification_id FROM reminders WHERE pet_id = ?',
    id
  );

  await db.runAsync('DELETE FROM pets WHERE id = ?', id);

  uris.forEach(deleteImage);
  for (const reminder of reminders) await cancelReminder(reminder.notification_id);
}

// ---------------------------------------------------------------- photos

export async function listPhotos(
  db: SQLiteDatabase,
  ownerType: PhotoOwnerType,
  ownerId: number
): Promise<Photo[]> {
  return db.getAllAsync<Photo>(
    'SELECT * FROM photos WHERE owner_type = ? AND owner_id = ? ORDER BY created_at ASC',
    ownerType,
    ownerId
  );
}

export async function replacePhotos(
  db: SQLiteDatabase,
  ownerType: PhotoOwnerType,
  ownerId: number,
  uris: string[]
) {
  const existing = await listPhotos(db, ownerType, ownerId);
  const removed = existing.filter(p => !uris.includes(p.uri));

  await db.runAsync('DELETE FROM photos WHERE owner_type = ? AND owner_id = ?', ownerType, ownerId);
  for (const uri of uris) {
    await db.runAsync(
      'INSERT INTO photos (owner_type, owner_id, uri, created_at) VALUES (?, ?, ?, ?)',
      ownerType,
      ownerId,
      uri,
      Date.now()
    );
  }
  removed.forEach(p => deleteImage(p.uri));
}

// ---------------------------------------------------------------- generic logs

async function listLogs<T>(db: SQLiteDatabase, table: string, petId: number, orderBy: string) {
  return db.getAllAsync<T>(
    `SELECT * FROM ${table} WHERE pet_id = ? ORDER BY ${orderBy} DESC, id DESC`,
    petId
  );
}

async function getLog<T>(db: SQLiteDatabase, table: string, id: number) {
  return db.getFirstAsync<T>(`SELECT * FROM ${table} WHERE id = ?`, id);
}

async function saveLog(
  db: SQLiteDatabase,
  ownerType: PhotoOwnerType,
  id: number | null,
  data: Row,
  photoUris: string[]
): Promise<number> {
  const table = LOG_TABLES[ownerType];
  let rowId = id ?? 0;
  if (id == null) {
    const { sql, values } = buildInsert(table, { ...data, created_at: Date.now() });
    const result = await db.runAsync(sql, ...values);
    rowId = result.lastInsertRowId;
  } else {
    const { sql, values } = buildUpdate(table, id, data);
    await db.runAsync(sql, ...values);
  }
  await replacePhotos(db, ownerType, rowId, photoUris);
  return rowId;
}

async function deleteLog(db: SQLiteDatabase, ownerType: PhotoOwnerType, id: number) {
  const photos = await listPhotos(db, ownerType, id);
  await db.runAsync('DELETE FROM photos WHERE owner_type = ? AND owner_id = ?', ownerType, id);
  await db.runAsync(`DELETE FROM ${LOG_TABLES[ownerType]} WHERE id = ?`, id);
  photos.forEach(p => deleteImage(p.uri));
}

export const logs = {
  list: <T>(db: SQLiteDatabase, ownerType: PhotoOwnerType, petId: number) => {
    const orderBy = ownerType === 'health' || ownerType === 'brumation' ? 'start_date' : 'date';
    return listLogs<T>(db, LOG_TABLES[ownerType], petId, orderBy);
  },
  get: <T>(db: SQLiteDatabase, ownerType: PhotoOwnerType, id: number) =>
    getLog<T>(db, LOG_TABLES[ownerType], id),
  save: saveLog,
  remove: deleteLog,
};

// Alias bertipe agar pemanggil tidak perlu menulis parameter generic.
export const listGrowth = (db: SQLiteDatabase, petId: number) =>
  logs.list<GrowthLog>(db, 'growth', petId);
export const listFeeding = (db: SQLiteDatabase, petId: number) =>
  logs.list<FeedingLog>(db, 'feeding', petId);
export const listHealth = (db: SQLiteDatabase, petId: number) =>
  logs.list<HealthLog>(db, 'health', petId);
export const listShell = (db: SQLiteDatabase, petId: number) =>
  logs.list<ShellLog>(db, 'shell', petId);
export const listBrumation = (db: SQLiteDatabase, petId: number) =>
  logs.list<BrumationLog>(db, 'brumation', petId);

// ---------------------------------------------------------------- reminders

export type ReminderInput = Omit<Reminder, 'id' | 'created_at' | 'notification_id'>;

export async function listReminders(db: SQLiteDatabase, petId: number): Promise<Reminder[]> {
  return db.getAllAsync<Reminder>(
    'SELECT * FROM reminders WHERE pet_id = ? ORDER BY enabled DESC, hour, minute, id',
    petId
  );
}

/**
 * Simpan pengingat lalu segarkan jadwal notifikasinya. Notifikasi lama selalu
 * dibatalkan lebih dulu agar tidak ada jadwal yatim yang tetap berbunyi.
 */
export async function saveReminder(
  db: SQLiteDatabase,
  id: number | null,
  input: ReminderInput,
  petName: string
): Promise<number> {
  let rowId = id ?? 0;

  if (id == null) {
    const { sql, values } = buildInsert('reminders', { ...input, created_at: Date.now() });
    const result = await db.runAsync(sql, ...values);
    rowId = result.lastInsertRowId;
  } else {
    const previous = await db.getFirstAsync<Reminder>('SELECT * FROM reminders WHERE id = ?', id);
    await cancelReminder(previous?.notification_id);
    const { sql, values } = buildUpdate('reminders', id, { ...input });
    await db.runAsync(sql, ...values);
  }

  const saved = await db.getFirstAsync<Reminder>('SELECT * FROM reminders WHERE id = ?', rowId);
  const notificationId = saved ? await scheduleReminder(saved, petName) : null;
  await db.runAsync('UPDATE reminders SET notification_id = ? WHERE id = ?', notificationId, rowId);
  return rowId;
}

export async function setReminderEnabled(
  db: SQLiteDatabase,
  id: number,
  enabled: boolean,
  petName: string
) {
  const reminder = await db.getFirstAsync<Reminder>('SELECT * FROM reminders WHERE id = ?', id);
  if (!reminder) return;

  await cancelReminder(reminder.notification_id);
  const next = { ...reminder, enabled: enabled ? 1 : 0 };
  const notificationId = enabled ? await scheduleReminder(next, petName) : null;
  await db.runAsync(
    'UPDATE reminders SET enabled = ?, notification_id = ? WHERE id = ?',
    enabled ? 1 : 0,
    notificationId,
    id
  );
}

export async function deleteReminder(db: SQLiteDatabase, id: number) {
  const reminder = await db.getFirstAsync<Reminder>('SELECT * FROM reminders WHERE id = ?', id);
  await cancelReminder(reminder?.notification_id);
  await db.runAsync('DELETE FROM reminders WHERE id = ?', id);
}

/**
 * Pasang ulang seluruh jadwal dari isi database. Dipakai setelah impor backup,
 * karena identifier notifikasi dari perangkat lama tidak berlaku di sini.
 */
export async function rescheduleAllReminders(db: SQLiteDatabase) {
  await ensureAndroidChannel();
  await cancelAllReminders();
  const rows = await db.getAllAsync<Reminder & { pet_name: string }>(
    `SELECT r.*, p.name AS pet_name FROM reminders r JOIN pets p ON p.id = r.pet_id`
  );
  for (const row of rows) {
    const notificationId = row.enabled ? await scheduleReminder(row, row.pet_name) : null;
    await db.runAsync('UPDATE reminders SET notification_id = ? WHERE id = ?', notificationId, row.id);
  }
}

/** Ringkasan untuk kartu profil di daftar hewan. */
export async function petSummary(db: SQLiteDatabase, petId: number) {
  const latestGrowth = await db.getFirstAsync<GrowthLog>(
    'SELECT * FROM growth_logs WHERE pet_id = ? ORDER BY date DESC, id DESC LIMIT 1',
    petId
  );
  const ongoing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM health_logs WHERE pet_id = ? AND ongoing = 1',
    petId
  );
  const brumating = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM brumation_logs WHERE pet_id = ? AND end_date IS NULL',
    petId
  );
  return {
    latestWeight: latestGrowth?.weight_g ?? null,
    latestLength: latestGrowth?.length_cm ?? null,
    ongoingIllness: ongoing?.count ?? 0,
    isBrumating: (brumating?.count ?? 0) > 0,
  };
}
