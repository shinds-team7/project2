/** 알림 센터 — 아침 정산 요약, 확인 요청, 일정 정산, D-day (푸시 알림과 같은 내용) */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SubHeader } from '@/components/SubHeader';
import { Card, Screen, T } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';
import { diffDays, endOfWeek, fromKey, toKey } from '@/utils/date';
import { won } from '@/utils/format';

type Noti = { id: string; icon: 'sunny' | 'alert-circle' | 'receipt' | 'flag' | 'sparkles'; color: string; title: string; body: string; time: string; href?: Href; unread?: boolean };

export default function Notifications() {
  const { summary: s, scheduled, plans, today } = useStore();
  const list: Noti[] = [];

  if (s.pendingTx.length)
    list.push({ id: 'pend', icon: 'alert-circle', color: colors.warn, title: `확인이 필요한 거래 ${s.pendingTx.length}건`, body: '어떤 돈인지 알려주시면 오늘 금액을 정확하게 계산할게요', time: '08:31', href: '/review', unread: true });

  list.push({ id: 'morning', icon: 'sunny', color: colors.brand, title: `오늘은 ${won(s.dailyLimit)}원까지 쓸 수 있어요`, body: `어제 정산을 마쳤어요. 다음 수입일까지 ${s.daysLeft}일 남았어요`, time: '08:00', href: '/budget-detail', unread: true });

  scheduled
    .filter((x) => x.status === 'planned' && x.date < toKey(today))
    .forEach((x) => list.push({ id: `settle-${x.id}`, icon: 'receipt', color: colors.info, title: `‘${x.title}’ 정산해 주세요`, body: `예상 ${won(x.amount)}원 · 실제 결제와 연결하면 남은 돈을 생활비로 돌려드려요`, time: '08:00', href: `/settle/${x.id}` }));

  scheduled
    .filter((x) => x.status === 'planned' && x.source === 'calendar' && x.date >= toKey(today))
    .slice(0, 1)
    .forEach((x) => list.push({ id: `cal-${x.id}`, icon: 'sparkles', color: colors.brand, title: `캘린더 일정 ‘${x.title}’을 예산에 넣었어요`, body: `AI 예상 ${won(x.amount)}원 · 다르면 수정해 주세요`, time: '어제', href: { pathname: '/schedule', params: { edit: x.id } } }));

  plans
    .filter((p) => endOfWeek(fromKey(p.weekStart)) >= today)
    .forEach((p) => list.push({ id: `plan-${p.id}`, icon: 'flag', color: colors.brandDark, title: `${p.title} D-${diffDays(fromKey(p.weekStart), today)}`, body: `${won(p.amount)}원 결제 예정 · 매일 조금씩 모으는 중이에요`, time: '어제' }));

  return (
    <View style={{ flex: 1 }}>
      <SubHeader title="알림" />
      <Screen>
        <Card style={{ paddingVertical: 6, paddingHorizontal: 6 }}>
          {list.map((n, i) => (
            <Pressable
              key={n.id}
              disabled={!n.href}
              onPress={() => n.href && router.push(n.href)}
              style={[styles.row, i > 0 && styles.border, n.unread && { backgroundColor: colors.brandSofter }]}
            >
              <View style={[styles.icon, { backgroundColor: n.color + '1F' }]}>
                <Ionicons name={n.icon} size={18} color={n.color} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T size={14} weight="700">
                  {n.title}
                </T>
                <T size={13} color={colors.textSub} style={{ lineHeight: 18 }}>
                  {n.body}
                </T>
                <T size={11} color={colors.textMuted}>
                  {n.time}
                </T>
              </View>
              {n.unread && <View style={styles.dot} />}
            </Pressable>
          ))}
        </Card>
        <T size={12} color={colors.textMuted} style={{ textAlign: 'center' }}>
          매일 아침 8시에 정산 결과를 푸시로 알려드려요 · 마이에서 변경
        </T>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16 },
  border: { marginTop: 2 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger, marginTop: 6 },
});
