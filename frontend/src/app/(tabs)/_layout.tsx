import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { onboarded } = useStore();
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      {/* 탭 이동은 상단 AppHeader 네비바가 담당 — 기본 탭바는 숨김 */}
      <Tabs
        tabBar={() => null}
        backBehavior="history"
        // 하단 탭바를 쓰지 않으므로 하단 안전영역(아이폰 홈바) 여백도 만들지 않는다
        safeAreaInsets={{ bottom: 0 }}
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' }, sceneStyle: { backgroundColor: colors.bg } }}
      />
    </View>
  );
}
