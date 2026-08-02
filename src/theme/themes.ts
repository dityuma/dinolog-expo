/**
 * 8 tema bernuansa kura-kura. Setiap tema hanya berupa token warna —
 * seluruh UI membaca warna dari sini lewat `useTheme()`.
 */
export type ThemeColors = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  accent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  danger: string;
  warning: string;
  success: string;
};

export type Theme = {
  id: string;
  label: string;
  description: string;
  dark: boolean;
  colors: ThemeColors;
};

const base = {
  danger: '#C0392B',
  warning: '#D98324',
  success: '#2E7D52',
};

export const THEMES: Theme[] = [
  {
    id: 'sulcata-desert',
    label: 'Sulcata Desert',
    description: 'Pasir hangat & kuning gurun',
    dark: false,
    colors: {
      ...base,
      primary: '#B8823A',
      onPrimary: '#FFFFFF',
      primaryContainer: '#F5E3C6',
      onPrimaryContainer: '#4A3213',
      accent: '#8C6D3F',
      background: '#FDF7EC',
      surface: '#FFFFFF',
      surfaceAlt: '#F7EDDC',
      border: '#E5D5BB',
      text: '#3B2E1C',
      textMuted: '#8A7A63',
    },
  },
  {
    id: 'aldabra-giant',
    label: 'Aldabra Giant',
    description: 'Abu batu & hijau lumut pulau',
    dark: false,
    colors: {
      ...base,
      primary: '#4F6659',
      onPrimary: '#FFFFFF',
      primaryContainer: '#DCE6DF',
      onPrimaryContainer: '#1F2C25',
      accent: '#7B8C81',
      background: '#F4F7F5',
      surface: '#FFFFFF',
      surfaceAlt: '#E9EFEB',
      border: '#D2DCD6',
      text: '#26302B',
      textMuted: '#6F7C76',
    },
  },
  {
    id: 'radiata-starburst',
    label: 'Radiata Starburst',
    description: 'Kuning bintang di karapas gelap',
    dark: false,
    colors: {
      ...base,
      primary: '#E0A800',
      onPrimary: '#241C00',
      primaryContainer: '#FFF0BF',
      onPrimaryContainer: '#3D3000',
      accent: '#5A4A12',
      background: '#FFFCF2',
      surface: '#FFFFFF',
      surfaceAlt: '#FBF3D9',
      border: '#EADFB8',
      text: '#2E2A17',
      textMuted: '#857D5E',
    },
  },
  {
    id: 'cherry-head',
    label: 'Cherry Head',
    description: 'Merah ceri red-foot tortoise',
    dark: false,
    colors: {
      ...base,
      primary: '#B33A3A',
      onPrimary: '#FFFFFF',
      primaryContainer: '#F8DCDC',
      onPrimaryContainer: '#4A1414',
      accent: '#8A2F2F',
      background: '#FFF7F6',
      surface: '#FFFFFF',
      surfaceAlt: '#FAEAE8',
      border: '#EFD3D0',
      text: '#37211F',
      textMuted: '#8B6D6A',
    },
  },
  {
    id: 'indian-star',
    label: 'Indian Star',
    description: 'Krem lembut dengan garis kuning',
    dark: false,
    colors: {
      ...base,
      primary: '#7A6A34',
      onPrimary: '#FFFFFF',
      primaryContainer: '#EFE7C8',
      onPrimaryContainer: '#332C0C',
      accent: '#A79350',
      background: '#FBF9F1',
      surface: '#FFFFFF',
      surfaceAlt: '#F2EDDD',
      border: '#E0D8BF',
      text: '#332E1D',
      textMuted: '#7E7660',
    },
  },
  {
    id: 'leopard-savanna',
    label: 'Leopard Savanna',
    description: 'Cokelat tutul padang savana',
    dark: false,
    colors: {
      ...base,
      primary: '#8A5A2B',
      onPrimary: '#FFFFFF',
      primaryContainer: '#F0DCC5',
      onPrimaryContainer: '#3A2310',
      accent: '#B98A55',
      background: '#FCF8F3',
      surface: '#FFFFFF',
      surfaceAlt: '#F3E9DC',
      border: '#E4D3BE',
      text: '#3A2C1F',
      textMuted: '#87745F',
    },
  },
  {
    id: 'galapagos-night',
    label: 'Galapagos Night',
    description: 'Mode gelap batu vulkanik',
    dark: true,
    colors: {
      ...base,
      primary: '#7FB08A',
      onPrimary: '#0E1A12',
      primaryContainer: '#24382B',
      onPrimaryContainer: '#CFE7D6',
      accent: '#A8C9B0',
      background: '#121714',
      surface: '#1B221D',
      surfaceAlt: '#232C26',
      border: '#333E36',
      text: '#E6EDE8',
      textMuted: '#9AA79F',
      danger: '#E57373',
      warning: '#E8A857',
      success: '#7FD1A0',
    },
  },
  {
    id: 'pancake-rock',
    label: 'Pancake Rock',
    description: 'Mode gelap cokelat batu pipih',
    dark: true,
    colors: {
      ...base,
      primary: '#C99A63',
      onPrimary: '#231708',
      primaryContainer: '#3C2C1A',
      onPrimaryContainer: '#F0DCC2',
      accent: '#E0BC8E',
      background: '#161210',
      surface: '#211B17',
      surfaceAlt: '#2B231E',
      border: '#3D332C',
      text: '#EDE5DD',
      textMuted: '#A79A8E',
      danger: '#E57373',
      warning: '#E8A857',
      success: '#7FD1A0',
    },
  },
];

export const DEFAULT_THEME_ID = 'sulcata-desert';

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}
