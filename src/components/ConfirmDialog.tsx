import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body, Button, Title } from './ui';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Dialog konfirmasi bertema, menggantikan Alert bawaan sistem agar tampilannya
 * ikut tema aktif dan aksi merusak terlihat jelas.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(next => {
    setOptions(next);
    return new Promise<boolean>(resolve => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    setOptions(null);
    resolver.current?.(result);
    resolver.current = null;
  };

  const value = useMemo(() => confirm, [confirm]);
  const tone = options?.destructive ? theme.colors.danger : theme.colors.primary;

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        visible={options !== null}
        transparent
        animationType="fade"
        onRequestClose={() => close(false)}>
        <Pressable style={styles.backdrop} onPress={() => close(false)}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            onPress={event => event.stopPropagation()}>
            <View style={[styles.iconWrap, { backgroundColor: tone + '1F' }]}>
              <Ionicons
                name={options?.icon ?? (options?.destructive ? 'trash-outline' : 'help-circle-outline')}
                size={24}
                color={tone}
              />
            </View>

            <Title style={{ fontSize: 17, textAlign: 'center' }}>{options?.title}</Title>
            {options?.message ? (
              <Body muted style={{ textAlign: 'center', fontSize: 14 }}>
                {options.message}
              </Body>
            ) : null}

            <View style={{ gap: 8, marginTop: 4 }}>
              <Button
                title={options?.confirmLabel ?? 'Lanjutkan'}
                variant={options?.destructive ? 'danger' : 'primary'}
                onPress={() => close(true)}
              />
              <Button
                title={options?.cancelLabel ?? 'Batal'}
                variant="ghost"
                onPress={() => close(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm harus dipakai di dalam ConfirmProvider');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    alignItems: 'stretch',
  },
  iconWrap: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
