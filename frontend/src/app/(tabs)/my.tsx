/** 5. 마이페이지 — 계좌 연결, 수입·고정지출·보호 금액, AI 메모리, 알림 설정 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Card, IconCircle, Screen, SectionTitle, T } from '@/components/ui';
import { ACCOUNTS, USER } from '@/data/mock';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';
import { md } from '@/utils/date';
import { won } from '@/utils/format';

export default function My() {
  const { income, fixed, protectedList, summary, restartOnboarding } = useStore();
  const [noti, setNoti] = useState({ morning: true, check: true, plan: true, weekly: false });
  const fixedTotal = fixed.reduce((a, f) => a + f.amount, 0);
  const protectedTotal = protectedList.reduce((a, p) => a + p.amount, 0);

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
          title="연결된 계좌·카드"
          right={
            <T size={13} weight="600" color={colors.brandDark}>
              + 추가
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
                  {won(summary.bankBalance)}원
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
            오픈뱅킹 조회 권한만 사용해요 · 매일 새벽 5시 자동 정산
          </T>
        </View>
      </Card>

      {/* 예산 설정 */}
      <Card>
        <SectionTitle title="예산 설정" />
        <Menu label="월 수입" value={`${won(income.amount)}원`} sub={`매월 ${income.payday}일 · 다음 수입일 ${md(summary.nextPayday)}`} href={{ pathname: '/onboarding/income', params: { edit: '1' } }} />
        <Menu label="고정지출" value={`${won(fixedTotal)}원`} sub={`${fixed.length}건 · 월세, 통신비, 구독 등`} href={{ pathname: '/onboarding/fixed', params: { edit: '1' } }} />
        <Menu label="보호 금액" value={`${won(protectedTotal)}원`} sub={protectedList.map((p) => p.name).join(', ')} href={{ pathname: '/onboarding/protect', params: { edit: '1' } }} />
        <Menu label="계산 근거 보기" sub={`오늘 하루 기준 ${won(summary.dailyLimit)}원`} href="/budget-detail" />
      </Card>

      {/* AI */}
      <Card>
        <SectionTitle title="AI" />
        <Menu label="AI 메모리" sub="AI가 기억하는 내 소비 단가·습관 보기/수정" href="/memory" />
        <Menu label="예정 지출 관리" sub="등록한 소비 일정 수정·삭제" href="/schedule" />
      </Card>

      {/* 알림 */}
      <Card>
        <SectionTitle title="알림" />
        <Toggle label="아침 8시 정산 요약" value={noti.morning} onChange={(v) => setNoti({ ...noti, morning: v })} />
        <Toggle label="확인이 필요한 거래 알림" value={noti.check} onChange={(v) => setNoti({ ...noti, check: v })} />
        <Toggle label="고액 지출 D-7 알림" value={noti.plan} onChange={(v) => setNoti({ ...noti, plan: v })} />
        <Toggle label="주간 소비 리포트" value={noti.weekly} onChange={(v) => setNoti({ ...noti, weekly: v })} />
      </Card>

      <Card style={{ gap: 4, paddingVertical: 8 }}>
        <Pressable
          style={styles.menu}
          onPress={() => {
            restartOnboarding();
            router.replace('/onboarding');
          }}
        >
          <T size={15}>처음 설정 다시 하기 (온보딩)</T>
          <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
        </Pressable>
        {['공지사항', '고객센터', '로그아웃'].map((l) => (
          <Pressable key={l} style={styles.menu}>
            <T size={15} color={l === '로그아웃' ? colors.textMuted : colors.text}>
              {l}
            </T>
            <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
          </Pressable>
        ))}
      </Card>
      <T size={12} color={colors.textFaint} style={{ textAlign: 'center' }}>
        Flex-able 텅장관리 v0.2.0 (mock)
      </T>
    </Screen>
  );
}

function Menu({ label, value, sub, href }: { label: string; value?: string; sub?: string; href: Href }) {
  return (
    <Pressable style={[styles.row, { paddingVertical: 10 }]} onPress={() => router.push(href)}>
      <View style={{ flex: 1 }}>
        <T size={15} weight="600">
          {label}
        </T>
        {sub && (
          <T size={12} color={colors.textMuted} numberOfLines={1}>
            {sub}
          </T>
        )}
      </View>
      {value && (
        <T size={15} weight="700">
          {value}
        </T>
      )}
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
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
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  note: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 16, backgroundColor: colors.brandSofter, borderRadius: 12, padding: 10 },
  menu: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
});
