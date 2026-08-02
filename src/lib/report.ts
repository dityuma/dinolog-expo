import { File } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  getPet,
  listBrumation,
  listFeeding,
  listGrowth,
  listHealth,
  listShell,
} from '../db/repo';
import { findSpeciesGuide, SPECIES_DISCLAIMER } from '../logs/species';
import { shellCondition } from '../logs/meta';
import type { Theme } from '../theme/themes';
import { daysBetween, formatAge, formatDate } from './date';

/** Escape agar catatan pengguna tidak merusak struktur HTML laporan. */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function table(headers: string[], rows: string[][]): string {
  if (!rows.length) return '<p class="empty">Belum ada catatan pada kategori ini.</p>';
  return `
    <table>
      <thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows
          .map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
          .join('')}
      </tbody>
    </table>`;
}

function photoDataUri(uri: string | null): string | null {
  if (!uri) return null;
  try {
    const file = new File(uri);
    if (!file.exists) return null;
    const extension = uri.split('.').pop()?.toLowerCase();
    const mime = extension === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${file.base64Sync()}`;
  } catch {
    return null;
  }
}

/**
 * Rangkuman kesehatan untuk dibawa konsultasi ke dokter hewan.
 * Dirender sebagai HTML lalu dicetak ke PDF oleh expo-print.
 */
export async function buildReportHtml(
  db: SQLiteDatabase,
  petId: number,
  theme: Theme
): Promise<{ html: string; petName: string }> {
  const pet = await getPet(db, petId);
  if (!pet) throw new Error('Profil tidak ditemukan.');

  const [growth, feeding, health, shell, brumation] = await Promise.all([
    listGrowth(db, petId),
    listFeeding(db, petId),
    listHealth(db, petId),
    listShell(db, petId),
    listBrumation(db, petId),
  ]);

  const guide = findSpeciesGuide(pet.species);
  const genderLabel = { male: 'Jantan', female: 'Betina', unknown: 'Belum diketahui' }[pet.gender];
  const latest = growth[0];
  const oldest = growth[growth.length - 1];
  const weightDelta =
    latest?.weight_g != null && oldest?.weight_g != null && growth.length > 1
      ? latest.weight_g - oldest.weight_g
      : null;
  const photo = photoDataUri(pet.photo_uri);
  const ongoing = health.filter(h => h.ongoing);

  // Warna laporan mengikuti tema aktif agar konsisten dengan tampilan aplikasi.
  const accent = theme.colors.primary;

  const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, Roboto, Helvetica, sans-serif; color: #1f2421; padding: 28px 32px; font-size: 12px; }
      h1 { font-size: 22px; margin: 0; }
      h2 { font-size: 14px; margin: 26px 0 8px; padding-bottom: 5px; border-bottom: 2px solid ${accent}; color: ${accent}; }
      .header { display: flex; gap: 16px; align-items: center; border-bottom: 3px solid ${accent}; padding-bottom: 14px; }
      .header img { width: 92px; height: 92px; object-fit: cover; border-radius: 10px; }
      .sub { color: #667; margin: 3px 0 0; font-size: 12px; }
      .meta { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; }
      .chip { border: 1px solid #d8ddd9; border-radius: 999px; padding: 3px 10px; font-size: 11px; }
      .chip.alert { border-color: #c0392b; color: #c0392b; }
      table { width: 100%; border-collapse: collapse; margin-top: 4px; }
      th { text-align: left; background: #f2f4f3; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
      th, td { border: 1px solid #dfe4e1; padding: 6px 8px; vertical-align: top; }
      .empty { color: #889; font-style: italic; margin: 4px 0; }
      .cards { display: flex; gap: 10px; margin-top: 10px; }
      .card { flex: 1; border: 1px solid #dfe4e1; border-radius: 8px; padding: 10px; }
      .card .value { font-size: 17px; font-weight: 700; color: ${accent}; }
      .card .label { font-size: 10px; text-transform: uppercase; color: #778; letter-spacing: .4px; }
      footer { margin-top: 28px; border-top: 1px solid #dfe4e1; padding-top: 10px; color: #889; font-size: 10px; }
    </style>
  </head>
  <body>
    <div class="header">
      ${photo ? `<img src="${photo}" />` : ''}
      <div>
        <h1>${esc(pet.name)}</h1>
        <p class="sub">${esc(pet.species || 'Spesies belum diisi')}${
          guide ? ` · <i>${esc(guide.scientific)}</i>` : ''
        }</p>
        <p class="sub">${esc(genderLabel)} · ${esc(formatAge(pet.birth_date))}</p>
        <p class="sub">Lahir ${esc(formatDate(pet.birth_date))} · Adopsi ${esc(
          formatDate(pet.adoption_date)
        )}</p>
      </div>
    </div>

    <div class="meta">
      ${ongoing
        .map(h => `<span class="chip alert">Sakit berlangsung: ${esc(h.title)}</span>`)
        .join('')}
      ${brumation.some(b => !b.end_date) ? '<span class="chip alert">Sedang brumasi</span>' : ''}
    </div>

    <div class="cards">
      <div class="card">
        <div class="label">Berat terakhir</div>
        <div class="value">${latest?.weight_g != null ? `${latest.weight_g} g` : '—'}</div>
      </div>
      <div class="card">
        <div class="label">Panjang terakhir</div>
        <div class="value">${latest?.length_cm != null ? `${latest.length_cm} cm` : '—'}</div>
      </div>
      <div class="card">
        <div class="label">Perubahan berat</div>
        <div class="value">${
          weightDelta != null
            ? `${weightDelta > 0 ? '+' : ''}${Math.round(weightDelta * 10) / 10} g`
            : '—'
        }</div>
      </div>
      <div class="card">
        <div class="label">Total catatan</div>
        <div class="value">${growth.length + feeding.length + health.length + shell.length + brumation.length}</div>
      </div>
    </div>

    ${pet.note ? `<h2>Catatan profil</h2><p>${esc(pet.note)}</p>` : ''}

    <h2>Riwayat Sakit</h2>
    ${table(
      ['Keluhan', 'Mulai', 'Selesai', 'Lama', 'Penanganan'],
      health.map(h => [
        esc(h.title),
        esc(formatDate(h.start_date)),
        h.ongoing ? '<b>Berlangsung</b>' : esc(formatDate(h.end_date)),
        `${daysBetween(h.start_date, h.end_date) ?? '—'} hari`,
        esc([h.treatment, h.note].filter(Boolean).join(' — ')),
      ])
    )}

    <h2>Kondisi Karapas</h2>
    ${table(
      ['Tanggal', 'Kondisi', 'Keparahan', 'Catatan'],
      shell.map(s => [
        esc(formatDate(s.date)),
        esc(shellCondition(s.condition).label),
        esc(s.severity),
        esc(s.note),
      ])
    )}

    <h2>Pertumbuhan</h2>
    ${table(
      ['Tanggal', 'Berat (g)', 'Panjang (cm)', 'Catatan'],
      growth.map(g => [
        esc(formatDate(g.date)),
        g.weight_g != null ? esc(g.weight_g) : '—',
        g.length_cm != null ? esc(g.length_cm) : '—',
        esc(g.note),
      ])
    )}

    <h2>Brumasi</h2>
    ${table(
      ['Mulai', 'Selesai', 'Lama', 'Berat sebelum', 'Berat sesudah', 'Selisih'],
      brumation.map(b => {
        const delta =
          b.weight_before != null && b.weight_after != null
            ? Math.round((b.weight_after - b.weight_before) * 10) / 10
            : null;
        const percent =
          delta != null && b.weight_before ? (delta / b.weight_before) * 100 : null;
        const critical = percent != null && percent <= -10;
        return [
          esc(formatDate(b.start_date)),
          b.end_date ? esc(formatDate(b.end_date)) : '<b>Berjalan</b>',
          `${daysBetween(b.start_date, b.end_date) ?? '—'} hari`,
          b.weight_before != null ? esc(b.weight_before) : '—',
          b.weight_after != null ? esc(b.weight_after) : '—',
          delta == null
            ? '—'
            : `<span style="color:${critical ? '#c0392b' : 'inherit'}">${
                delta > 0 ? '+' : ''
              }${delta} g${percent != null ? ` (${percent.toFixed(1)}%)` : ''}</span>`,
        ];
      })
    )}

    <h2>Pola Makan (20 terakhir)</h2>
    ${table(
      ['Tanggal', 'Pakan', 'Porsi', 'Frekuensi'],
      feeding.slice(0, 20).map(f => [
        esc(formatDate(f.date)),
        esc(f.food_type),
        esc(f.amount),
        esc(f.frequency),
      ])
    )}

    ${
      guide
        ? `<h2>Acuan Husbandry — ${esc(guide.label)}</h2>
           <table>
             <tr><th>Basking</th><td>${esc(guide.baskingC)}</td><th>Ambient</th><td>${esc(
               guide.ambientC
             )}</td></tr>
             <tr><th>Kelembapan</th><td>${esc(guide.humidity)}</td><th>UVB</th><td>${esc(
               guide.uvb
             )}</td></tr>
             <tr><th>Pakan utama</th><td colspan="3">${esc(guide.staple.join(', '))}</td></tr>
             <tr><th>Hindari</th><td colspan="3">${esc(guide.avoid.join(', '))}</td></tr>
             <tr><th>Suplemen</th><td colspan="3">${esc(guide.supplement)}</td></tr>
           </table>
           <p class="empty">${esc(SPECIES_DISCLAIMER)}</p>`
        : ''
    }

    <footer>
      Dibuat oleh DinoLog pada ${esc(
        new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
      )}.
      Laporan ini adalah catatan pemilik, bukan dokumen diagnosis medis.
    </footer>
  </body>
</html>`;

  return { html, petName: pet.name };
}

/** Buat PDF lalu buka share sheet agar pengguna menyimpan atau mengirimnya. */
export async function exportPetReport(db: SQLiteDatabase, petId: number, theme: Theme) {
  const { html, petName } = await buildReportHtml(db, petId, theme);
  const { uri } = await Print.printToFileAsync({ html });

  // printToFileAsync memberi nama acak; ganti agar file yang dibagikan mudah dikenali.
  const slug = petName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'hewan';
  const source = new File(uri);
  const target = new File(source.parentDirectory, `laporan-${slug}.pdf`);
  if (target.exists) target.delete();
  source.moveSync(target);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Laporan kesehatan ${petName}`,
      UTI: 'com.adobe.pdf',
    });
  }
  return target.uri;
}
