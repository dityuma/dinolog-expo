import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Badge, Body, Card, EmptyState, Label, Row, Screen, Thumb, Title } from '../../../src/components/ui';
import { getPet } from '../../../src/db/repo';
import { LOG_TABLES, type PhotoOwnerType } from '../../../src/db/types';
import { useDbQuery } from '../../../src/hooks/useDbQuery';
import { daysBetween, formatDate } from '../../../src/lib/date';
import { TABS } from '../../../src/logs/meta';
import { useTheme } from '../../../src/theme/ThemeProvider';

type ComparablePhoto = {
  uri: string;
  date: string;
  ownerType: PhotoOwnerType;
  caption: string;
};

/** Kumpulkan seluruh foto milik satu hewan beserta tanggal log asalnya. */
async function loadPhotos(db: SQLiteDatabase, petId: number): Promise<ComparablePhoto[]> {
  const pet = await getPet(db, petId);
  const collected: ComparablePhoto[] = [];

  if (pet?.photo_uri) {
    collected.push({
      uri: pet.photo_uri,
      date: pet.created_at ? new Date(pet.created_at).toISOString().slice(0, 10) : '',
      ownerType: 'growth',
      caption: 'Foto profil',
    });
  }

  for (const tab of TABS) {
    const dateColumn = tab.key === 'health' || tab.key === 'brumation' ? 'start_date' : 'date';
    const rows = await db.getAllAsync<{ uri: string; date: string }>(
      `SELECT p.uri AS uri, l.${dateColumn} AS date
       FROM photos p
       JOIN ${LOG_TABLES[tab.key]} l ON l.id = p.owner_id
       WHERE p.owner_type = ? AND l.pet_id = ?
       ORDER BY l.${dateColumn} DESC, p.id DESC`,
      tab.key,
      petId
    );
    collected.push(
      ...rows.map(row => ({
        uri: row.uri,
        date: row.date,
        ownerType: tab.key,
        caption: tab.label,
      }))
    );
  }

  // Terbaru lebih dulu supaya "sesudah" biasanya ada di urutan awal.
  return collected.sort((a, b) => b.date.localeCompare(a.date));
}

export default function ComparePhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = Number(id);
  const { theme } = useTheme();
  const { data, loading } = useDbQuery(db => loadPhotos(db, petId), [petId]);
  const photos = data ?? [];

  const [left, setLeft] = useState<ComparablePhoto | null>(null);
  const [right, setRight] = useState<ComparablePhoto | null>(null);
  /** Sisi yang akan terisi oleh pilihan berikutnya. */
  const [target, setTarget] = useState<'left' | 'right'>('left');

  const pick = (photo: ComparablePhoto) => {
    if (target === 'left') {
      setLeft(photo);
      setTarget('right');
    } else {
      setRight(photo);
      setTarget('left');
    }
  };

  const gap =
    left && right && left.date && right.date ? daysBetween(
      left.date < right.date ? left.date : right.date,
      left.date < right.date ? right.date : left.date
    ) : null;

  if (!loading && photos.length < 2) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Bandingkan Foto' }} />
        <EmptyState
          icon="git-compare-outline"
          title="Butuh minimal dua foto"
          subtitle="Tambahkan foto pada log pertumbuhan atau karapas dari dua waktu berbeda untuk membandingkan perkembangannya."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Bandingkan Foto' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>
        <Row style={{ gap: 10, alignItems: 'stretch' }}>
          <Pane
            photo={left}
            side="left"
            active={target === 'left'}
            onFocus={() => setTarget('left')}
            onClear={() => setLeft(null)}
          />
          <Pane
            photo={right}
            side="right"
            active={target === 'right'}
            onFocus={() => setTarget('right')}
            onClear={() => setRight(null)}
          />
        </Row>

        {gap != null && gap > 0 ? (
          <Row style={{ justifyContent: 'center' }}>
            <Badge tone="primary" text={`Selisih ${gap} hari`} />
          </Row>
        ) : null}

        <Card>
          <Label>
            Pilih foto untuk sisi {target === 'left' ? 'kiri' : 'kanan'}
          </Label>
          <Body muted style={{ fontSize: 12 }}>
            Ketuk foto di bawah. Sisi tujuan berpindah otomatis setelah memilih.
          </Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            {photos.map(photo => {
              const selected = photo.uri === left?.uri || photo.uri === right?.uri;
              return (
                <Pressable key={photo.uri} onPress={() => pick(photo)} style={{ width: 84, gap: 4 }}>
                  <View
                    style={{
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: selected ? theme.colors.primary : 'transparent',
                      padding: 2,
                    }}>
                    <Thumb uri={photo.uri} size={76} />
                  </View>
                  <Body muted style={{ fontSize: 10 }} numberOfLines={1}>
                    {photo.date ? formatDate(photo.date) : photo.caption}
                  </Body>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Pane({
  photo,
  side,
  active,
  onFocus,
  onClear,
}: {
  photo: ComparablePhoto | null;
  side: 'left' | 'right';
  active: boolean;
  onFocus: () => void;
  onClear: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onFocus} style={{ flex: 1, gap: 6 }}>
      <View
        style={{
          aspectRatio: 3 / 4,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: active ? theme.colors.primary : theme.colors.border,
          backgroundColor: theme.colors.surfaceAlt,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {photo ? (
          <Image
            source={{ uri: photo.uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={{ alignItems: 'center', gap: 6, padding: 12 }}>
            <Ionicons name="image-outline" size={26} color={theme.colors.textMuted} />
            <Body muted style={{ fontSize: 12, textAlign: 'center' }}>
              {side === 'left' ? 'Sebelum' : 'Sesudah'}
            </Body>
          </View>
        )}
      </View>

      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Title style={{ fontSize: 13 }} numberOfLines={1}>
            {photo ? (photo.date ? formatDate(photo.date) : photo.caption) : '—'}
          </Title>
          {photo ? (
            <Body muted style={{ fontSize: 11 }} numberOfLines={1}>
              {photo.caption}
            </Body>
          ) : null}
        </View>
        {photo ? (
          <Pressable onPress={onClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </Row>
    </Pressable>
  );
}
