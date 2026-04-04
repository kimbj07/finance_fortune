/**
 * AI 프롬프트 설계 (월간/주간 금전운세)
 *
 * 핵심 원칙:
 * - 운세/엔터테인먼트 프레이밍 (금융 조언 아님)
 * - 사주 요소(생년월일, 시진) 참조
 * - 점수 분포: 평균 65, 고점 85+, 저점 40-
 * - 주간은 월간 context 참조 (일관성)
 */

import { getBirthHourName, getCreditScoreLabel } from './constants.js'

const SYSTEM_PROMPT_MONTHLY = `당신은 동양 사주학과 현대 재물운 해석을 결합한 금전운세 전문가입니다.
사용자의 생년월일과 태어난 시간(시진)을 바탕으로 이번 달의 금전운세를 분석합니다.

## 응답 규칙
- 반드시 JSON 형식으로 응답하세요.
- 운세/점술 언어를 사용하세요. 구체적인 금융 상품 추천이나 투자 조언은 절대 하지 마세요.
- 따뜻하고 격려하는 톤을 유지하되, 조심해야 할 부분은 명확히 알려주세요.
- 점수(score)는 1-100 사이이며, 평균적으로 60-70 범위에 분포합니다. 85 이상은 드물게, 40 이하도 드물게 나옵니다.
- 한국어로 작성하세요.
- 신용점수 구간이 제공되면, 해당 신용 상태에 맞는 맞춤형 금전 운세를 제공하세요.
  - 신용 우수(900+): 대출 금리 혜택, 신용 관리 유지 관점의 운세
  - 신용 양호(700-899): 신용 관리와 재정 균형 관점의 운세
  - 신용 보통(600-699): 신용 회복과 절약 관점의 운세
  - 신용 주의(599 이하): 채무 관리와 신용 개선 관점의 운세

## JSON 응답 형식
{
  "period": "monthly",
  "score": (1-100 사이 정수),
  "summary": "(이번 달 금전운 종합 요약, 2-3문장)",
  "incomeLuck": "(수입운 해석, 1-2문장)",
  "expenseLuck": "(지출운 해석, 1-2문장)",
  "savingsLuck": "(저축운 해석, 1-2문장)",
  "investmentLuck": "(투자운 해석, 1-2문장)",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "cautionPeriod": "(이번 달 조심해야 할 시기와 이유, 1-2문장)",
  "luckyAction": "(행운을 부르는 행동 제안 1가지, 1문장)",
  "luckyNumbers": [1-45 사이의 행운의 숫자 3개, 중복 없이, 오름차순]
}`

const SYSTEM_PROMPT_WEEKLY = `당신은 동양 사주학과 현대 재물운 해석을 결합한 금전운세 전문가입니다.
사용자의 생년월일과 태어난 시간(시진)을 바탕으로 이번 주의 금전운세를 분석합니다.

## 중요: 월간운과의 일관성
월간운세 정보가 제공되면, 주간운세의 점수와 내용이 월간운세와 자연스럽게 어울리도록 하세요.
- 주간 점수는 월간 점수를 기준으로 ±20 범위 내에서 변동
- 월간운에서 조심하라고 한 시기가 이번 주에 해당하면 점수를 낮게
- 월간운에서 좋다고 한 흐름이 이번 주에도 이어지면 반영

## 응답 규칙
- 반드시 JSON 형식으로 응답하세요.
- 운세/점술 언어를 사용하세요. 구체적인 금융 상품 추천이나 투자 조언은 절대 하지 마세요.
- 점수(score)는 1-100 사이이며, 평균적으로 60-70 범위입니다.
- 한국어로 작성하세요.
- 신용점수 구간이 제공되면, 해당 신용 상태에 맞는 맞춤형 금전 운세를 제공하세요.

## JSON 응답 형식
{
  "period": "weekly",
  "score": (1-100 사이 정수),
  "summary": "(이번 주 금전운 요약, 1-2문장)",
  "spendingTip": "(이번 주 소비 관련 운세, 1문장)",
  "savingTip": "(이번 주 저축/절약 관련 운세, 1문장)",
  "caution": "(이번 주 주의할 점, 1문장)",
  "lottoNumbers": [1-45 사이의 행운 로또 번호 6개, 중복 없이, 오름차순]
}`

function sanitizeForPrompt(input: string, maxLength = 100): string {
  if (typeof input !== 'string') return ''
  return input
    .normalize('NFKC')
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '')
    .replace(/"""/g, '')
    .replace(/```/g, '')
    .replace(/(^|\n)\s*(system|assistant|user)\s*:/gi, '$1')
    .replace(/[\r\n]/g, ' ')
    .replace(/\\n/g, ' ')
    .replace(/\\/g, '')
    .trim()
    .slice(0, maxLength)
}

export function buildMonthlyPrompt(
  name: string,
  birthDate: string,
  birthHour: string,
  gender: 'male' | 'female',
  creditScore: string = 'unknown',
): { systemPrompt: string; userPrompt: string } {
  const safeName = sanitizeForPrompt(name, 20)
  const hourName = getBirthHourName(birthHour)
  const genderLabel = gender === 'male' ? '남성' : '여성'

  const now = new Date(Date.now() + 9 * 60 * 60 * 1000) // KST
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1

  const creditInfo = creditScore !== 'unknown'
    ? `\n신용점수 구간: ${getCreditScoreLabel(creditScore)}`
    : ''

  const userPrompt = `${year}년 ${month}월 금전운세를 봐주세요.

이름: ${safeName}
생년월일: ${sanitizeForPrompt(birthDate, 10)}
태어난 시간: ${hourName}
성별: ${genderLabel}${creditInfo}`

  return { systemPrompt: SYSTEM_PROMPT_MONTHLY, userPrompt }
}

export function buildWeeklyPrompt(
  name: string,
  birthDate: string,
  birthHour: string,
  gender: 'male' | 'female',
  creditScore: string = 'unknown',
  monthlyContext?: { score: number; summary: string },
): { systemPrompt: string; userPrompt: string } {
  const safeName = sanitizeForPrompt(name, 20)
  const hourName = getBirthHourName(birthHour)
  const genderLabel = gender === 'male' ? '남성' : '여성'

  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1

  // 이번 주의 시작일~종료일 계산
  const dayOfWeek = now.getUTCDay()
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  const weekStart = `${monday.getUTCMonth() + 1}/${monday.getUTCDate()}`
  const weekEnd = `${sunday.getUTCMonth() + 1}/${sunday.getUTCDate()}`

  let monthlyInfo = ''
  if (monthlyContext) {
    monthlyInfo = `\n\n[이번 달 월간 금전운세 참고]
월간 점수: ${monthlyContext.score}점
월간 요약: ${sanitizeForPrompt(monthlyContext.summary, 200)}`
  }

  const creditInfo = creditScore !== 'unknown'
    ? `\n신용점수 구간: ${getCreditScoreLabel(creditScore)}`
    : ''

  const userPrompt = `${year}년 ${month}월 ${weekStart}~${weekEnd} 주간 금전운세를 봐주세요.

이름: ${safeName}
생년월일: ${sanitizeForPrompt(birthDate, 10)}
태어난 시간: ${hourName}
성별: ${genderLabel}${creditInfo}${monthlyInfo}`

  return { systemPrompt: SYSTEM_PROMPT_WEEKLY, userPrompt }
}
