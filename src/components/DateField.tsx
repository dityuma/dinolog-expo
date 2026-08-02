import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { formatDate, parseISODate, toISODate } from '../lib/date';
import { useTheme } from '../theme/ThemeProvider';
import { Body, Button, Label, Row } from './ui';

/**
 * Input tanggal berbasis picker sistem. Nilai tetap disimpan sebagai ISO
 * `YYYY-MM-DD` supaya konsisten dengan skema database.
 */
export function DateField({
  label,
  value,
  onChange,
  helper,
  error,
  clearable,
  minimumDate,
  maximumDate,
  placeholder = 'Pilih tanggal',
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  helper?: string;
  error?: string;
  /** Menampilkan tombol hapus untuk tanggal yang boleh dikosongkan. */
  clearable?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
}) {
  const { theme } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const selected = parseISODate(value) ?? new Date();
  // Draft dipakai agar pilihan di iOS baru tersimpan setelah menekan "Pilih".
  const [draft, setDraft] = useState(selected);

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selected,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toISODate(date));
        },
      });
      return;
    }
    setDraft(selected);
    setIosOpen(true);
  };

  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>

      <Row style={{ gap: 8 }}>
        <Pressable
          onPress={open}
          style={({ pressed }) => [
            styles.control,
            {
              flex: 1,
              backgroundColor: theme.colors.surface,
              borderColor: error ? theme.colors.danger : theme.colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
          <Body style={{ flex: 1, color: value ? theme.colors.text : theme.colors.textMuted }}>
            {value ? formatDate(value) : placeholder}
          </Body>
        </Pressable>

        {clearable && value ? (
          <Pressable
            onPress={() => onChange('')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.control,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Ionicons name="close" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </Row>

      {error ? (
        <Body style={{ fontSize: 12, color: theme.colors.danger }}>{error}</Body>
      ) : helper ? (
        <Body muted style={{ fontSize: 12 }}>
          {helper}
        </Body>
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="fade" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)}>
            <Pressable
              style={[
                styles.sheet,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={event => event.stopPropagation()}>
              <Label>{label}</Label>
              <DateTimePicker
                value={draft}
                mode="date"
                display="inline"
                locale="id-ID"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                themeVariant={theme.dark ? 'dark' : 'light'}
                accentColor={theme.colors.primary}
                onChange={(_event, date) => {
                  if (date) setDraft(date);
                }}
              />
              <Row style={{ gap: 10 }}>
                <Button
                  title="Batal"
                  variant="ghost"
                  style={{ flex: 1 }}
                  onPress={() => setIosOpen(false)}
                />
                <Button
                  title="Pilih"
                  style={{ flex: 1 }}
                  onPress={() => {
                    onChange(toISODate(draft));
                    setIosOpen(false);
                  }}
                />
              </Row>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: { width: '100%', maxWidth: 420, borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
});
