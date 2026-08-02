import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useConfirm } from '../../../src/components/ConfirmDialog';
import { PetForm } from '../../../src/components/PetForm';
import { deletePet, getPet, updatePet, type PetInput } from '../../../src/db/repo';

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = Number(id);
  const db = useSQLiteContext();
  const router = useRouter();
  const confirm = useConfirm();
  const [initial, setInitial] = useState<PetInput | null>(null);

  useEffect(() => {
    void getPet(db, petId).then(pet => {
      if (!pet) return;
      const { id: _id, created_at: _createdAt, ...rest } = pet;
      setInitial(rest);
    });
  }, [db, petId]);

  const confirmDelete = async () => {
    const ok = await confirm({
      title: `Hapus profil ${initial?.name ?? 'ini'}?`,
      message:
        'Seluruh log pertumbuhan, makan, karapas, riwayat sakit, brumasi, dan fotonya akan ikut terhapus permanen. Tindakan ini tidak bisa dibatalkan.',
      confirmLabel: 'Hapus profil',
      destructive: true,
    });
    if (!ok) return;
    await deletePet(db, petId);
    router.dismissAll();
    router.replace('/');
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
