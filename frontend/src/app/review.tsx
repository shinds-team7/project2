/** 확인할 거래 — 성격이 불분명한 거래(주로 이체)를 사용자가 구분하고 예산에 반영 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SubHeader } from '@/components/SubHeader';
import { Button, Card, Chip, IconCircle, Screen, T } from '@/components/ui';
import { SPEND_CATEGORIES, type CategoryId } from '@/data/categories';
import type { Transaction } from '@/data/mock';
import { computeBudget } from '@/store/budget';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';
import { fromKey, md } from '@/utils/date';
import { DOW, won } from '@/utils/format';

type Kind = 'spend' | 'self' | 'transfer';

const KINDS: { key: Kind; label: string; desc: string; icon: 'cart' | 'swap-horizontal' | 'paper-plane' }[] = [
  { key: 'spend', label: '실제 소비', desc: '물건·서비스 값을 낸 거예요', icon: 'cart' },
  { key: 'self', label: '내 계좌 이동', desc: '저축·다른 내 통장으로 옮겼어요', icon: 'swap-horizontal' },
  { key: 'transfer', label: '그 외 송금', desc: '친구 정산, 선물, 경조사 등', icon: 'paper-plane' },
];

const GUESS_TEXT: Record<string, string> = {
  self: '받는 사람 이름이 내 이름과 같아요. 내 다른 계좌로 옮긴 것 같아요',
  transfer: '친구에게 보낸 송금 같아요. 모임비 정산이었나요?',
};

export default function Review() {
  const { transactions, budgetInput, summary } = useStore();
  const pending = transactions.filter((t) => t.status === 'pending');
  const [doneCount, setDoneCount] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      <SubHeader title="확인할 거래" />
      <Screen>
        <Card style={{ backgroundColor: pending.length ? colors.warnSoft : colors.brandSofter }}>
          <T size={16} weight="800">
            {pending.length ? `${pending.length}건만 확인해 주세요` : '모든 거래를 확인했어요'}
          </T>
          <T size={13} color={colors.textSub} style={{ marginTop: 4, lineHeight: 19 }}>
            {pending.length
              ? '계좌에서 빠져나갔지만 어떤 돈인지 확실하지 않은 거래예요.\n확인 전까지는 오늘 금액에 반영하지 않았어요.'
              : `오늘 사용 가능 금액은 ${won(Math.max(0, summary.todayAvailable))}원이에요.`}
          </T>
        </Card>

        {pending.map((t) => (
          <ReviewCard key={t.id} tx={t} baseDaily={summary.todayAvailable} preview={(cat) => {
            const next = budgetInput.transactions.map((x) => (x.id === t.id ? { ...x, category: cat, status: 'confirmed' as const } : x));
            return computeBudget({ ...budgetInput, transactions: next }).todayAvailable;
          }} onDone={() => setDoneCount(doneCount + 1)} />
        ))}

        {pending.length === 0 && <Button label="홈으로" onPress={() => router.dismissTo('/')} />}
        {doneCount > 0 && pending.length > 0 && (
          <T size={12} color={colors.textMuted} style={{ textAlign: 'center' }}>
            {doneCount}건 반영 완료
          </T>
        )}
      </Screen>
    </View>
  );
}

function ReviewCard({ tx, baseDaily, preview, onDone }: { tx: Transaction; baseDaily: number; preview: (c: CategoryId) => number; onDone: () => void }) {
  const { confirmTx } = useStore();
  const [kind, setKind] = useState<Kind | null>((tx.guess as Kind) ?? null);
  const [cat, setCat] = useState<CategoryId>('food');
  const [memo, setMemo] = useState<string | undefined>();
  const d = fromKey(tx.date);

  const finalCat: CategoryId | null = kind === 'spend' ? cat : kind === 'self' ? 'self' : kind === 'transfer' ? 'transfer' : null;
  const after = finalCat ? preview(finalCat) : baseDaily;

  return (
    <Card style={{ gap: 14 }}>
      <View style={styles.head}>
        <IconCircle name="help" color={colors.warn} size={42} />
        <View style={{ flex: 1 }}>
          <T size={15} weight="700">
            {tx.merchant}
          </T>
          <T size={12} color={colors.textMuted} numberOfLines={1}>
            {md(d)} ({DOW[d.getDay()]}) {tx.time} · {tx.account}
          </T>
        </View>
        <T size={17} weight="800">
          {won(tx.amount)}원
        </T>
      </View>

      {tx.guess && (
        <View style={styles.guess}>
          <Ionicons name="sparkles" size={14} color={colors.brandDark} />
          <T size={13} color={colors.brandDark} style={{ flex: 1, lineHeight: 18 }}>
            {GUESS_TEXT[tx.guess]}
          </T>
        </View>
      )}

      <View style={{ gap: 8 }}>
        {KINDS.map((k) => {
          const on = kind === k.key;
          return (
            <Pressable key={k.key} onPress={() => setKind(k.key)} style={[styles.kind, on && styles.kindOn]}>
              <Ionicons name={k.icon} size={18} color={on ? colors.brandDark : colors.textMuted} />
              <View style={{ flex: 1 }}>
                <T size={14} weight="700" color={on ? colors.brandDark : colors.text}>
                  {k.label}
                </T>
                <T size={12} color={colors.textMuted}>
                  {k.desc}
                </T>
              </View>
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? colors.brand : colors.textFaint} />
            </Pressable>
          );
        })}
      </View>

      {kind === 'spend' && (
        <View style={styles.chips}>
          {SPEND_CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.name} on={cat === c.id} onPress={() => setCat(c.id)} />
          ))}
        </View>
      )}
      {kind === 'transfer' && (
        <View style={styles.chips}>
          {['모임비 정산', '선물', '경조사', '빌려준 돈'].map((m) => (
            <Chip key={m} label={m} on={memo === m} onPress={() => setMemo(memo === m ? undefined : m)} />
          ))}
        </View>
      )}

      {finalCat && (
        <View style={styles.preview}>
          <T size={13} color={colors.textSub} style={{ flex: 1 }}>
            {kind === 'self' ? '생활비에서 빠진 돈으로 처리해요 (소비 통계 제외)' : '소비로 기록해요'}
          </T>
          <T size={13} weight="700" color={colors.textSub}>
            오늘 {won(Math.max(0, baseDaily))} → {won(Math.max(0, after))}원
          </T>
        </View>
      )}

      <Button
        label="반영하기"
        disabled={!finalCat}
        onPress={() => {
          if (!finalCat) return;
          confirmTx(tx.id, { category: finalCat, memo });
          onDone();
        }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guess: { flexDirection: 'row', gap: 6, backgroundColor: colors.brandSofter, borderRadius: 12, padding: 12 },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line },
  kindOn: { borderColor: colors.brand, backgroundColor: colors.brandSofter },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderRadius: 12, padding: 12 },
});
