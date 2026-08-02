import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useConfirm } from '../../../../src/components/ConfirmDialog';
import { DateField } from '../../../../src/components/DateField';
import { PhotoPicker } from '../../../../src/components/PhotoPicker';
import { Body, Button, Card, ChipGroup, Field, Row, Screen, Title } from '../../../../src/components/ui';
import { listPhotos, logs } from '../../../../src/db/repo';
import type { PhotoOwnerType } from '../../../../src/db/types';
import { isValidISODate, parseISODate, today } from '../../../../src/lib/date';
import {
  FEEDING_FREQUENCIES,
  FOOD_PRESETS,
  SEVERITIES,
  SHELL_CONDITIONS,
  TAB_TITLE,
  shellCondition,
} from '../../../../src/logs/meta';
import { useTheme } from '../../../../src/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

type FormState = Record<string, string>;

const DEFAULTS: Record<PhotoOwnerType, FormState> = {
  growth: { date: '', weight_g: '', length_cm: '', note: '' },
  feeding: { date: '', food_type: '', amount: '', frequency: '', note: '' },
  shell: { date: '', condition: 'normal', severity: 'ringan', note: '' },
  health: { title: '', start_date: '', end_date: '', ongoing: '1', treatment: '', note: '' },
  brumation: { start_date: '', end_date: '', weight_before: '', weight_after: '', note: '' },
};

function numberOrNull(value: string): number | null {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function LogFormScreen() {
  const { id, type, logId } = useLocalSearchParams<{ id: string; type: string; logId?: string }>();
  const petId = Number(id);
  // Rute dinamis bisa saja dibuka dengan tipe yang tidak dikenal (mis. dari deep link).
  const ownerType = (type in DEFAULTS ? type : 'growth') as PhotoOwnerType;
  const editingId = logId ? Number(logId) : null;

  const db = useSQLiteContext();
  const router = useRouter();
  const { theme } = useTheme();
  const confirm = useConfirm();

  const [form, setForm] = useState<FormState>(() => {
    const base = { ...DEFAULTS[ownerType] };
    if ('date' in base) base.date = today();
    if ('start_date' in base) base.start_date = today();
    return base;
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormState>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editingId != null);

  useEffect(() => {
    if (editingId == null) return;
    void (async () => {
      const row = await logs.get<Record<string, unknown>>(db, ownerType, editingId);
      if (row) {
        const next: FormState = { ...DEFAULTS[ownerType] };
        for (const key of Object.keys(next)) {
          const value = row[key];
          next[key] = value == null ? '' : String(value);
        }
        setForm(next);
        setPhotos((await listPhotos(db, ownerType, editingId)).map(p => p.uri));
      }
      setLoading(false);
    })();
  }, [db, ownerType, editingId]);

  const set = (key: string) => (value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const validate = (): FormState => {
    const next: FormState = {};
    const requireDate = (key: string, label: string) => {
      if (!form[key]?.trim()) next[key] = `${label} wajib diisi.`;
      else if (!isValidISODate(form[key])) next[key] = 'Format harus YYYY-MM-DD.';
    };
    const optionalDate = (key: string) => {
      if (form[key]?.trim() && !isValidISODate(form[key])) next[key] = 'Format harus YYYY-MM-DD.';
    };
    const numeric = (key: string, label: string) => {
      if (form[key]?.trim() && numberOrNull(form[key]) == null) next[key] = `${label} harus berupa angka.`;
      else if (form[key]?.trim() && (numberOrNull(form[key]) as number) < 0)
        next[key] = `${label} tidak boleh negatif.`;
    };

    switch (ownerType) {
      case 'growth':
        requireDate('date', 'Tanggal');
        numeric('weight_g', 'Berat');
        numeric('length_cm', 'Panjang');
        if (!form.weight_g.trim() && !form.length_cm.trim())
          next.weight_g = 'Isi minimal salah satu: berat atau panjang.';
        break;
      case 'feeding':
        requireDate('date', 'Tanggal');
        if (!form.food_type.trim()) next.food_type = 'Jenis pakan wajib diisi.';
        break;
      case 'shell':
        requireDate('date', 'Tanggal');
        break;
      case 'health':
        if (!form.title.trim()) next.title = 'Nama keluhan wajib diisi.';
        requireDate('start_date', 'Tanggal mulai');
        if (form.ongoing !== '1') {
          requireDate('end_date', 'Tanggal selesai');
          if (!next.end_date && !next.start_date && form.end_date < form.start_date)
            next.end_date = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
        }
        break;
      case 'brumation':
        requireDate('start_date', 'Tanggal mulai');
        optionalDate('end_date');
        numeric('weight_before', 'Berat sebelum');
        numeric('weight_after', 'Berat sesudah');
        if (!next.end_date && form.end_date.trim() && form.end_date < form.start_date)
          next.end_date = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
        break;
    }
    return next;
  };

  const buildRow = (): Record<string, unknown> => {
    switch (ownerType) {
      case 'growth':
        return {
          pet_id: petId,
          date: form.date.trim(),
          weight_g: numberOrNull(form.weight_g),
          length_cm: numberOrNull(form.length_cm),
          note: form.note.trim(),
        };
      case 'feeding':
        return {
          pet_id: petId,
          date: form.date.trim(),
          food_type: form.food_type.trim(),
          amount: form.amount.trim(),
          frequency: form.frequency.trim(),
          note: form.note.trim(),
        };
      case 'shell':
        return {
          pet_id: petId,
          date: form.date.trim(),
          condition: form.condition,
          severity: form.severity,
          note: form.note.trim(),
        };
      case 'health':
        return {
          pet_id: petId,
          title: form.title.trim(),
          start_date: form.start_date.trim(),
          end_date: form.ongoing === '1' ? null : form.end_date.trim() || null,
          ongoing: form.ongoing === '1' ? 1 : 0,
          treatment: form.treatment.trim(),
          note: form.note.trim(),
        };
      case 'brumation':
        return {
          pet_id: petId,
          start_date: form.start_date.trim(),
          end_date: form.end_date.trim() || null,
          weight_before: numberOrNull(form.weight_before),
          weight_after: numberOrNull(form.weight_after),
          note: form.note.trim(),
        };
    }
  };

  const submit = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSaving(true);
    try {
      await logs.save(db, ownerType, editingId, buildRow(), photos);
      router.back();
    } catch (error) {
      Alert.alert('Gagal menyimpan', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (editingId == null) return;
    const ok = await confirm({
      title: 'Hapus catatan ini?',
      message: 'Catatan beserta seluruh fotonya akan dihapus permanen dari perangkat.',
      confirmLabel: 'Hapus catatan',
      destructive: true,
    });
    if (!ok) return;
    await logs.remove(db, ownerType, editingId);
    router.back();
  };

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen
        options={{ title: `${editingId ? 'Ubah' : 'Tambah'} ${TAB_TITLE[ownerType]}` }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}>
          {ownerType === 'growth' ? (
            <>
              <DateField
                label="Tanggal"
                value={form.date}
                onChange={set('date')}
                error={errors.date}
                maximumDate={new Date()}
              />
              <Field
                label="Berat (gram)"
                value={form.weight_g}
                onChangeText={set('weight_g')}
                keyboardType="decimal-pad"
                placeholder="Contoh: 850"
                error={errors.weight_g}
              />
              <Field
                label="Panjang karapas (cm)"
                value={form.length_cm}
                onChangeText={set('length_cm')}
                keyboardType="decimal-pad"
                placeholder="Contoh: 18.5"
                error={errors.length_cm}
              />
            </>
          ) : null}

          {ownerType === 'feeding' ? (
            <>
              <DateField
                label="Tanggal"
                value={form.date}
                onChange={set('date')}
                error={errors.date}
                maximumDate={new Date()}
              />
              <Field
                label="Jenis pakan"
                value={form.food_type}
                onChangeText={set('food_type')}
                placeholder="Contoh: Rumput odot"
                error={errors.food_type}
              />
              <ChipGroup
                label="Preset pakan"
                options={FOOD_PRESETS.map(f => ({ value: f, label: f }))}
                value={form.food_type}
                onChange={set('food_type')}
              />
              <Field label="Porsi" value={form.amount} onChangeText={set('amount')} placeholder="Contoh: 2 genggam" />
              <ChipGroup
                label="Frekuensi"
                options={FEEDING_FREQUENCIES.map(f => ({ value: f, label: f }))}
                value={form.frequency}
                onChange={set('frequency')}
              />
            </>
          ) : null}

          {ownerType === 'shell' ? (
            <>
              <DateField
                label="Tanggal"
                value={form.date}
                onChange={set('date')}
                error={errors.date}
                maximumDate={new Date()}
              />
              <ChipGroup
                label="Kondisi karapas"
                options={SHELL_CONDITIONS.map(c => ({ value: c.value, label: c.label }))}
                value={form.condition}
                onChange={set('condition')}
              />
              <ChipGroup
                label="Tingkat keparahan"
                options={SEVERITIES.map(s => ({ value: s, label: s }))}
                value={form.severity}
                onChange={set('severity')}
              />
              {shellCondition(form.condition).critical ? (
                <Card style={{ borderColor: theme.colors.warning, backgroundColor: theme.colors.warning + '14' }}>
                  <Row>
                    <Ionicons name="warning-outline" size={18} color={theme.colors.warning} />
                    <Title style={{ fontSize: 15, color: theme.colors.warning }}>
                      Perlu perhatian dokter hewan
                    </Title>
                  </Row>
                  <Body style={{ fontSize: 13 }}>{shellCondition(form.condition).warning}</Body>
                </Card>
              ) : null}
            </>
          ) : null}

          {ownerType === 'health' ? (
            <>
              <Field
                label="Keluhan / penyakit"
                value={form.title}
                onChangeText={set('title')}
                placeholder="Contoh: Flu / runny nose"
                error={errors.title}
              />
              <DateField
                label="Tanggal mulai"
                value={form.start_date}
                onChange={set('start_date')}
                error={errors.start_date}
                maximumDate={new Date()}
              />
              <ChipGroup
                label="Status"
                options={[
                  { value: '1', label: 'Masih berlangsung' },
                  { value: '0', label: 'Sudah sembuh' },
                ]}
                value={form.ongoing}
                onChange={set('ongoing')}
              />
              {form.ongoing === '0' ? (
                <DateField
                  label="Tanggal selesai"
                  value={form.end_date}
                  onChange={set('end_date')}
                  error={errors.end_date}
                  minimumDate={parseISODate(form.start_date) ?? undefined}
                  maximumDate={new Date()}
                />
              ) : null}
              <Field
                label="Penanganan"
                value={form.treatment}
                onChangeText={set('treatment')}
                multiline
                placeholder="Obat, dosis, kunjungan dokter…"
              />
            </>
          ) : null}

          {ownerType === 'brumation' ? (
            <>
              <DateField
                label="Tanggal mulai"
                value={form.start_date}
                onChange={set('start_date')}
                error={errors.start_date}
                maximumDate={new Date()}
              />
              <DateField
                label="Tanggal selesai"
                value={form.end_date}
                onChange={set('end_date')}
                helper="Kosongkan bila brumasi masih berlangsung."
                error={errors.end_date}
                clearable
                minimumDate={parseISODate(form.start_date) ?? undefined}
                maximumDate={new Date()}
              />
              <Field
                label="Berat sebelum (gram)"
                value={form.weight_before}
                onChangeText={set('weight_before')}
                keyboardType="decimal-pad"
                error={errors.weight_before}
              />
              <Field
                label="Berat sesudah (gram)"
                value={form.weight_after}
                onChangeText={set('weight_after')}
                keyboardType="decimal-pad"
                helper="Penurunan berat lebih dari 10% adalah tanda bahaya — hentikan brumasi dan periksakan."
                error={errors.weight_after}
              />
            </>
          ) : null}

          <Field label="Catatan" value={form.note} onChangeText={set('note')} multiline />

          <PhotoPicker uris={photos} onChange={setPhotos} />

          <Button title="Simpan" icon="save-outline" onPress={submit} loading={saving} />
          {editingId != null ? (
            <Button title="Hapus Catatan" variant="danger" icon="trash-outline" onPress={confirmDelete} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
