import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useStore } from '@/store/AppStore';
import { noOutline, colors, font, radius } from '@/theme';
import { addDays, diffDays, endOfWeek, isSameDay, toKey } from '@/utils/date';
import { DOW, won } from '@/utils/format';
import { Button, T } from './ui';

const PRESETS = ['약속·모임', '데이트', '경조사', '병원', '미용실'];

export function AddScheduleModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { today, addScheduled } = useStore();
  const days = useMemo(() => {
    const n = diffDays(endOfWeek(today), today) + 1;
    return Array.from({ length: n }, (_, i) => addDays(today, i));
  }, [today]);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState(0);

  const num = Number(amount.replace(/[^0-9]/g, '')) || 0;
  const valid = title.trim().length > 0 && num > 0;

  const reset = () => {
    setTitle('');
    setAmount('');
    setDay(0);
  };

  const submit = () => {
    if (!valid) return;
    addScheduled({ title: title.trim(), amount: num, date: toKey(days[day]) });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.dim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.head}>
            <T size={19} weight="700">
              이번 주 소비 일정 추가
            </T>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
          <T size={13} color={colors.textMuted} style={{ marginBottom: 18 }}>
            미리 등록하면 오늘 사용 가능한 금액에 바로 반영돼요
          </T>

          <T size={13} weight="600" color={colors.textSub} style={styles.label}>
            언제
          </T>
          <View style={styles.chips}>
            {days.map((d, i) => {
              const on = i === day;
              return (
                <Pressable key={i} onPress={() => setDay(i)} style={[styles.dayChip, on && styles.chipOn]}>
                  <T size={12} color={on ? '#fff' : colors.textMuted}>
                    {isSameDay(d, today) ? '오늘' : DOW[d.getDay()]}
                  </T>
                  <T size={15} weight="700" color={on ? '#fff' : colors.text}>
                    {d.getDate()}
                  </T>
                </Pressable>
              );
            })}
          </View>

          <T size={13} weight="600" color={colors.textSub} style={styles.label}>
            무엇을
          </T>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="예) 친구 생일 저녁"
            placeholderTextColor={colors.textFaint}
            style={[styles.input, noOutline]}
          />
          <View style={[styles.chips, { marginTop: 8 }]}>
            {PRESETS.map((p) => (
              <Pressable key={p} onPress={() => setTitle(p)} style={styles.preset}>
                <T size={12} color={colors.textSub}>
                  {p}
                </T>
              </Pressable>
            ))}
          </View>

          <T size={13} weight="600" color={colors.textSub} style={styles.label}>
            예상 금액
          </T>
          <View style={styles.amountRow}>
            <TextInput
              value={num ? won(num) : ''}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="number-pad"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, noOutline, { flex: 1, textAlign: 'right' }]}
            />
            <T size={16} weight="600">
              원
            </T>
          </View>

          <Button label="추가하기" onPress={submit} disabled={!valid} style={{ marginTop: 24 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 34,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label: { marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    width: 46,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  chipOn: { backgroundColor: colors.brand },
  preset: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.bg },
  input: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    fontFamily: font,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
