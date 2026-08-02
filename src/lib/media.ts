import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/**
 * Semua foto disalin ke penyimpanan internal aplikasi agar tetap ada
 * meski file asli di galeri dihapus (offline-first, zero cloud).
 */
const MEDIA_DIR_NAME = 'dinolog-media';

function mediaDir(): Directory {
  const dir = new Directory(Paths.document, MEDIA_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function extensionOf(uri: string): string {
  const clean = uri.split('?')[0];
  const dot = clean.lastIndexOf('.');
  const ext = dot >= 0 ? clean.slice(dot + 1).toLowerCase() : '';
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : 'jpg';
}

let counter = 0;
function uniqueName(ext: string): string {
  counter += 1;
  return `img_${Date.now()}_${counter}.${ext}`;
}

/** Salin URI hasil picker ke direktori internal, kembalikan URI permanen. */
export function persistImage(sourceUri: string): string {
  const source = new File(sourceUri);
  const target = new File(mediaDir(), uniqueName(extensionOf(sourceUri)));
  // Harus copySync: copy() asinkron, sehingga URI bisa dikembalikan sebelum
  // filenya benar-benar ada dan pembacaan berikutnya gagal.
  source.copySync(target);
  return target.uri;
}

/** Hapus file foto internal; aman dipanggil untuk URI yang sudah hilang. */
export function deleteImage(uri: string) {
  if (!uri || !uri.includes(MEDIA_DIR_NAME)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // File sudah tidak ada — tidak perlu diperlakukan sebagai error.
  }
}

export type PickOptions = {
  /** Berapa foto yang masih boleh ditambahkan. */
  remaining?: number;
  allowsEditing?: boolean;
};

/** Pilih foto dari galeri dan langsung simpan ke storage internal. */
export async function pickImagesFromLibrary(options: PickOptions = {}): Promise<string[]> {
  const { remaining = 1, allowsEditing = false } = options;
  if (remaining <= 0) return [];

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Izin akses galeri ditolak.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: remaining > 1,
    selectionLimit: remaining,
    allowsEditing: remaining === 1 && allowsEditing,
    quality: 0.7,
  });
  if (result.canceled) return [];

  return result.assets.slice(0, remaining).map(asset => persistImage(asset.uri));
}

/** Ambil foto lewat kamera dan simpan ke storage internal. */
export async function captureImage(allowsEditing = false): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Izin akses kamera ditolak.');

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing,
    quality: 0.7,
  });
  if (result.canceled) return null;

  return persistImage(result.assets[0].uri);
}
