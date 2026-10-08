import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppStoreProvider } from '@/store/AppStore';
import { colors } from '@/theme';

/** 웹에서는 Pretendard 폰트를 CDN으로 로드하고, 데스크톱 화면에서도 모바일 폭으로 보이게 한다. */
function useWebSetup() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'pretendard-font';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
      document.head.appendChild(link);
    }
    document.title = 'Flex-able 텅장관리';
  }, []);
}

export default function RootLayout() {
  useWebSetup();
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <View style={styles.outer}>
          <SafeAreaView style={styles.phone} edges={['top']}>
            <StatusBar style="dark" />
            {/* (tabs): 상단 네비 4탭 / 그 외: 뒤로가기 헤더를 가진 상세 화면 / onboarding: 최초 설정 */}
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
          </SafeAreaView>
        </View>
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#DDE2E7' : '#fff', alignItems: 'center' },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#fff',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 24px rgba(16,24,40,0.08)' } as object) : {}),
  },
});
