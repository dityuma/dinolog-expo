import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { rescheduleAllReminders } from '../db/repo';
import { LOG_TABLES } from '../db/types';
import { deleteImage, persistImage } from './media';

export const BACKUP_FORMAT = 'dinolog-backup';
export const BACKUP_VERSION = 1;

type BackupPayload = {
  format: string;
  version: number;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
  /** URI internal -> isi file dalam base64, agar backup bisa dipindah antar perangkat. */
  media: Record<string, string>;
};

const TABLES = ['pets', ...Object.values(LOG_TABLES), 'photos', 'reminders'];

function collectMediaUris(tables: BackupPayload['tables']): string[] {
  const uris = new Set<string>();
  for (const pet of tables.pets ?? []) {
    const uri = pet.photo_uri as string | null;
    if (uri) uris.add(uri);
  }
  for (const photo of tables.photos ?? []) {
    uris.add(photo.uri as string);
  }
  return [...uris];
}

function readBase64(uri: string): string | null {
  try {
    const file = new File(uri);
    return file.exists ? file.base64Sync() : null;
  } catch {
    return null;
  }
}

export async function buildBackup(
  db: SQLiteDatabase,
  includePhotos: boolean
): Promise<BackupPayload> {
  const tables: BackupPayload['tables'] = {};
  for (const table of TABLES) {
    tables[table] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
  }

  const media: Record<string, string> = {};
  if (includePhotos) {
    for (const uri of collectMediaUris(tables)) {
      const base64 = readBase64(uri);
      if (base64) media[uri] = base64;
    }
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
    media,
  };
}

/** Tulis backup ke file lalu buka share sheet supaya pengguna menyimpannya sendiri. */
export async function exportBackup(db: SQLiteDatabase, includePhotos: boolean): Promise<string> {
  const payload = await buildBackup(db, includePhotos);
  const stamp = payload.exportedAt.slice(0, 19).replace(/[:T]/g, '-');
  // Ditulis ke cache: file hanya perantara untuk share sheet, biar tidak menumpuk.
  const file = new File(Paths.cache, `dinolog-backup-${stamp}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(payload));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Simpan backup DinoLog',
      UTI: 'public.json',
    });
  }
  return file.uri;
}

export type ImportResult = { pets: number; logs: number; photos: number; reminders: number };

/**
 * Impor backup. Seluruh data lama dihapus lebih dulu supaya hasil impor
 * identik dengan perangkat sumber (restore, bukan merge).
 */
export async function importBackup(db: SQLiteDatabase): Promise<ImportResult | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', '*/*'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled) return null;

  const raw = new File(picked.assets[0].uri).textSync();
  let payload: BackupPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error('File tidak dapat dibaca sebagai JSON.');
  }
  if (payload?.format !== BACKUP_FORMAT || !payload.tables?.pets) {
    throw new Error('File ini bukan backup DinoLog yang valid.');
  }
  if (payload.version > BACKUP_VERSION) {
    throw new Error('Backup dibuat oleh versi DinoLog yang lebih baru.');
  }

  // Tulis ulang file media dan petakan URI lama -> URI baru di perangkat ini.
  const uriMap: Record<string, string> = {};
  for (const [oldUri, base64] of Object.entries(payload.media ?? {})) {
    const extension = oldUri.split('.').pop() ?? 'jpg';
    const temp = new File(Paths.cache, `restore-${Object.keys(uriMap).length}.${extension}`);
    if (temp.exists) temp.delete();
    temp.create();
    temp.write(base64, { encoding: 'base64' });
    uriMap[oldUri] = persistImage(temp.uri);
    temp.delete();
  }
  const mapUri = (uri: string | null) => (uri ? (uriMap[uri] ?? uri) : null);

  const counts: ImportResult = { pets: 0, logs: 0, photos: 0, reminders: 0 };
  // Foto milik data lama, dicatat sebelum dihapus supaya filenya bisa dibersihkan.
  const previousUris = collectMediaUris({
    pets: await db.getAllAsync<Record<string, unknown>>('SELECT photo_uri FROM pets'),
    photos: await db.getAllAsync<Record<string, unknown>>('SELECT uri FROM photos'),
  });

  await db.withExclusiveTransactionAsync(async tx => {
    // pets dihapus lebih dulu; log turunan ikut terhapus lewat cascade.
    await tx.runAsync('DELETE FROM photos');
    await tx.runAsync('DELETE FROM pets');

    for (const table of TABLES) {
      const rows = payload.tables[table] ?? [];
      for (const row of rows) {
        const data = { ...row } as Record<string, unknown>;
        if (table === 'pets') data.photo_uri = mapUri(data.photo_uri as string | null);
        if (table === 'photos') data.uri = mapUri(data.uri as string) ?? data.uri;
        // Identifier notifikasi milik perangkat asal tidak berlaku di sini;
        // jadwalnya dipasang ulang setelah transaksi selesai.
        if (table === 'reminders') data.notification_id = null;

        const keys = Object.keys(data);
        await tx.runAsync(
          `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${keys
            .map(() => '?')
            .join(', ')})`,
          ...keys.map(k => data[k] as never)
        );
      }
      if (table === 'pets') counts.pets = rows.length;
      else if (table === 'photos') counts.photos = rows.length;
      else if (table === 'reminders') counts.reminders = rows.length;
      else counts.logs += rows.length;
    }
  });

  // Backup tanpa foto memakai kembali URI lama, jadi hanya file yang benar-benar
  // tidak lagi dirujuk setelah impor yang boleh dihapus.
  const keptUris = new Set(collectMediaUris(payload.tables).map(uri => uriMap[uri] ?? uri));
  previousUris.filter(uri => !keptUris.has(uri)).forEach(deleteImage);

  await rescheduleAllReminders(db);

  return counts;
}
