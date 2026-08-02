import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { MAX_PHOTOS_PER_LOG } from '../db/types';
import { captureImage, deleteImage, pickImagesFromLibrary } from '../lib/media';
import { useTheme } from '../theme/ThemeProvider';
import { Body, Label, Row, Thumb } from './ui';

/**
 * Grid pemilih foto. Foto yang dibatalkan sebelum form disimpan langsung
 * dihapus dari storage agar tidak menumpuk jadi file yatim.
 */
export function PhotoPicker({
  uris,
  onChange,
  max = MAX_PHOTOS_PER_LOG,
  label = 'Foto dokumentasi',
}: {
  uris: string[];
  onChange: (uris: string[]) => void;
  max?: number;
  label?: string;
}) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);
  const remaining = max - uris.length;
  // Foto yang sudah tersimpan di database tidak boleh dihapus dari disk di sini —
  // penghapusannya baru terjadi saat form disimpan, agar batal-edit tidak merusak data.
  const savedUris = useRef(new Set(uris));

  const run = async (task: () => Promise<string[]>) => {
    if (busy) return;
    setBusy(true);
    try {
      const added = await task();
      if (added.length) onChange([...uris, ...added].slice(0, max));
    } catch (error) {
      Alert.alert('Gagal menambah foto', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = (uri: string) => {
    Alert.alert('Hapus foto?', 'Foto ini akan dilepas dari catatan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          onChange(uris.filter(u => u !== uri));
          if (!savedUris.current.has(uri)) deleteImage(uri);
        },
      },
    ]);
  };

  return (
    <View style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label>{label}</Label>
        <Body muted style={{ fontSize: 12 }}>
          {uris.length}/{max}
        </Body>
      </Row>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {uris.map(uri => (
          <View key={uri}>
            <Thumb uri={uri} size={84} />
            <Pressable
              onPress={() => remove(uri)}
              hitSlop={8}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                backgroundColor: theme.colors.danger,
                borderRadius: 999,
                padding: 3,
              }}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}

        {remaining > 0 ? (
          <>
            <AddTile
              icon="images-outline"
              caption="Galeri"
              disabled={busy}
              onPress={() => run(() => pickImagesFromLibrary({ remaining }))}
            />
            <AddTile
              icon="camera-outline"
              caption="Kamera"
              disabled={busy}
              onPress={() => run(async () => {
                const uri = await captureImage();
                return uri ? [uri] : [];
              })}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function AddTile({
  icon,
  caption,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  caption: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        width: 84,
        height: 84,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        opacity: pressed || disabled ? 0.6 : 1,
      })}>
      <Ionicons name={icon} size={22} color={theme.colors.primary} />
      <Body muted style={{ fontSize: 11 }}>
        {caption}
      </Body>
    </Pressable>
  );
}
