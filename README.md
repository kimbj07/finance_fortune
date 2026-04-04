# 금전운세 - AI 금전운세 서비스

AI가 사주와 신용점수를 기반으로 분석하는 개인 맞춤형 금전운세 서비스.

**라이브**: https://financefortune.vercel.app

## 주요 기능

- **월간 금전운세**: 수입운, 지출운, 저축운, 투자운, 키워드, 주의 시기, 행운의 행동
- **주간 금전운세**: 소비 운세, 저축 운세, 주의사항 (월간운과 일관성 유지)
- **신용점수 기반 맞춤 조언**: NICE 신용등급 체계(1000점 만점) 기반, 신용 상태에 맞는 금전 운세 제공
- **음력/양력 지원**: 윤달 포함 음력 날짜 입력 가능 (lunar-javascript 라이브러리)
- **사주 시간(시진) 지원**: 12시진 선택으로 더 정밀한 운세
- **카카오톡 공유**: 서비스 링크 카카오톡 공유
- **이미지 저장**: 운세 결과를 이미지로 다운로드 (소장용)
- **캐시**: 동일 입력은 월별/주별로 캐시되어 일관된 결과 제공

## 기술 스택

- **Frontend**: React 19 + TypeScript + Vite 7
- **Styling**: Tailwind CSS v4
- **AI**: OpenAI API (gpt-4o-mini)
- **Cache**: Upstash Redis (SHA-256 해시 키, PII 보호)
- **Rate Limiting**: @upstash/ratelimit (IP당 5회/분)
- **일일 예산**: Redis 카운터 (일일 2만 건 상한)
- **공유**: Kakao SDK + modern-screenshot
- **분석**: Vercel Analytics + Speed Insights
- **배포**: Vercel (Docker 로컬 개발)

## 프로젝트 구조

```
finance_fortune/
├── api/fortune.ts           # API 엔드포인트 (월간/주간 통합, period 파라미터)
├── lib/
│   ├── api-utils.ts         # CORS, IP 추출, Rate limit 래퍼
│   ├── budget.ts            # 일일 OpenAI 예산 관리
│   ├── cache.ts             # Upstash Redis 캐시 (월별/주별 TTL)
│   ├── constants.ts         # 12시진, 신용점수 구간, 날짜 유틸
│   ├── logger.ts            # Pino 구조화 로깅
│   ├── lunar-converter.ts   # 음력→양력 변환 (lunar-javascript)
│   ├── prompts.ts           # AI 시스템/유저 프롬프트 (월간/주간)
│   ├── rate-limit.ts        # IP당 분당 5회 제한
│   └── types.ts             # 서버 타입
├── src/
│   ├── App.tsx              # 메인 앱 (입력→결과 전환)
│   ├── main.tsx             # React 엔트리
│   ├── types.ts             # 클라이언트 타입
│   ├── components/
│   │   ├── InputForm.tsx    # 입력 폼 (이름, 생년월일, 음력/양력, 성별, 시진, 신용점수)
│   │   ├── ResultView.tsx   # 결과 (월간/주간 탭, 이미지 저장, 카카오 공유)
│   │   ├── MonthlyResult.tsx # 월간 운세 카드
│   │   ├── WeeklyResult.tsx  # 주간 운세 카드
│   │   ├── ScoreGauge.tsx   # 원형 점수 게이지
│   │   ├── LoadingScreen.tsx # 운세풍 로딩 애니메이션
│   │   └── ErrorScreen.tsx  # 운세풍 에러 + 재시도
│   ├── hooks/
│   │   └── useLunarDatePicker.ts # 음력/양력 날짜 선택 훅
│   ├── services/api.ts      # API 클라이언트
│   └── utils/session.ts     # 익명 세션 (localStorage UUID)
├── public/
│   ├── og-image.png         # SNS 공유 미리보기 (1200x630)
│   ├── app-icon-512.png     # 앱 아이콘 (512x512)
│   ├── app-icon-512.jpg     # 카카오앱 등록용 (<250KB)
│   ├── icon-192.png         # favicon (192x192)
│   └── favicon.svg          # SVG favicon
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 신용점수 기반 맞춤 조언

| 신용점수 구간 | NICE 등급 | 조언 관점 |
|-------------|----------|---------|
| 900~1000점 | 1~3등급 (우수) | 금리 혜택, 신용 유지 관리 |
| 800~899점 | 4등급 (양호) | 신용 관리, 재정 균형 |
| 700~799점 | 5등급 (양호) | 신용 관리, 재정 균형 |
| 600~699점 | 6~7등급 (보통) | 신용 회복, 절약 |
| 500~599점 | 8등급 (주의) | 채무 관리, 신용 개선 |
| 499점 이하 | 9~10등급 (위험) | 채무 관리, 신용 개선 |

## 로컬 개발

### Docker (권장)

```bash
cp .env.example .env    # 환경변수 설정
docker compose up       # 서버 시작 (localhost:3000)
```

### 직접 실행

```bash
npm install
npx vite                # 프론트엔드만 (localhost:5173)
vercel dev              # API 포함 (localhost:3000)
```

## 환경변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `OPENAI_API_KEY` | Y | OpenAI API 키 |
| `UPSTASH_REDIS_REST_URL` | N | Upstash Redis URL (캐시/Rate limit) |
| `UPSTASH_REDIS_REST_TOKEN` | N | Upstash Redis 토큰 |
| `VITE_KAKAO_JS_KEY` | N | 카카오 JavaScript 키 (공유 기능) |
| `VITE_SITE_URL` | N | 사이트 URL |
| `VERCEL_TOKEN` | N | Docker 환경 vercel dev용 |

## 캐시 정책

- **월간 운세**: 해당 월 마지막 날까지 (KST)
- **주간 운세**: 해당 주 일요일 23:59:59까지 (KST)
- **캐시 키**: SHA-256 해시 (이름, 생년월일, 시진, 성별, 신용점수, 기간)
- PII가 캐시 키에 노출되지 않음

## 법적 고지

본 서비스는 엔터테인먼트 목적이며 전문 금융 자문이 아닙니다.
NICE 신용정보 API를 직접 연동하지 않으며, 사용자가 자발적으로 입력한 신용점수 구간만을 참고합니다.
