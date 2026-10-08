# Flex-able 텅장관리 — Frontend (Mock)

Expo(React Native) + Expo Router 기반. **하나의 코드로 iOS / Android / Web** 을 동시에 빌드한다.
현재는 멘토링 시연용 Mock 단계로, 모든 데이터는 `src/data/mock.ts` 에서 오늘 날짜 기준으로 생성된다.

## 실행

```bash
cd frontend
npm install
npm run web        # 브라우저 (http://localhost:8081)
npm start          # Expo Go 앱으로 QR 스캔 → 실제 폰에서 확인
npm run build:web  # 정적 웹 빌드 → dist/
npm run typecheck
```

> 패키지 추가는 `npx expo install <pkg>` 로 (SDK 호환 버전 자동 선택)

## 화면 (상단 네비: 홈 / 지출계획 / 분석 / 마이)

| # | 경로 | 화면 | 핵심 기능 |
|---|------|------|-----------|
| 1 | `/` | 홈 | 오늘 사용 가능 금액, 이번 주 사용 가능 금액(→ 분석), 이번 주 소비 일정(+추가), 고액 지출 D-day(+ → 지출계획) |
| 2 | `/plan` | 지출계획 | 금액 입력 → AI 추천 결제 주(초록) 표시, `< >` 로 1주 단위 조정, 확정 시 홈 금액에 반영 |
| 3 | `/analysis` | 소비 분석 | 이번 주/이번 달 도넛 차트, AI 인사이트, 카테고리별 사용 현황·비율 |
| 4 | `/transactions` | 거래내역 | 연결 계좌 거래내역 최신순, 월 이동, 전체/지출/수입 필터 (분석 탭 내 세그먼트) |
| 5 | `/my` | 마이 | 연결 계좌, 수입·고정지출, 월 생활비 예산(±10만 → 홈 반영), 알림 토글 |

## 폴더 구조

```
src/
  app/          # 라우트 (파일 = 화면). _layout.tsx 에 헤더 + 상단 네비
  components/   # UI 컴포넌트 (ui.tsx 공통, Donut, WeekCalendar, AddScheduleModal ...)
  store/        # AppStore(전역 상태), budget.ts(예산 계산·AI 추천 Mock 로직)
  data/         # Mock 데이터 (거래내역, 계좌, 카테고리)
  theme/        # 색상·폰트 토큰
  utils/        # 날짜·금액 포맷
```

## 예산 계산 로직 (Mock, `src/store/budget.ts`)

- **하루 한도** = (월 생활비 예산 − 오늘 전까지 쓴 돈 − 남은 소비 일정) ÷ 이번 달 남은 일수 − 고액 지출 적립액
- **고액 지출 적립액** = 금액 ÷ (오늘 ~ 결제 주 일요일까지 일수) → 결제 주를 앞당길수록 하루 부담이 커짐
- **AI 추천 주** = 하루 한도 감소율이 25% 이하가 되는 가장 빠른 주
- 백엔드/AI 서버 연동 시 이 계산은 서버 응답으로 교체한다 (`AppStore.tsx` 주석 참고)

## 배포 (Vercel)

Vercel 프로젝트 설정에서 **Root Directory = `frontend`** 로 지정하면 `vercel.json` 설정대로 빌드된다.
(Build: `npx expo export -p web`, Output: `dist`, SPA rewrite 포함)
