import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { PetForm } from '../../../src/components/PetForm';
import { deletePet, getPet, updatePet, type PetInput } from '../../../src/db/repo';

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = Number(id);
  const db = useSQLiteContext();
  const router = useRouter();
  const [initial, setInitial] = useState<PetInput | null>(null);

  useEffect(() => {
    void getPet(db, petId).then(pet => {
      if (!pet) return;
      const { id: _id, created_at: _createdAt, ...rest } = pet;
      setInitial(rest);
    });
  }, [db, petId]);

  const confirmDelete = () => {
    Alert.alert(
      'Hapus profil?',
      'Seluruh log pertumbuhan, makan, karapas, riwayat sakit, brumasi, dan foto milik hewan ini akan ikut terhapus permanen.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deletePet(db, petId);
            router.dismissAll();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (!initial) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <PetForm
      initial={initial}
      submitLabel="Simpan Perubahan"
      onDelete={confirmDelete}
      onSubmit={async input => {
        await updatePet(db, petId, input);
        router.back();
      }}
    />
  );
}
