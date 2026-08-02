# DinoLog (Expo)

Aplikasi catatan harian offline untuk kura-kura dan reptil peliharaan — port React Native/Expo
dari DinoLog v6.0 (lihat [PRD_EXPO.md](PRD_EXPO.md)). Berjalan di Android dan iOS.

## Menjalankan

```bash
npx expo start
```

Buka lewat **Expo Go** (SDK 57) atau development build. Seluruh modul native yang dipakai
(SQLite, image picker, file system, SVG) tersedia di Expo Go, jadi tidak perlu build khusus
untuk pengembangan.

Build untuk distribusi:

```bash
eas build --platform android --profile preview
```

## Arsitektur

| Lapisan | Isi |
|---|---|
| `app/` | Rute Expo Router (file-based). `_layout.tsx` memasang `SQLiteProvider` + `ThemeProvider`. |
| `src/db/` | Skema SQLite (`schema.ts`, migrasi via `PRAGMA user_version`), tipe, dan repository CRUD. |
| `src/lib/` | Util tanggal, penyimpanan media internal, ekspor/impor JSON. |
| `src/components/` | Komponen UI bertema: grafik pertumbuhan (react-native-svg), pemilih foto, input tanggal, dialog konfirmasi. |
| `src/theme/` | 8 tema kura-kura, disimpan di AsyncStorage. |
| `src/logs/` | Metadata tab log: preset pakan, kondisi karapas, teks peringatan. |

### Rute

```
/                        daftar profil hewan
/settings                tema, ekspor & impor data
/pet/new                 tambah profil
/pet/[id]                detail + tab log yang bisa digeser (Tumbuh, Makan, Karapas, Riwayat, Brumasi)
/pet/[id]/edit           ubah / hapus profil
/pet/[id]/log/[type]     tambah / ubah / hapus satu entri log
/viewer                  penampil foto layar penuh
```

## Aturan data

- **Offline penuh.** Tidak ada jaringan, akun, atau sinkronisasi cloud. Data ada di SQLite lokal.
- **Foto disalin** ke `Paths.document/dinolog-media` saat dipilih, sehingga tetap ada meski file
  asli di galeri dihapus.
- **Cascade delete.** Menghapus profil menghapus semua log turunannya (foreign key) beserta baris
  foto dan file fisiknya.
- **Backup JSON** berisi seluruh tabel; foto ikut disertakan sebagai base64 bila opsinya aktif.
  Impor bersifat *restore* — data lama diganti, bukan digabung.

## Skema database (v1)

`pets` → `growth_logs`, `feeding_logs`, `health_logs`, `shell_logs`, `brumation_logs`
(semua `ON DELETE CASCADE`), plus tabel `photos` polimorfik (`owner_type` + `owner_id`,
maksimum 4 foto per entri log).

Untuk mengubah skema, tambahkan blok migrasi baru di
[src/db/schema.ts](src/db/schema.ts) dan naikkan `DATABASE_VERSION`.
