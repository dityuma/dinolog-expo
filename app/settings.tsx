import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { useConfirm } from '../src/components/ConfirmDialog';
import { Body, Button, Card, Label, Row, Screen, Title } from '../src/components/ui';
import { exportBackup, importBackup } from '../src/lib/backup';
import { THEMES } from '../src/theme/themes';
import { useTheme } from '../src/theme/ThemeProvider';

export default function SettingsScreen() {
  const { theme, themeId, setThemeId } = useTheme();
  const db = useSQLiteContext();
  const router = useRouter();
  const confirm = useConfirm();
  const [includePhotos, setIncludePhotos] = useState(true);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const doExport = async () => {
    setBusy('export');
    try {
      await exportBackup(db, includePhotos);
    } catch (error) {
      Alert.alert('Ekspor gagal', (error as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    const ok = await confirm({
      title: 'Ganti semua data dengan backup?',
      message:
        'Seluruh profil dan catatan yang ada di aplikasi ini akan dihapus lalu diganti dengan isi file backup. Ekspor dulu bila Anda belum punya salinannya.',
      confirmLabel: 'Pilih file backup',
      destructive: true,
      icon: 'cloud-upload-outline',
    });
    if (!ok) return;

    setBusy('import');
    try {
      const result = await importBackup(db);
      if (result) {
        Alert.alert(
          'Impor selesai',
          `${result.pets} profil, ${result.logs} catatan, ${result.photos} foto, dan ${result.reminders} pengingat dipulihkan.`,
          [{ text: 'OK', onPress: () => router.replace('/') }]
        );
      }
    } catch (error) {
      Alert.alert('Impor gagal', (error as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <Card>
          <Label>Tema kura-kura</Label>
          <Body muted style={{ fontSize: 13 }}>
            Pilih palet warna aplikasi. Pilihan tersimpan otomatis di perangkat.
          </Body>
          <View style={{ gap: 8, marginTop: 4 }}>
            {THEMES.map(item => {
              const active = item.id === themeId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setThemeId(item.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active ? theme.colors.primaryContainer : theme.colors.surfaceAlt,
                  }}>
                  <View style={{ flexDirection: 'row' }}>
                    {[item.colors.primary, item.colors.accent, item.colors.background].map(
                      (color, index) => (
                        <View
                          key={color + index}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: color,
                            borderWidth: 1,
                            borderColor: '#00000022',
                            marginLeft: index === 0 ? 0 : -6,
                          }}
                        />
                      )
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Title style={{ fontSize: 15 }}>{item.label}</Title>
                    <Body muted style={{ fontSize: 12 }}>
                      {item.description}
                    </Body>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <Label>Backup & pemulihan</Label>
          <Body muted style={{ fontSize: 13 }}>
            Data diekspor sebagai satu file JSON. Simpan ke folder Downloads, Files, atau layanan pilihan
            Anda lewat dialog berbagi.
          </Body>
          <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Body style={{ fontSize: 14 }}>Sertakan foto</Body>
              <Body muted style={{ fontSize: 12 }}>
                Ukuran file jauh lebih besar, tetapi backup jadi lengkap.
              </Body>
            </View>
            <Switch
              value={includePhotos}
              onValueChange={setIncludePhotos}
              trackColor={{ true: theme.colors.primary }}
            />
          </Row>
          <Button
            title="Ekspor data"
            icon="download-outline"
            onPress={doExport}
            loading={busy === 'export'}
          />
          <Button
            title="Impor data"
            variant="secondary"
            icon="cloud-upload-outline"
            onPress={doImport}
            loading={busy === 'import'}
          />
        </Card>

        <Card>
          <Label>Tentang</Label>
          <Title style={{ fontSize: 16 }}>DinoLog</Title>
          <Body muted style={{ fontSize: 13 }}>
            Buku catatan offline untuk kura-kura dan reptil peliharaan. Tanpa akun, tanpa sinkronisasi
            cloud — seluruh data dan foto hanya tersimpan di perangkat ini.
          </Body>
        </Card>
      </ScrollView>
    </Screen>
  );
}
