# Mock → 실제 서비스 전환 가이드

이 문서는 시연용 Mock을 실제 서비스 코드로 교체할 때 AI와 개발자가 지켜야 할 경계를 정의한다.
화면 컴포넌트에서 네트워크·SQLite·네이티브 SDK를 직접 호출하지 않는다.

## 핵심 원칙

1. 화면은 application service 또는 repository interface만 호출한다.
2. 모바일 쓰기는 로컬 DB에 먼저 반영하고 outbox에 기록한다.
3. outbox 재전송은 같은 `Idempotency-Key`를 유지한다.
4. 예산 최종값은 Spring Budget Engine 결과를 기준으로 한다.
5. AI는 DRAFT만 만들며 금액 산술과 확정 저장을 수행하지 않는다.
6. AI 서버와 외부 LLM은 클라이언트가 직접 호출하지 않는다.

## 교체 매핑

| 현재 Mock | 실제 서비스 경계 | 교체 방향 | 유지할 불변식 |
| --- | --- | --- | --- |
| `src/store/AppStore.tsx` | application service + local repository | 상태를 기능별 store로 분리하고 SQLite snapshot/outbox를 구독 | UI 액션 직후 로컬 상태가 먼저 갱신됨 |
| `src/data/mock.ts` | repository adapter | 개발 seed adapter로 격리하고 production에서는 SQLite/Spring adapter 사용 | 화면이 데이터 출처를 알지 않음 |
| `src/store/budget.ts` | Spring Budget Engine | 클라이언트에는 오프라인 preview 함수만 유지 | 서버 결과가 최종 기준이며 원 단위 정수 연산 |
| `src/ai/parsePlan.ts` | Spring AI Gateway → FastAPI | `POST /ai/plan-drafts`의 schema-validated DRAFT로 교체 | 사용자 확인 전 저장·확정 금지 |
| `src/ai/memory.ts` | Spring 도구 API | 사용자 확인 데이터만 조회·수정 | 원거래 대신 요약값 사용 |
| `CALENDAR_EVENTS` | Calendar adapter | 플랫폼 캘린더 권한 또는 서버 Calendar API로 교체 | 권한 거부 시 직접 입력 가능 |
| `demo/pay`, `demo/push` | 알림 수집·FCM/APNs | production bundle에서 제외 | 시연 경로가 실제 데이터에 접근하지 않음 |

## 거래 쓰기 흐름

```text
UI command
  → SQLite transaction 저장(LOCAL_PENDING)
  → outbox 저장(client UUID)
  → 화면 즉시 갱신
  → Spring POST /transactions + Idempotency-Key
  → 서버 CONFIRMED 결과와 budget snapshot 수신
  → SQLite 동기화
```

거래를 재전송할 때 client UUID를 새로 만들지 않는다. 일정 정산으로 거래를 연결할 때 이미 다른 일정에 연결된 거래는 서버가 거절해야 한다.

## 예산 계산 계약

- `long` 원 단위 정수만 사용한다.
- 다음 수입일 전날까지 계산한다.
- 예정 수입은 제외한다.
- 음수 결과는 `available = 0`과 별도 `shortage`로 반환한다.
- 클라이언트 preview와 서버 결과가 다르면 서버 snapshot으로 덮어쓴다.
- 공통 fixture를 JSON으로 관리해 TypeScript와 Java 계산 결과를 함께 검증한다.

## AI 계약

- 입력: 사용자 발화, 마스킹된 예산 요약, 필요한 도구 결과
- 출력: 버전이 있는 `PlanDraft` JSON
- 실패: 재요청 1회 후 사용자 확인 질문으로 전환
- 금지: 직접 DB 쓰기, 확정 상태 생성, 임의 금액 산술, 원거래·토큰 전송

## 플랫폼 경계

- Android 알림 수집은 `TransactionSource`의 Android 구현으로 둔다.
- iOS/Web은 PDF·캡처·직접 입력 구현을 사용한다.
- Refresh Token은 모바일 SecureStore, 웹 HttpOnly cookie에 저장한다.
- 백그라운드 동기화는 보조 수단이며 앱 시작·포그라운드 복귀·네트워크 복구 시 동기화를 실행한다.

## Production 전환 완료 조건

- Mock import가 production route에서 제거됨
- API/SQLite 오류와 오프라인 상태가 화면 상태로 표현됨
- outbox 재시도와 중복 요청 테스트 통과
- Java/TypeScript 예산 fixture 결과 일치
- AI DRAFT schema 및 사용자 확인 흐름 검증
- `demo/*` route가 production build에서 비활성화됨
