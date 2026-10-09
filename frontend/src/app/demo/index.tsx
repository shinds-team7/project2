/**
 * 시연 메뉴 — 서버가 있어야 동작하는 기능을 URL로 결과 화면만 보여준다.
 *   /demo/pay?merchant=&amount=&category=   결제 수신 → 오늘 금액 재계산 + 결제 푸시
 *   /demo/push?type=morning|settle|plan      푸시 알림 (잠금화면)
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SubHeader } from '@/components/SubHeader';
import { Card, Screen, SectionTitle, T } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';
import { won } from '@/utils/format';

type Item = { title: string; desc: string; href: Href; url: string };

const pay = (merchant: string, amount: number, category: string): Item => ({
  title: `${merchant} ${won(amount)}원 결제`,
  desc: '카드 결제 → 서버 수신 → 오늘 쓸 수 있는 돈 재계산 → 결제 푸시',
  href: { pathname: '/demo/pay', params: { merchant, amount: String(amount), category, key: String(Date.now()) } },
  url: `/demo/pay?merchant=${merchant}&amount=${amount}&category=${category}`,
});

export default function Demo() {
  const { summary, restartOnboarding } = useStore();

  const payments: Item[] = [pay('스타벅스', 5600, 'cafe'), pay('배달의민족', 23000, 'food'), pay('무신사', 49000, 'shopping')];
  const pushes: Item[] = [
    { title: '아침 정산 요약 푸시', desc: '새벽 정산 후 설정한 시간에 오늘 금액 알림', href: '/demo/push?type=morning', url: '/demo/push?type=morning' },
    { title: '일정 정산 요청 푸시', desc: '어제 일정의 실제 결제 확인 요청', href: '/demo/push?type=settle', url: '/demo/push?type=settle' },
    { title: '고액 지출 D-7 푸시', desc: '결제 예정 주가 다가올 때', href: '/demo/push?type=plan', url: '/demo/push?type=plan' },
  ];
  const flows: Item[] = [
    { title: '회식비 1/N 나누기', desc: '역전할맥 96,000원 → 거래 상세 최하단 1/N', href: '/tx/nbbang', url: '/tx/nbbang' },
    { title: '대신 결제한 돈 반영 제외', desc: '다이소 27,500원 → 거래 상세 최하단 반영 제외', href: '/tx/proxy', url: '/tx/proxy' },
    { title: '지난 일정 정산', desc: '동기 생일 선물 → 실제 결제 연결', href: '/settle/s0', url: '/settle/s0' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <SubHeader title="시연 메뉴" fallback="/my" />
      <Screen>
        <Card style={{ backgroundColor: colors.brandSofter }}>
          <T size={13} color={colors.textSub} style={{ lineHeight: 19 }}>
            서버·푸시가 필요한 기능을 결과 화면으로 보여줘요. 각 항목은 URL로도 바로 열 수 있어요.
          </T>
          <T size={15} weight="800" style={{ marginTop: 8 }}>
            지금 오늘 쓸 수 있는 돈 {won(Math.max(0, summary.todayAvailable))}원
          </T>
        </Card>
        <Group title="결제 발생 → 실시간 반영" items={payments} />
        <Group title="푸시 알림" items={pushes} />
        <Group title="거래 조정 · 정산" items={flows} />
        <Card onPress={() => { restartOnboarding(); router.replace('/onboarding'); }}>
          <T size={15} weight="700">
            온보딩 처음부터 보기
          </T>
          <T size={12} color={colors.textMuted}>
            /onboarding
          </T>
        </Card>
      </Screen>
    </View>
  );
}

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <Card>
      <SectionTitle title={title} />
      <View style={{ gap: 4 }}>
        {items.map((it) => (
          <Pressable key={it.url} style={styles.row} onPress={() => router.push(it.href)}>
            <View style={{ flex: 1 }}>
              <T size={15} weight="600">
                {it.title}
              </T>
              <T size={12} color={colors.textMuted}>
                {it.desc}
              </T>
              <T size={11} color={colors.info} style={{ marginTop: 2 }}>
                {it.url}
              </T>
            </View>
            <Ionicons name="play-circle" size={26} color={colors.brand} />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
});
