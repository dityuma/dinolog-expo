import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConfirmProvider } from '../src/components/ConfirmDialog';
import { DATABASE_NAME, migrateDbIfNeeded } from '../src/db/schema';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';

function Fallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function Navigator() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}>
        <Stack.Screen name="index" options={{ title: 'DinoLog' }} />
        <Stack.Screen name="settings" options={{ title: 'Pengaturan' }} />
        <Stack.Screen name="pet/new" options={{ title: 'Profil Baru', presentation: 'modal' }} />
        <Stack.Screen name="pet/[id]/index" options={{ title: 'Profil' }} />
        <Stack.Screen name="pet/[id]/edit" options={{ title: 'Ubah Profil', presentation: 'modal' }} />
        <Stack.Screen name="pet/[id]/log/[type]" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="viewer"
          options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Suspense fallback={<Fallback />}>
            <SQLiteProvider
              databaseName={DATABASE_NAME}
              onInit={migrateDbIfNeeded}
              options={{ enableChangeListener: true }}
              useSuspense>
              <ConfirmProvider>
                <Navigator />
              </ConfirmProvider>
            </SQLiteProvider>
          </Suspense>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
