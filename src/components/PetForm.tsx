import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import type { PetInput } from '../db/repo';
import type { Gender } from '../db/types';
import { isValidISODate } from '../lib/date';
import { deleteImage, pickImagesFromLibrary } from '../lib/media';
import { useTheme } from '../theme/ThemeProvider';
import { DateField } from './DateField';
import { Body, Button, ChipGroup, Field, Label, Row, Screen, Thumb } from './ui';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'unknown', label: 'Belum diketahui' },
  { value: 'male', label: 'Jantan' },
  { value: 'female', label: 'Betina' },
];

const SPECIES_PRESETS = [
  'Sulcata',
  'Aldabra',
  'Radiata',
  'Red Foot',
  'Indian Star',
  'Leopard',
  'Pardalis',
  'Brazil',
];

export function PetForm({
  initial,
  submitLabel,
  onSubmit,
  onDelete,
}: {
  initial?: PetInput;
  submitLabel: string;
  onSubmit: (input: PetInput) => Promise<void>;
  onDelete?: () => void;
}) {
  const { theme } = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [species, setSpecies] = useState(initial?.species ?? '');
  const [gender, setGender] = useState<Gender>(initial?.gender ?? 'unknown');
  const [birthDate, setBirthDate] = useState(initial?.birth_date ?? '');
  const [adoptionDate, setAdoptionDate] = useState(initial?.adoption_date ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photo_uri ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    try {
      const [uri] = await pickImagesFromLibrary({ remaining: 1, allowsEditing: true });
      if (!uri) return;
      // Foto lama hanya dihapus kalau bukan foto yang sudah tersimpan di database.
      if (photoUri && photoUri !== initial?.photo_uri) deleteImage(photoUri);
      setPhotoUri(uri);
    } catch (error) {
      Alert.alert('Gagal memilih foto', (error as Error).message);
    }
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Nama wajib diisi.';
    if (birthDate && !isValidISODate(birthDate)) next.birthDate = 'Format harus YYYY-MM-DD.';
    if (adoptionDate && !isValidISODate(adoptionDate)) next.adoptionDate = 'Format harus YYYY-MM-DD.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        species: species.trim(),
        gender,
        birth_date: birthDate || null,
        adoption_date: adoptionDate || null,
        photo_uri: photoUri,
        note: note.trim(),
      });
    } catch (error) {
      Alert.alert('Gagal menyimpan', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          <Row style={{ gap: 14 }}>
            <Pressable onPress={pickPhoto}>
              {photoUri ? (
                <Thumb uri={photoUri} size={96} />
              ) : (
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="camera-outline" size={26} color={theme.colors.primary} />
                </View>
              )}
            </Pressable>
            <View style={{ flex: 1, gap: 6 }}>
              <Label>Foto profil</Label>
              <Body muted style={{ fontSize: 13 }}>
                Ketuk kotak untuk memilih foto dari galeri. Foto disalin ke penyimpanan internal aplikasi.
              </Body>
              {photoUri ? (
                <Button
                  title="Hapus foto"
                  variant="ghost"
                  onPress={() => {
                    if (photoUri !== initial?.photo_uri) deleteImage(photoUri);
                    setPhotoUri(null);
                  }}
                />
              ) : null}
            </View>
          </Row>

          <Field label="Nama" value={name} onChangeText={setName} placeholder="Contoh: Kuro" error={errors.name} />

          <Field
            label="Spesies"
            value={species}
            onChangeText={setSpecies}
            placeholder="Contoh: Sulcata"
          />
          <ChipGroup
            options={SPECIES_PRESETS.map(s => ({ value: s, label: s }))}
            value={species}
            onChange={setSpecies}
          />

          <ChipGroup label="Jenis kelamin" options={GENDERS} value={gender} onChange={setGender} />

          <DateField
            label="Tanggal lahir"
            value={birthDate}
            onChange={setBirthDate}
            helper="Dipakai untuk menghitung umur otomatis."
            error={errors.birthDate}
            clearable
            maximumDate={new Date()}
          />
          <DateField
            label="Tanggal adopsi"
            value={adoptionDate}
            onChange={setAdoptionDate}
            error={errors.adoptionDate}
            clearable
            maximumDate={new Date()}
          />
          <Field label="Catatan" value={note} onChangeText={setNote} multiline placeholder="Asal, karakter, kandang…" />

          <Button title={submitLabel} icon="save-outline" onPress={submit} loading={saving} />
          {onDelete ? <Button title="Hapus Profil" variant="danger" icon="trash-outline" onPress={onDelete} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
