import { Platform } from 'react-native';

export const colors = {
  /** 신한 블루 */
  brand: '#0046FF',
  brandDark: '#0034C2',
  brandSoft: '#E6EDFF',
  brandSofter: '#F3F6FF',
  brandBorder: '#A9C0FF',

  bg: '#F2F4F6',
  card: '#FFFFFF',
  line: '#EEF0F3',

  text: '#191F28',
  textSub: '#4E5968',
  textMuted: '#8B95A1',
  textFaint: '#B0B8C1',

  warn: '#F79009',
  warnSoft: '#FEF4E6',
  danger: '#F04438',
  dangerSoft: '#FEECEB',
  info: '#2E90FA',
  infoSoft: '#EAF4FF',
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

export const font = Platform.select({
  web: 'Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
  default: undefined,
});

/** 웹 TextInput 포커스 테두리 제거 */
export const noOutline = Platform.select({ web: { outlineStyle: 'none' } as object, default: {} });

export const shadow = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(16,24,40,0.04)' } as object,
  default: { elevation: 1 },
});
