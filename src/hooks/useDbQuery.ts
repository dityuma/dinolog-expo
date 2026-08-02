import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';

/**
 * Menjalankan query saat layar mendapat fokus, sehingga data selalu segar
 * setelah pengguna kembali dari form tambah/ubah.
 */
export function useDbQuery<T>(run: (db: SQLiteDatabase) => Promise<T>, deps: unknown[] = []) {
  const db = useSQLiteContext();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const runner = useCallback(run, deps);

  const reload = useCallback(async () => {
    try {
      const result = await runner(db);
      setData(result);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [db, runner]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const result = await runner(db).catch(e => {
          if (active) setError(e as Error);
          return null;
        });
        if (active && result !== null) {
          setData(result);
          setError(null);
        }
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [db, runner])
  );

  return { data, loading, error, reload, db };
}
