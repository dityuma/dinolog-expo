import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, View } from 'react-native';
import { useConfirm } from '../../../src/components/ConfirmDialog';
import { DateField } from '../../../src/components/DateField';
import {
  Badge,
  Body,
  Button,
  Card,
  ChipGroup,
  EmptyState,
  Field,
  Row,
  Screen,
  Title,
} from '../../../src/components/ui';
import {
  deleteReminder,
  getPet,
  listReminders,
  saveReminder,
  setReminderEnabled,
  type ReminderInput,
} from '../../../src/db/repo';
import type { Pet, Reminder, ReminderKind, RepeatMode } from '../../../src/db/types';
import { useDbQuery } from '../../../src/hooks/useDbQuery';
import { today } from '../../../src/lib/date';
import {
  describeSchedule,
  ensureNotificationSetup,
  isReminderExpired,
} from '../../../src/lib/notifications';
import { useTheme } from '../../../src/theme/ThemeProvider';

type Data = { pet: Pet | null; reminders: Reminder[] };

async function loadData(db: SQLiteDatabase, petId: number): Promise<Data> {
  return { pet: await getPet(db, petId), reminders: await listReminders(db, petId) };
}

const KINDS: {
  value: ReminderKind;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  repeat: RepeatMode;
  hour: number;
}[] = [
  { value: 'suplemen', label: 'Suplemen', icon: 'nutrition-outline', title: 'Kalsium + D3', repeat: 'weekly', hour: 8 },
  { value: 'uvb', label: 'Lampu UVB', icon: 'sunny-outline', title: 'Ganti lampu UVB', repeat: 'once', hour: 9 },
  { value: 'vet', label: 'Dokter hewan', icon: 'medkit-outline', title: 'Kontrol ke dokter hewan', repeat: 'once', hour: 9 },
  { value: 'rendam', label: 'Rendam', icon: 'water-outline', title: 'Rendam (soaking)', repeat: 'daily', hour: 7 },
  { value: 'lainnya', label: 'Lainnya', icon: 'notifications-outline', title: '', repeat: 'daily', hour: 8 },
];

const REPEATS: { value: RepeatMode; label: string }[] = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'once', label: 'Sekali' },
];

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function RemindersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = Number(id);
  const { theme } = useTheme();
  const confirm = useConfirm();
  const { data, reload, db } = useDbQuery(database => loadData(database, petId), [petId]);
  const [editing, setEditing] = useState<Reminder | 'new' | null>(null);

  const pet = data?.pet ?? null;
  const reminders = data?.reminders ?? [];
  const petName = pet?.name ?? 'Hewan';

  const toggle = async (reminder: Reminder, value: boolean) => {
    if (value && !(await ensureNotificationSetup())) {
      Alert.alert(
        'Izin notifikasi belum aktif',
        'Aktifkan izin notifikasi untuk DinoLog di pengaturan sistem agar pengingat bisa berbunyi.'
      );
      return;
    }
    await setReminderEnabled(db, reminder.id, value, petName);
    await reload();
  };

  const remove = async (reminder: Reminder) => {
    const ok = await confirm({
      title: 'Hapus pengingat ini?',
      message: `"${reminder.title}" tidak akan dijadwalkan lagi.`,
      confirmLabel: 'Hapus pengingat',
      destructive: true,
    });
    if (!ok) return;
    await deleteReminder(db, reminder.id);
    await reload();
  };

  const openNew = async () => {
    if (!(await ensureNotificationSetup())) {
      Alert.alert(
        'Izin notifikasi belum aktif',
        'DinoLog butuh izin notifikasi untuk mengingatkan Anda. Pengingat tetap bisa dibuat, tapi tidak akan berbunyi sampai izinnya diberikan.'
      );
    }
    setEditing('new');
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: `Pengingat ${petName}` }} />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
        {reminders.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="Belum ada pengingat"
            subtitle="Buat pengingat untuk suplemen kalsium, penggantian lampu UVB, jadwal rendam, atau kontrol ke dokter hewan."
          />
        ) : (
          reminders.map(reminder => {
            const kind = KINDS.find(k => k.value === reminder.kind) ?? KINDS[4];
            return (
              <Card key={reminder.id}>
                <Row style={{ gap: 12 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.colors.primaryContainer,
                    }}>
                    <Ionicons name={kind.icon} size={19} color={theme.colors.onPrimaryContainer} />
                  </View>

                  <Pressable style={{ flex: 1, gap: 2 }} onPress={() => setEditing(reminder)}>
                    <Title style={{ fontSize: 15 }} numberOfLines={1}>
                      {reminder.title}
                    </Title>
                    <Body muted style={{ fontSize: 12 }}>
                      {describeSchedule(reminder)}
                    </Body>
                  </Pressable>

                  <Switch
                    value={reminder.enabled === 1}
                    onValueChange={value => toggle(reminder, value)}
                    trackColor={{ true: theme.colors.primary }}
                  />
                </Row>

                <Row style={{ justifyContent: 'space-between' }}>
                  <Row style={{ gap: 6 }}>
                    <Badge text={kind.label} tone={reminder.enabled ? 'primary' : 'neutral'} />
                    {isReminderExpired(reminder) ? (
                      <Badge text="Sudah lewat" tone="warning" />
                    ) : null}
                  </Row>
                  <Pressable onPress={() => remove(reminder)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={17} color={theme.colors.danger} />
                  </Pressable>
                </Row>
              </Card>
            );
          })
        )}

        <Body muted style={{ fontSize: 12, textAlign: 'center' }}>
          Pengingat dijadwalkan secara lokal di perangkat ini. Tidak ada data yang dikirim ke mana pun.
        </Body>
      </ScrollView>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 24 }}>
        <Button title="Tambah Pengingat" icon="add" onPress={openNew} />
      </View>

      {editing ? (
        <ReminderForm
          reminder={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async input => {
            await saveReminder(db, editing === 'new' ? null : editing.id, input, petName);
            setEditing(null);
            await reload();
          }}
          petId={petId}
        />
      ) : null}
    </Screen>
  );
}

function ReminderForm({
  reminder,
  petId,
  onClose,
  onSave,
}: {
  reminder: Reminder | null;
  petId: number;
  onClose: () => void;
  onSave: (input: ReminderInput) => Promise<void>;
}) {
  const { theme } = useTheme();
  const [kind, setKind] = useState<ReminderKind>(reminder?.kind ?? 'suplemen');
  const [title, setTitle] = useState(reminder?.title ?? KINDS[0].title);
  const [repeat, setRepeat] = useState<RepeatMode>(reminder?.repeat_mode ?? 'weekly');
  const [weekday, setWeekday] = useState(String(reminder?.weekday ?? 1));
  const [day, setDay] = useState(String(reminder?.day ?? 1));
  const [date, setDate] = useState(reminder?.date ?? today());
  const [hour, setHour] = useState(String(reminder?.hour ?? 8));
  const [minute, setMinute] = useState(String(reminder?.minute ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** Mengganti jenis ikut mengisi judul dan pola ulang yang lazim. */
  const applyKind = (next: ReminderKind) => {
    setKind(next);
    const preset = KINDS.find(k => k.value === next);
    if (!preset) return;
    if (preset.title) setTitle(preset.title);
    setRepeat(preset.repeat);
    setHour(String(preset.hour));
  };

  const submit = async () => {
    const h = Number(hour);
    const m = Number(minute);
    if (!title.trim()) return setError('Judul pengingat wajib diisi.');
    if (!Number.isInteger(h) || h < 0 || h > 23) return setError('Jam harus 0–23.');
    if (!Number.isInteger(m) || m < 0 || m > 59) return setError('Menit harus 0–59.');
    if (repeat === 'once' && !date) return setError('Pilih tanggal untuk pengingat sekali jalan.');

    setError(null);
    setSaving(true);
    try {
      await onSave({
        pet_id: petId,
        title: title.trim(),
        kind,
        repeat_mode: repeat,
        weekday: repeat === 'weekly' ? Number(weekday) : null,
        // Dibatasi 28 agar jadwal tetap terpicu di bulan Februari.
        day: repeat === 'monthly' ? Math.min(28, Math.max(1, Number(day) || 1)) : null,
        date: repeat === 'once' ? date : null,
        hour: h,
        minute: m,
        enabled: 1,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            maxHeight: '92%',
          }}>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Title style={{ fontSize: 17 }}>
                {reminder ? 'Ubah Pengingat' : 'Pengingat Baru'}
              </Title>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </Pressable>
            </Row>

            <ChipGroup
              label="Jenis"
              options={KINDS.map(k => ({ value: k.value, label: k.label }))}
              value={kind}
              onChange={applyKind}
            />

            <Field label="Judul" value={title} onChangeText={setTitle} placeholder="Contoh: Kalsium pagi" />

            <ChipGroup label="Pengulangan" options={REPEATS} value={repeat} onChange={setRepeat} />

            {repeat === 'weekly' ? (
              <ChipGroup
                label="Hari"
                options={WEEKDAYS.map((labelText, index) => ({
                  value: String(index + 1),
                  label: labelText,
                }))}
                value={weekday}
                onChange={setWeekday}
              />
            ) : null}

            {repeat === 'monthly' ? (
              <Field
                label="Tanggal tiap bulan (1–28)"
                value={day}
                onChangeText={setDay}
                keyboardType="numeric"
              />
            ) : null}

            {repeat === 'once' ? (
              <DateField
                label="Tanggal"
                value={date}
                onChange={setDate}
                minimumDate={new Date()}
                helper="Pengingat sekali jalan hanya berbunyi bila tanggalnya belum lewat."
              />
            ) : null}

            <Row style={{ gap: 10, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}>
                <Field label="Jam" value={hour} onChangeText={setHour} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Menit" value={minute} onChangeText={setMinute} keyboardType="numeric" />
              </View>
            </Row>

            {error ? (
              <Body style={{ color: theme.colors.danger, fontSize: 13 }}>{error}</Body>
            ) : null}

            <Button title="Simpan Pengingat" icon="save-outline" onPress={submit} loading={saving} />
            <Button title="Batal" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
