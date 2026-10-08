import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';

import { colors, font, radius, shadow } from '@/theme';

type TProps = TextProps & {
  size?: number;
  weight?: '400' | '500' | '600' | '700' | '800';
  color?: string;
};

export function T({ size = 15, weight = '400', color = colors.text, style, ...rest }: TProps) {
  return (
    <RNText
      {...rest}
      style={[{ fontSize: size, fontWeight: weight, color, fontFamily: font, letterSpacing: -0.2 }, style]}
    />
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, shadow, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, shadow, style]}>{children}</View>;
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <T size={17} weight="700">
        {title}
      </T>
      {right}
    </View>
  );
}

type BtnProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'soft' | 'ghost';
  icon?: ComponentProps<typeof Ionicons>['name'];
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, variant = 'primary', icon, style, disabled, ...rest }: BtnProps) {
  const bg = variant === 'primary' ? colors.brand : variant === 'soft' ? colors.brandSoft : 'transparent';
  const fg = variant === 'primary' ? '#fff' : colors.brandDark;
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: disabled ? '#D0D5DD' : bg },
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color={disabled ? '#fff' : fg} />}
      <T size={16} weight="700" color={disabled ? '#fff' : fg}>
        {label}
      </T>
    </Pressable>
  );
}

/** 점선 테두리 + 버튼 (일정/계획 추가용) */
export function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
      <Ionicons name="add" size={20} color={colors.brandDark} />
      <T size={14} weight="600" color={colors.brandDark}>
        {label}
      </T>
    </Pressable>
  );
}

export function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <T size={12} weight="700" color={color}>
        {label}
      </T>
    </View>
  );
}

export function IconCircle({
  name,
  color,
  size = 40,
  bg,
}: {
  name: ComponentProps<typeof Ionicons>['name'];
  color: string;
  size?: number;
  bg?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg ?? color + '1F',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={size * 0.5} color={color} />
    </View>
  );
}

export function Segment<K extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <View style={styles.segment}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable key={it.key} onPress={() => onChange(it.key)} style={[styles.segItem, on && styles.segOn]}>
            <T size={14} weight={on ? '700' : '500'} color={on ? colors.text : colors.textMuted}>
              {it.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 하단 시트 모달 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.dim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHead}>
            <T size={19} weight="700" style={{ flex: 1 }}>
              {title}
            </T>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
          {subtitle && (
            <T size={13} color={colors.textMuted} style={{ marginTop: 4 }}>
              {subtitle}
            </T>
          )}
          <View style={{ marginTop: 18 }}>{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** 가운데 확인 모달 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.dim, { justifyContent: 'center', padding: 28 }]}>
        <View style={styles.dialog}>
          <T size={18} weight="700">
            {title}
          </T>
          <View style={{ marginTop: 10 }}>
            {typeof message === 'string' ? (
              <T size={14} color={colors.textSub} style={{ lineHeight: 21 }}>
                {message}
              </T>
            ) : (
              message
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 22 }}>
            <Button label={cancelLabel} variant="soft" style={{ flex: 1, height: 48 }} onPress={onCancel} />
            <Button label={confirmLabel} style={{ flex: 1, height: 48 }} onPress={onConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <T size={13} weight="600" color={on ? '#fff' : colors.textSub}>
        {label}
      </T>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>{children}</View>;
}

export const styles = StyleSheet.create({
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
  sheetHead: { flexDirection: 'row', alignItems: 'center' },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 22, padding: 22, alignSelf: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.bg },
  chipOn: { backgroundColor: colors.text },
  screen: { padding: 16, paddingBottom: 48, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  btn: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  add: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A6E3C4',
    backgroundColor: colors.brandSofter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  segment: { flexDirection: 'row', backgroundColor: '#E9ECEF', borderRadius: 12, padding: 4 },
  segItem: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  segOn: { backgroundColor: '#fff' },
});
