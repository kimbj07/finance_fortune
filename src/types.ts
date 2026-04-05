/** 사용자 입력 정보 */
export interface UserInput {
  name: string
  birthYear: number
  birthMonth: number
  birthDay: number
  gender: 'male' | 'female'
  birthHour: string // 12시진 value or 'unknown'
  creditScore: string // 신용점수 구간 or 'unknown'
}

/** API 요청 바디 */
export interface FortuneRequest {
  name: string
  birthDate: string // YYYY-MM-DD
  birthHour: string
  gender: 'male' | 'female'
  creditScore: string // 신용점수 구간 or 'unknown'
  period: 'monthly' | 'weekly' | 'loan'
  sessionId: string
  /** 주간 운세 생성 시 월간 운세 context (일관성 유지용) */
  monthlyContext?: {
    score: number
    summary: string
  }
}

/** 월간 운세 결과 */
export interface MonthlyFortune {
  period: 'monthly'
  score: number
  summary: string
  incomeLuck: string
  expenseLuck: string
  savingsLuck: string
  investmentLuck: string
  keywords: [string, string, string]
  cautionPeriod: string
  luckyAction: string
  luckyNumbers: [number, number, number]
}

/** 주간 운세 결과 */
export interface WeeklyFortune {
  period: 'weekly'
  score: number
  summary: string
  spendingTip: string
  savingTip: string
  caution: string
  lottoNumbers: [number, number, number, number, number, number]
}

/** 대출운 결과 */
export interface LoanFortune {
  period: 'loan'
  score: number
  summary: string
  timingLuck: string
  rateLuck: string
  repaymentLuck: string
  cautionPoint: string
  luckyAction: string
  keywords: [string, string, string]
}

export type FortuneResult = MonthlyFortune | WeeklyFortune | LoanFortune

/** API 응답 */
export interface FortuneResponse {
  result: FortuneResult
  cached: boolean
}

/** API 에러 응답 */
export interface FortuneError {
  error: string
}

/** 앱 상태 */
export type AppState =
  | { step: 'input' }
  | { step: 'loading'; input: UserInput }
  | { step: 'result'; input: UserInput }
