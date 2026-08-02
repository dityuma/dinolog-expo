import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Reminder } from '../db/types';
import { parseISODate } from './date';

export const ANDROID_CHANNEL_ID = 'dinolog-reminders';

/** Notifikasi tetap tampil sebagai banner walau aplikasi sedang dibuka. */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Channel harus ada sebelum notifikasi apa pun dijadwalkan di Android. */
export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Pengingat perawatan',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function ensureNotificationSetup(): Promise<boolean> {
  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return requested.granted;
}

function buildTrigger(reminder: Reminder): Notifications.NotificationTriggerInput | null {
  const { hour, minute } = reminder;
  switch (reminder.repeat_mode) {
    case 'daily':
      return {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: ANDROID_CHANNEL_ID,
        hour,
        minute,
      };
    case 'weekly':
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        channelId: ANDROID_CHANNEL_ID,
        weekday: reminder.weekday ?? 1,
        hour,
        minute,
      };
    case 'monthly':
      return {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        channelId: ANDROID_CHANNEL_ID,
        day: reminder.day ?? 1,
        hour,
        minute,
      };
    case 'once': {
      const date = reminder.date ? parseISODate(reminder.date) : null;
      if (!date) return null;
      date.setHours(hour, minute, 0, 0);
      // Jadwal yang sudah lewat tidak akan pernah berbunyi, jadi tidak dipasang.
      if (date.getTime() <= Date.now()) return null;
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        channelId: ANDROID_CHANNEL_ID,
        date,
      };
    }
  }
}

const KIND_BODY: Record<string, string> = {
  suplemen: 'Waktunya memberi suplemen.',
  uvb: 'Cek atau ganti lampu UVB — output UV turun jauh sebelum lampunya mati.',
  vet: 'Jadwal kunjungan dokter hewan.',
  rendam: 'Waktunya merendam (soaking).',
  lainnya: 'Pengingat perawatan.',
};

/** Jadwalkan satu pengingat, kembalikan identifier notifikasinya. */
export async function scheduleReminder(
  reminder: Reminder,
  petName: string
): Promise<string | null> {
  if (!reminder.enabled) return null;
  const trigger = buildTrigger(reminder);
  if (!trigger) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${reminder.title} · ${petName}`,
      body: KIND_BODY[reminder.kind] ?? KIND_BODY.lainnya,
      data: { reminderId: reminder.id, petId: reminder.pet_id },
    },
    trigger,
  });
}

export async function cancelReminder(notificationId: string | null | undefined) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Notifikasi mungkin sudah tidak terdaftar — abaikan.
  }
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Pengingat sekali jalan yang tanggalnya sudah lewat tidak akan berbunyi lagi. */
export function isReminderExpired(reminder: Reminder): boolean {
  if (reminder.repeat_mode !== 'once' || !reminder.date) return false;
  const date = parseISODate(reminder.date);
  if (!date) return false;
  date.setHours(reminder.hour, reminder.minute, 0, 0);
  return date.getTime() <= Date.now();
}

export function describeSchedule(reminder: Reminder): string {
  const time = `${String(reminder.hour).padStart(2, '0')}.${String(reminder.minute).padStart(2, '0')}`;
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  switch (reminder.repeat_mode) {
    case 'daily':
      return `Setiap hari, ${time}`;
    case 'weekly':
      return `Setiap ${days[(reminder.weekday ?? 1) - 1]}, ${time}`;
    case 'monthly':
      return `Tanggal ${reminder.day ?? 1} tiap bulan, ${time}`;
    case 'once':
      return reminder.date ? `Sekali pada ${reminder.date}, ${time}` : `Sekali, ${time}`;
  }
}
