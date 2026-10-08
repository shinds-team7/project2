/** 5. 마이페이지 — 계좌 연결, 수입·예산·고정지출 설정, 알림/AI 설정 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Card, IconCircle, Screen, SectionTitle, T } from '@/components/ui';
import { ACCOUNTS, FIXED_EXPENSES, INCOME, USER } from '@/data/mock';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';
import { won } from '@/utils/format';

export default function My() {
  const { monthlyBudget, setMonthlyBudget, summary } = useStore();
  const [noti, setNoti] = useState({ daily: true, over: true, plan: true, weekly: false });
  const fixedTotal = FIXED_EXPENSES.reduce((a, f) => a + f.amount, 0);
  const free = INCOME.amount - fixedTotal - monthlyBudget;

  return (
    <Screen>
      {/* 프로필 */}
      <Card style={styles.profile}>
        <View style={styles.avatar}>
          <T size={22} weight="800" color="#fff">
            {USER.name.slice(0, 1)}
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T size={18} weight="800">
            {USER.name}님
          </T>
          <T size={13} color={colors.textMuted}>
            {USER.email}
          </T>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Card>

      {/* 연결 계좌 */}
      <Card>
        <SectionTitle
          title="연결된 계좌"
          right={
            <T size={13} weight="600" color={colors.brandDark}>
              + 계좌 추가
            </T>
          }
        />
        <View style={{ gap: 14 }}>
          {ACCOUNTS.map((a) => (
            <View key={a.id} style={styles.row}>
              <IconCircle name={a.type === 'bank' ? 'business' : 'card'} color="#0046FF" size={40} />
              <View style={{ flex: 1 }}>
                <T size={15} weight="600" numberOfLines={1}>
                  {a.bank} {a.name}
                </T>
                <T size={12} color={colors.textMuted}>
                  {a.number}
                </T>
              </View>
              {a.type === 'bank' ? (
                <T size={15} weight="700">
                  {won(a.balance)}원
                </T>
              ) : (
                <T size={12} weight="600" color={colors.brandDark}>
                  연결됨
                </T>
              )}
            </View>
          ))}
        </View>
        <View style={styles.note}>
          <Ionicons name="shield-checkmark" size={14} color={colors.brandDark} />
          <T size={12} color={colors.textSub} style={{ flex: 1 }}>
            거래내역은 AI 분석에만 사용되며, 매일 새벽 자동으로 동기화돼요
          </T>
        </View>
      </Card>

      {/* 예산 설정 */}
      <Card>
        <SectionTitle title="예산 설정" />
        <Row label="월 수입" value={`${won(INCOME.amount)}원`} sub={`매월 ${INCOME.payday}일 · AI가 자동 인식`} />
        <Row label="고정 지출" value={`${won(fixedTotal)}원`} sub={`${FIXED_EXPENSES.length}건 · 월세, 통신비, 구독 등`} />
        <View style={styles.budgetBox}>
          <View style={{ flex: 1 }}>
            <T size={14} color={colors.textSub}>
              월 생활비 예산
            </T>
            <T size={22} weight="800" style={{ marginTop: 2 }}>
              {won(monthlyBudget)}원
            </T>
            <T size={12} color={colors.textMuted} style={{ marginTop: 2 }}>
              → 오늘 하루 한도 {won(summary.dailyLimit)}원
            </T>
          </View>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => setMonthlyBudget(Math.max(300000, monthlyBudget - 100000))}>
              <Ionicons name="remove" size={18} color={colors.text} />
            </Pressable>
            <Pressable style={styles.stepBtn} onPress={() => setMonthlyBudget(monthlyBudget + 100000)}>
              <Ionicons name="add" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>
        <T size={12} color={free >= 0 ? colors.textMuted : colors.danger} style={{ marginTop: 10 }}>
          수입 - 고정지출 - 생활비 = 매달 {won(free)}원 여유 (저축 가능 금액)
        </T>
      </Card>

      {/* 고정 지출 */}
      <Card>
        <SectionTitle title="고정 지출" />
        <View style={{ gap: 12 }}>
          {FIXED_EXPENSES.map((f) => (
            <View key={f.name} style={styles.row}>
              <View style={styles.dayBadge}>
                <T size={12} weight="700" color={colors.textSub}>
                  {f.day}일
                </T>
              </View>
              <T size={15} style={{ flex: 1 }}>
                {f.name}
              </T>
              <T size={15} weight="600">
                {won(f.amount)}원
              </T>
            </View>
          ))}
        </View>
      </Card>

      {/* 알림 */}
      <Card>
        <SectionTitle title="알림" />
        <Toggle label="매일 아침 오늘 사용 가능 금액" value={noti.daily} onChange={(v) => setNoti({ ...noti, daily: v })} />
        <Toggle label="하루 예산 초과 시 알림" value={noti.over} onChange={(v) => setNoti({ ...noti, over: v })} />
        <Toggle label="고액 지출 D-7 알림" value={noti.plan} onChange={(v) => setNoti({ ...noti, plan: v })} />
        <Toggle label="주간 소비 리포트" value={noti.weekly} onChange={(v) => setNoti({ ...noti, weekly: v })} />
      </Card>

      <Card style={{ gap: 4, paddingVertical: 8 }}>
        {['AI 분석 기준 설정', '공지사항', '고객센터', '로그아웃'].map((l) => (
          <Pressable key={l} style={styles.menu}>
            <T size={15} color={l === '로그아웃' ? colors.textMuted : colors.text}>
              {l}
            </T>
            <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
          </Pressable>
        ))}
      </Card>
      <T size={12} color={colors.textFaint} style={{ textAlign: 'center' }}>
        Flex-able 텅장관리 v0.1.0 (mock)
      </T>
    </Screen>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={[styles.row, { marginBottom: 14 }]}>
      <View style={{ flex: 1 }}>
        <T size={14} color={colors.textSub}>
          {label}
        </T>
        <T size={12} color={colors.textMuted}>
          {sub}
        </T>
      </View>
      <T size={16} weight="700">
        {value}
      </T>
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={[styles.row, { paddingVertical: 8 }]}>
      <T size={15} style={{ flex: 1 }}>
        {label}
      </T>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.brand, false: '#D0D5DD' }}
        thumbColor="#fff"
        {...({ activeThumbColor: '#fff' } as object)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  note: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: colors.brandSofter,
    borderRadius: 12,
    padding: 10,
  },
  budgetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandSofter,
    borderRadius: 16,
    padding: 16,
  },
  stepper: { flexDirection: 'row', gap: 8 },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayBadge: {
    width: 40,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
});
