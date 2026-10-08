import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ScheduledSpend } from '@/store/budget';
import { colors } from '@/theme';
import { fromKey, isSameDay } from '@/utils/date';
import { DOW, won } from '@/utils/format';
import { T } from './ui';

export function ScheduleRow({ item, today, onPress }: { item: ScheduledSpend; today: Date; onPress?: () => void }) {
  const d = fromKey(item.date);
  return (
    <Pressable style={styles.item} onPress={onPress ?? (() => router.push({ pathname: '/schedule', params: { edit: item.id } }))}>
      <View style={styles.dateBox}>
        <T size={11} weight="600" color={colors.brandDark}>
          {isSameDay(d, today) ? '오늘' : DOW[d.getDay()]}
        </T>
        <T size={16} weight="800" color={colors.brandDark}>
          {d.getDate()}
        </T>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T size={15} weight="600" numberOfLines={1}>
          {item.title}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons
            name={item.source === 'calendar' ? 'calendar-outline' : item.source === 'ai' ? 'sparkles' : 'create-outline'}
            size={11}
            color={colors.textMuted}
          />
          <T size={12} color={colors.textMuted} numberOfLines={1}>
            {item.source === 'calendar' ? '캘린더 일정' : item.source === 'ai' ? 'AI 예상 금액' : '직접 입력'}
            {item.items && item.items.length > 1 ? ` · ${item.items.map((i) => i.label).join('+')}` : ''}
          </T>
        </View>
      </View>
      <T size={15} weight="700">
        {won(item.amount)}원
      </T>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  dateBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
