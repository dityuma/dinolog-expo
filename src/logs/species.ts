/**
 * Panduan pemeliharaan ringkas per spesies. Angkanya adalah rentang umum dari
 * care sheet yang lazim dipakai keeper — bukan resep medis. Setiap kartu yang
 * menampilkannya wajib menyertakan pengingat untuk tetap konsultasi ke dokter
 * hewan eksotik.
 */
export type SpeciesGuide = {
  /** Kata kunci pencocokan pada teks spesies yang diketik pengguna. */
  match: string[];
  label: string;
  scientific: string;
  baskingC: string;
  ambientC: string;
  humidity: string;
  uvb: string;
  staple: string[];
  avoid: string[];
  supplement: string;
  /** Spesies tropis tidak brumasi — dipakai untuk memperingatkan di tab Brumasi. */
  brumates: boolean;
  note: string;
};

export const SPECIES_GUIDES: SpeciesGuide[] = [
  {
    match: ['sulcata', 'african spurred', 'centrochelys'],
    label: 'Sulcata',
    scientific: 'Centrochelys sulcata',
    baskingC: '35–38 °C',
    ambientC: '26–30 °C',
    humidity: '40–55% (tukik 60–80%)',
    uvb: 'UVB 10.0 selama 10–12 jam',
    staple: ['Rumput odot', 'Rumput gajah mini', 'Hay timothy', 'Bunga sepatu', 'Daun bambu muda'],
    avoid: ['Buah manis', 'Pelet anjing/kucing', 'Bayam berlebih', 'Kubis mentah'],
    supplement: 'Kalsium tanpa D3 2–3x seminggu bila UVB cukup',
    brumates: false,
    note: 'Butuh serat sangat tinggi dan protein rendah. Kelembapan tukik harus dijaga agar karapas tidak piramiding.',
  },
  {
    match: ['aldabra', 'aldabrachelys'],
    label: 'Aldabra',
    scientific: 'Aldabrachelys gigantea',
    baskingC: '32–35 °C',
    ambientC: '26–30 °C',
    humidity: '60–80%',
    uvb: 'UVB 10.0 atau sinar matahari pagi langsung',
    staple: ['Rumput segar', 'Daun singkong', 'Kangkung', 'Bunga sepatu', 'Labu kuning'],
    avoid: ['Protein hewani', 'Buah manis berlebih'],
    supplement: 'Kalsium 2x seminggu',
    brumates: false,
    note: 'Tumbuh sangat besar dan butuh area berendam. Kelembapan tinggi penting untuk pertumbuhan karapas yang mulus.',
  },
  {
    match: ['radiata', 'astrochelys', 'radiated'],
    label: 'Radiata',
    scientific: 'Astrochelys radiata',
    baskingC: '32–35 °C',
    ambientC: '25–29 °C',
    humidity: '60–75%',
    uvb: 'UVB 10.0',
    staple: ['Rumput', 'Opuntia (kaktus)', 'Sawi hijau', 'Selada romaine', 'Bunga sepatu'],
    avoid: ['Buah manis', 'Pakan tinggi protein'],
    supplement: 'Kalsium 2–3x seminggu',
    brumates: false,
    note: 'Rentan masalah pernapasan bila kandang lembap tapi dingin. Jaga suhu stabil dan sirkulasi udara baik.',
  },
  {
    match: ['red foot', 'redfoot', 'cherry', 'carbonarius', 'kaki merah'],
    label: 'Red Foot / Cherry Head',
    scientific: 'Chelonoidis carbonarius',
    baskingC: '30–32 °C',
    ambientC: '25–29 °C',
    humidity: '70–90%',
    uvb: 'UVB 5.0–10.0',
    staple: ['Sawi hijau', 'Selada', 'Pepaya', 'Pisang (sesekali)', 'Jamur', 'Bunga sepatu'],
    avoid: ['Diet kering tanpa buah', 'Kandang kering'],
    supplement: 'Kalsium 2x seminggu, protein hewani 1–2x sebulan',
    brumates: false,
    note: 'Satu-satunya kelompok yang normal makan buah rutin dan sedikit protein hewani. Butuh kelembapan tinggi.',
  },
  {
    match: ['indian star', 'elegans', 'bintang india'],
    label: 'Indian Star',
    scientific: 'Geochelone elegans',
    baskingC: '32–35 °C',
    ambientC: '26–30 °C',
    humidity: '60–80%',
    uvb: 'UVB 10.0',
    staple: ['Rumput', 'Sawi hijau', 'Selada', 'Opuntia', 'Bunga sepatu'],
    avoid: ['Buah', 'Protein hewani', 'Suhu dingin lembap'],
    supplement: 'Kalsium 3x seminggu',
    brumates: false,
    note: 'Sangat sensitif terhadap kombinasi dingin dan lembap — penyebab tersering infeksi saluran napas.',
  },
  {
    match: ['leopard', 'pardalis', 'stigmochelys'],
    label: 'Leopard / Pardalis',
    scientific: 'Stigmochelys pardalis',
    baskingC: '32–35 °C',
    ambientC: '24–29 °C',
    humidity: '40–60%',
    uvb: 'UVB 10.0',
    staple: ['Hay', 'Rumput odot', 'Daun dandelion', 'Opuntia', 'Bunga sepatu'],
    avoid: ['Buah', 'Protein tinggi', 'Kubis dan bayam berlebih'],
    supplement: 'Kalsium 2–3x seminggu',
    brumates: false,
    note: 'Diet harus berserat sangat tinggi. Protein berlebih adalah penyebab utama piramiding pada spesies ini.',
  },
  {
    match: ['hermann', 'boettgeri'],
    label: "Hermann's Tortoise",
    scientific: 'Testudo hermanni',
    baskingC: '32–35 °C',
    ambientC: '22–28 °C',
    humidity: '50–70%',
    uvb: 'UVB 10.0',
    staple: ['Dandelion', 'Semanggi', 'Sawi hijau', 'Bunga sepatu', 'Rumput liar'],
    avoid: ['Buah rutin', 'Pelet berprotein tinggi'],
    supplement: 'Kalsium 2x seminggu',
    brumates: true,
    note: 'Spesies temperate yang memang brumasi tiap tahun. Pastikan berat dan kondisi sehat sebelum brumasi dimulai.',
  },
  {
    match: ['russian', 'horsfield', 'horsfieldii'],
    label: 'Russian Tortoise',
    scientific: 'Testudo horsfieldii',
    baskingC: '32–35 °C',
    ambientC: '21–27 °C',
    humidity: '40–60%',
    uvb: 'UVB 10.0',
    staple: ['Dandelion', 'Semanggi', 'Endive', 'Sawi hijau', 'Rumput liar'],
    avoid: ['Buah', 'Protein hewani'],
    supplement: 'Kalsium 2x seminggu',
    brumates: true,
    note: 'Penggali aktif — substrat harus dalam. Brumasi normal pada musim dingin bila berat mencukupi.',
  },
  {
    match: ['brazil', 'brazilian', 'red ear', 'red-eared', 'slider', 'scripta'],
    label: 'Kura Brazil (Red-Eared Slider)',
    scientific: 'Trachemys scripta elegans',
    baskingC: '32–35 °C (dok berjemur)',
    ambientC: 'Air 24–28 °C',
    humidity: 'Akuatik — butuh area renang dalam',
    uvb: 'UVB 5.0–10.0 di atas dok berjemur',
    staple: ['Pelet kura air', 'Selada air', 'Kangkung', 'Udang kecil (juvenil)'],
    avoid: ['Air dingin', 'Kandang tanpa dok kering', 'Roti / makanan manusia'],
    supplement: 'Kalsium (cuttlebone) di dalam air',
    brumates: true,
    note: 'Spesies akuatik, bukan kura darat. Kualitas air dan filtrasi adalah faktor kesehatan utama.',
  },
];

/** Cocokkan teks spesies bebas dari profil ke salah satu panduan. */
export function findSpeciesGuide(species: string | null | undefined): SpeciesGuide | null {
  if (!species) return null;
  const needle = species.toLowerCase();
  return SPECIES_GUIDES.find(guide => guide.match.some(key => needle.includes(key))) ?? null;
}

export const SPECIES_DISCLAIMER =
  'Panduan umum berdasarkan care sheet yang lazim dipakai keeper, bukan pengganti pemeriksaan dokter hewan eksotik.';
