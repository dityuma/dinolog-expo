import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { PetForm } from '../../src/components/PetForm';
import { createPet } from '../../src/db/repo';

export default function NewPetScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  return (
    <PetForm
      submitLabel="Simpan Profil"
      onSubmit={async input => {
        const id = await createPet(db, input);
        router.replace({ pathname: '/pet/[id]', params: { id } });
      }}
    />
  );
}
