import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';
import { addDays, endOfMonth, isSameDay, startOfMonth, startOfWeek, toKey, weekLabel } from '@/utils/date';
import { T } from './ui';

const HEAD = ['월', '화', '수', '목', '금', '토', '일'];

type Props = {
  today: Date;
  selectedWeek: Date;
  recommendedWeek: Date;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  onSelectWeek: (ws: Date) => void;
  marks: Set<string>; // 일정/계획이 있는 날짜 key
};

export function WeekCalendar({ today, selectedWeek, recommendedWeek, onPrev, onNext, canPrev, onSelectWeek, marks }: Props) {
  // 선택 주의 목요일이 속한 달을 보여준다
  const anchor = addDays(selectedWeek, 3);
  const first = startOfWeek(startOfMonth(anchor));
  const last = endOfMonth(anchor);
  const weeks: Date[] = [];
  for (let w = first; w <= last; w = addDays(w, 7)) weeks.push(w);

  const minWeek = startOfWeek(today);

  return (
    <View>
      <View style={styles.header}>
        <View>
          <T size={18} weight="800">
            {anchor.getFullYear()}년 {anchor.getMonth() + 1}월
          </T>
          <T size={13} weight="600" color={colors.textMuted} style={{ marginTop: 2 }}>
            희망 결제 주 · {weekLabel(selectedWeek)}
          </T>
        </View>
        <View style={styles.arrows}>
          <Pressable onPress={onPrev} disabled={!canPrev} style={[styles.arrow, !canPrev && { opacity: 0.35 }]}>
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <Pressable onPress={onNext} style={styles.arrow}>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.row}>
        {HEAD.map((h, i) => (
          <View key={h} style={styles.cell}>
            <T size={12} weight="600" color={i === 6 ? colors.danger : i === 5 ? colors.info : colors.textMuted}>
              {h}
            </T>
          </View>
        ))}
      </View>

      {weeks.map((ws) => {
        const isRec = isSameDay(ws, recommendedWeek);
        const isSel = isSameDay(ws, selectedWeek);
        const past = ws < minWeek;
        return (
          <Pressable
            key={toKey(ws)}
            disabled={past}
            onPress={() => onSelectWeek(ws)}
            style={[styles.row, styles.week, isRec && styles.rec, isSel && styles.sel]}
          >
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(ws, i);
              const inMonth = d.getMonth() === anchor.getMonth();
              const isToday = isSameDay(d, today);
              const dim = !inMonth || d < today;
              return (
                <View key={i} style={styles.cell}>
                  <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                    <T
                      size={14}
                      weight={isToday || isRec ? '700' : '500'}
                      color={isToday ? '#fff' : dim ? colors.textFaint : isRec ? colors.brandDark : colors.text}
                    >
                      {d.getDate()}
                    </T>
                  </View>
                  <View style={[styles.dot, marks.has(toKey(d)) && { backgroundColor: colors.warn }]} />
                </View>
              );
            })}
          </Pressable>
        );
      })}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: colors.brandSoft }]} />
          <T size={12} color={colors.textMuted}>
            AI 추천 주
          </T>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { borderWidth: 2, borderColor: colors.text }]} />
          <T size={12} color={colors.textMuted}>
            선택한 주
          </T>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.warn }]} />
          <T size={12} color={colors.textMuted}>
            다른 지출 일정
          </T>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  arrows: { flexDirection: 'row', gap: 8 },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row' },
  week: { borderRadius: 14, borderWidth: 2, borderColor: 'transparent', marginVertical: 2, paddingVertical: 4 },
  rec: { backgroundColor: colors.brandSoft },
  sel: { borderColor: colors.text },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { backgroundColor: colors.text },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2, backgroundColor: 'transparent' },
  legend: { flexDirection: 'row', gap: 14, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendBox: { width: 14, height: 14, borderRadius: 4 },
});
