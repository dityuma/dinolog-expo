import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { GrowthChart } from '../../../src/components/GrowthChart';
import {
  Badge,
  Body,
  Button,
  Card,
  EmptyState,
  Label,
  Row,
  Screen,
  Thumb,
  Title,
} from '../../../src/components/ui';
import { getPet, listPhotos, logs } from '../../../src/db/repo';
import type {
  BrumationLog,
  FeedingLog,
  GrowthLog,
  HealthLog,
  Pet,
  Photo,
  ShellLog,
} from '../../../src/db/types';
import { useDbQuery } from '../../../src/hooks/useDbQuery';
import { daysBetween, formatAge, formatDate } from '../../../src/lib/date';
import { SHELL_CONDITIONS, TABS, shellCondition, type TabKey } from '../../../src/logs/meta';
import { useTheme } from '../../../src/theme/ThemeProvider';

type Entry = { row: Record<string, unknown>; photos: Photo[] };

type PetData = {
  pet: Pet | null;
  entries: Record<TabKey, Entry[]>;
};

async function loadPetData(db: SQLiteDatabase, petId: number): Promise<PetData> {
  const pet = await getPet(db, petId);
  const entries = {} as Record<TabKey, Entry[]>;
  for (const tab of TABS) {
    const rows = await logs.list<Record<string, unknown>>(db, tab.key, petId);
    entries[tab.key] = await Promise.all(
      rows.map(async row => ({ row, photos: await listPhotos(db, tab.key, row.id as number) }))
    );
  }
  return { pet, entries };
}

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = Number(id);
  const { theme } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('growth');

  const { data, loading } = useDbQuery(db => loadPetData(db, petId), [petId]);

  if (!data?.pet) {
    return (
      <Screen>
        {loading ? null : <EmptyState icon="alert-circle-outline" title="Profil tidak ditemukan" />}
      </Screen>
    );
  }

  const { pet, entries } = data;
  const current = entries[tab];

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: pet.name,
          headerRight: () => (
            <Pressable
              hitSlop={10}
              onPress={() => router.push({ pathname: '/pet/[id]/edit', params: { id: petId } })}>
              <Ionicons name="create-outline" size={22} color={theme.colors.text} />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 14 }}>
        <ProfileCard pet={pet} />

        <View style={{ gap: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {TABS.map(item => {
              const active = item.key === tab;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setTab(item.key)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 999,
                    borderWidth: 1,
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  }}>
                  <Ionicons
                    name={item.icon}
                    size={15}
                    color={active ? theme.colors.onPrimary : theme.colors.textMuted}
                  />
                  <Body
                    style={{
                      color: active ? theme.colors.onPrimary : theme.colors.text,
                      fontWeight: active ? '700' : '500',
                      fontSize: 13,
                    }}>
                    {item.label}
                  </Body>
                  {entries[item.key].length ? (
                    <Body
                      style={{
                        fontSize: 11,
                        color: active ? theme.colors.onPrimary : theme.colors.textMuted,
                      }}>
                      {entries[item.key].length}
                    </Body>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {tab === 'growth' && current.length > 0 ? (
          <Card>
            <Label>Tren pertumbuhan</Label>
            <GrowthChart data={current.map(e => e.row as unknown as GrowthLog)} />
          </Card>
        ) : null}

        {tab === 'shell' ? <ShellWarnings entries={current} /> : null}

        {current.length === 0 ? (
          <EmptyState
            icon={TABS.find(t => t.key === tab)!.icon}
            title="Belum ada catatan"
            subtitle="Ketuk tombol di bawah untuk menambahkan entri pertama pada kategori ini."
          />
        ) : (
          current.map(entry => (
            <LogCard
              key={String(entry.row.id)}
              tab={tab}
              entry={entry}
              onPress={() =>
                router.push({
                  pathname: '/pet/[id]/log/[type]',
                  params: { id: petId, type: tab, logId: String(entry.row.id) },
                })
              }
            />
          ))
        )}
      </ScrollView>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 24 }}>
        <Button
          title={`Tambah ${TABS.find(t => t.key === tab)!.label}`}
          icon="add"
          onPress={() =>
            router.push({ pathname: '/pet/[id]/log/[type]', params: { id: petId, type: tab } })
          }
        />
      </View>
    </Screen>
  );
}

function ProfileCard({ pet }: { pet: Pet }) {
  const { theme } = useTheme();
  const genderLabel = { male: 'Jantan', female: 'Betina', unknown: 'Belum diketahui' }[pet.gender];

  return (
    <Card>
      <Row style={{ gap: 14 }}>
        {pet.photo_uri ? (
          <Thumb uri={pet.photo_uri} size={88} />
        ) : (
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 10,
              backgroundColor: theme.colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="paw" size={32} color={theme.colors.textMuted} />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Title>{pet.name}</Title>
          <Body muted>{pet.species || 'Spesies belum diisi'}</Body>
          <Row style={{ flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            <Badge text={genderLabel} />
            <Badge tone="primary" text={formatAge(pet.birth_date)} />
          </Row>
        </View>
      </Row>

      <View style={{ gap: 2, marginTop: 4 }}>
        <Body muted style={{ fontSize: 12 }}>
          Lahir: {formatDate(pet.birth_date)} · Adopsi: {formatDate(pet.adoption_date)}
        </Body>
        {pet.note ? <Body style={{ marginTop: 6 }}>{pet.note}</Body> : null}
      </View>
    </Card>
  );
}

/** Kartu edukasi yang muncul saat ada kondisi karapas kritis tercatat. */
function ShellWarnings({ entries }: { entries: Entry[] }) {
  const { theme } = useTheme();
  const active = SHELL_CONDITIONS.filter(
    condition => condition.critical && entries.some(e => e.row.condition === condition.value)
  );
  if (!active.length) return null;

  return (
    <View style={{ gap: 10 }}>
      {active.map(condition => (
        <Card
          key={condition.value}
          style={{ borderColor: theme.colors.warning, backgroundColor: theme.colors.warning + '14' }}>
          <Row>
            <Ionicons name="warning-outline" size={18} color={theme.colors.warning} />
            <Title style={{ fontSize: 15, color: theme.colors.warning }}>{condition.label}</Title>
          </Row>
          <Body style={{ fontSize: 13 }}>{condition.warning}</Body>
        </Card>
      ))}
    </View>
  );
}

function LogCard({ tab, entry, onPress }: { tab: TabKey; entry: Entry; onPress: () => void }) {
  const { theme } = useTheme();
  const router = useRouter();
  const row = entry.row;

  const header = () => {
    switch (tab) {
      case 'growth': {
        const g = row as unknown as GrowthLog;
        return {
          title: [
            g.weight_g != null ? `${g.weight_g} g` : null,
            g.length_cm != null ? `${g.length_cm} cm` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Tanpa ukuran',
          subtitle: formatDate(g.date),
          badges: [] as { text: string; tone?: 'danger' | 'warning' | 'success' | 'primary' }[],
        };
      }
      case 'feeding': {
        const f = row as unknown as FeedingLog;
        return {
          title: f.food_type || 'Pakan',
          subtitle: [formatDate(f.date), f.amount, f.frequency].filter(Boolean).join(' · '),
          badges: [],
        };
      }
      case 'shell': {
        const s = row as unknown as ShellLog;
        const meta = shellCondition(s.condition);
        return {
          title: meta.label,
          subtitle: formatDate(s.date),
          badges: [
            { text: s.severity, tone: meta.critical ? ('warning' as const) : ('success' as const) },
          ],
        };
      }
      case 'health': {
        const h = row as unknown as HealthLog;
        const days = daysBetween(h.start_date, h.end_date);
        return {
          title: h.title || 'Riwayat sakit',
          subtitle: `${formatDate(h.start_date)} → ${h.ongoing ? 'sekarang' : formatDate(h.end_date)}${
            days != null ? ` · ${days} hari` : ''
          }`,
          badges: h.ongoing
            ? [{ text: 'Berlangsung', tone: 'danger' as const }]
            : [{ text: 'Selesai', tone: 'success' as const }],
        };
      }
      case 'brumation': {
        const b = row as unknown as BrumationLog;
        const days = daysBetween(b.start_date, b.end_date);
        const delta =
          b.weight_before != null && b.weight_after != null
            ? Math.round((b.weight_after - b.weight_before) * 10) / 10
            : null;
        const lossPercent =
          delta != null && b.weight_before ? (delta / b.weight_before) * 100 : null;
        const badges: { text: string; tone?: 'danger' | 'warning' | 'success' | 'primary' }[] = [];
        if (!b.end_date) badges.push({ text: 'Sedang brumasi', tone: 'warning' });
        if (delta != null) {
          badges.push({
            text: `${delta > 0 ? '+' : ''}${delta} g${
              lossPercent != null ? ` (${lossPercent.toFixed(1)}%)` : ''
            }`,
            // Penurunan >10% dari berat awal adalah tanda bahaya saat brumasi.
            tone: lossPercent != null && lossPercent <= -10 ? 'danger' : 'primary',
          });
        }
        return {
          title: `Brumasi ${days != null ? `${days} hari` : ''}`.trim(),
          subtitle: `${formatDate(b.start_date)} → ${b.end_date ? formatDate(b.end_date) : 'berjalan'}`,
          badges,
        };
      }
    }
  };

  const info = header();

  return (
    <Card onPress={onPress}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Title style={{ fontSize: 16 }}>{info.title}</Title>
          <Body muted style={{ fontSize: 13 }}>
            {info.subtitle}
          </Body>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </Row>

      {info.badges.length ? (
        <Row style={{ flexWrap: 'wrap', gap: 6 }}>
          {info.badges.map(badge => (
            <Badge key={badge.text} text={badge.text} tone={badge.tone ?? 'neutral'} />
          ))}
        </Row>
      ) : null}

      {typeof row.note === 'string' && row.note ? (
        <Body numberOfLines={3} style={{ fontSize: 13 }}>
          {row.note}
        </Body>
      ) : null}

      {entry.photos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {entry.photos.map((photo, index) => (
            <Pressable
              key={photo.id}
              onPress={() =>
                router.push({
                  pathname: '/viewer',
                  params: { uris: entry.photos.map(p => p.uri).join('|'), index: String(index) },
                })
              }>
              <Thumb uri={photo.uri} size={72} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </Card>
  );
}
