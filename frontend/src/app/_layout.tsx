import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/Toast';
import { AppStoreProvider } from '@/store/AppStore';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <View style={styles.outer}>
          <SafeAreaView style={styles.phone} edges={['top']}>
            <StatusBar style="dark" />
            {/* (tabs): 상단 네비 4탭 / 그 외: 뒤로가기 헤더를 가진 상세 화면 / onboarding: 최초 설정 */}
            <ToastProvider>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
            </ToastProvider>
          </SafeAreaView>
        </View>
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#DCE1EA' : '#fff', alignItems: 'center' },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#fff',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 24px rgba(16,24,40,0.08)' } as object) : {}),
  },
});
