import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, useRouter } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { FlatList, Pressable, View } from 'react-native';
import { listPets, petSummary } from '../src/db/repo';
import type { Pet } from '../src/db/types';
import { Badge, Body, Button, Card, EmptyState, Row, Screen, Thumb, Title } from '../src/components/ui';
import { useDbQuery } from '../src/hooks/useDbQuery';
import { formatAge } from '../src/lib/date';
import { useTheme } from '../src/theme/ThemeProvider';

type PetCard = Pet & Awaited<ReturnType<typeof petSummary>>;

async function loadPets(db: SQLiteDatabase): Promise<PetCard[]> {
  const pets = await listPets(db);
  return Promise.all(
    pets.map(async pet => ({ ...pet, ...(await petSummary(db, pet.id)) }))
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data, loading } = useDbQuery(loadPets);
  const pets = data ?? [];

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable hitSlop={10}>
                <Ionicons name="settings-outline" size={22} color={theme.colors.text} />
              </Pressable>
            </Link>
          ),
        }}
      />

      <FlatList
        data={pets}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 12 }}
        ListHeaderComponent={
          pets.length ? (
            <Body muted>
              {pets.length} profil tercatat · seluruh data tersimpan offline di perangkat ini
            </Body>
          ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="paw-outline"
              title="Belum ada profil"
              subtitle="Tambahkan kura-kura atau reptil pertama Anda untuk mulai mencatat pertumbuhan, makan, dan kesehatannya."
            />
          )
        }
        renderItem={({ item }) => (
          <PetRow
            pet={item}
            onPress={() => router.push({ pathname: '/pet/[id]', params: { id: item.id } })}
          />
        )}
      />

      <View style={{ position: 'absolute', right: 16, bottom: 24, left: 16 }}>
        <Button title="Tambah Profil" icon="add" onPress={() => router.push('/pet/new')} />
      </View>
    </Screen>
  );
}

function PetRow({ pet, onPress }: { pet: PetCard; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Card onPress={onPress}>
      <Row style={{ gap: 14 }}>
        {pet.photo_uri ? (
          <Thumb uri={pet.photo_uri} size={72} />
        ) : (
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 10,
              backgroundColor: theme.colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="paw" size={28} color={theme.colors.textMuted} />
          </View>
        )}

        <View style={{ flex: 1, gap: 4 }}>
          <Title numberOfLines={1}>{pet.name}</Title>
          <Body muted numberOfLines={1}>
            {pet.species || 'Spesies belum diisi'}
          </Body>
          <Body muted style={{ fontSize: 12 }}>
            {formatAge(pet.birth_date)}
          </Body>

          <Row style={{ flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {pet.latestWeight != null ? <Badge tone="primary" text={`${pet.latestWeight} g`} /> : null}
            {pet.latestLength != null ? <Badge tone="primary" text={`${pet.latestLength} cm`} /> : null}
            {pet.ongoingIllness > 0 ? (
              <Badge tone="danger" text={`${pet.ongoingIllness} sakit berlangsung`} />
            ) : null}
            {pet.isBrumating ? <Badge tone="warning" text="Brumasi" /> : null}
          </Row>
        </View>

        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </Row>
    </Card>
  );
}
