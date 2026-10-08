/** 온보딩 0 — 스플래시/시작 화면 (그린 배경 + 흰 로고) */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';

export default function Welcome() {
  const { completeOnboarding } = useStore();
  return (
    <View style={styles.wrap}>
      <View style={styles.center}>
        <View style={styles.logo}>
          <Ionicons name="wallet" size={46} color={colors.brand} />
        </View>
        <T size={30} weight="800" color="#fff" style={{ marginTop: 22 }}>
          텅장관리
        </T>
        <T size={14} weight="700" color="rgba(255,255,255,0.8)" style={{ marginTop: 2, letterSpacing: 1 }}>
          flex-able
        </T>
        <T size={18} weight="600" color="#fff" style={{ marginTop: 34, textAlign: 'center', lineHeight: 27 }}>
          월세, 카드값, 주말 약속까지 다 빼고{'\n'}
          <T size={18} weight="800" color="#fff">
            그래서 오늘 얼마 써도 돼?
          </T>
        </T>
      </View>

      <View style={styles.bottom}>
        <Pressable style={styles.start} onPress={() => router.push('/onboarding/account')}>
          <T size={16} weight="800" color={colors.brandDark}>
            시작하기
          </T>
        </Pressable>
        <Pressable
          style={{ padding: 14, alignItems: 'center' }}
          onPress={() => {
            completeOnboarding();
            router.replace('/');
          }}
        >
          <T size={14} weight="600" color="rgba(255,255,255,0.9)">
            체험 데이터로 둘러보기
          </T>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.brand, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { width: 92, height: 92, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  bottom: { padding: 20, paddingBottom: 28 },
  start: { height: 56, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
