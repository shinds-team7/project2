import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';
import { T } from './ui';

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Ionicons name="wallet" size={size * 0.56} color="#fff" />
    </View>
  );
}

const TABS = [
  { href: '/', label: '홈', match: (p: string) => p === '/' },
  { href: '/plan', label: '지출계획', match: (p: string) => p.startsWith('/plan') },
  { href: '/analysis', label: '분석', match: (p: string) => p.startsWith('/analysis') || p.startsWith('/transactions') },
  { href: '/my', label: '마이', match: (p: string) => p.startsWith('/my') },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Pressable style={styles.brand} onPress={() => router.navigate('/')}>
          <Logo />
          <T size={18} weight="800">
            텅장관리
          </T>
          <T size={12} weight="700" color={colors.brand} style={{ marginTop: 2 }}>
            flex-able
          </T>
        </Pressable>
        <View style={styles.actions}>
          <Ionicons name="notifications-outline" size={22} color={colors.textSub} />
        </View>
      </View>
      <View style={styles.nav}>
        {TABS.map((t) => {
          const on = t.match(pathname);
          return (
            <Pressable key={t.href} style={styles.tab} onPress={() => router.navigate(t.href)}>
              <T size={15} weight={on ? '700' : '500'} color={on ? colors.text : colors.textMuted}>
                {t.label}
              </T>
              <View style={[styles.indicator, on && { backgroundColor: colors.text }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.line },
  top: { height: 56, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 14 },
  logo: { backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', paddingTop: 6 },
  indicator: { height: 2.5, width: 36, borderRadius: 2, marginTop: 9, backgroundColor: 'transparent' },
});
