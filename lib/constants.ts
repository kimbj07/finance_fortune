/**
 * 공유 상수 (서버 + 클라이언트)
 */

/** 12시진 (태어난 시간) */
export const BIRTH_HOURS = [
  { value: 'unknown', label: '모름', name: '모름' },
  { value: '0', label: '子(자) 23:30~01:29', name: '자시(子時)' },
  { value: '2', label: '丑(축) 01:30~03:29', name: '축시(丑時)' },
  { value: '4', label: '寅(인) 03:30~05:29', name: '인시(寅時)' },
  { value: '6', label: '卯(묘) 05:30~07:29', name: '묘시(卯時)' },
  { value: '8', label: '辰(진) 07:30~09:29', name: '진시(辰時)' },
  { value: '10', label: '巳(사) 09:30~11:29', name: '사시(巳時)' },
  { value: '12', label: '午(오) 11:30~13:29', name: '오시(午時)' },
  { value: '14', label: '未(미) 13:30~15:29', name: '미시(未時)' },
  { value: '16', label: '申(신) 15:30~17:29', name: '신시(申時)' },
  { value: '18', label: '酉(유) 17:30~19:29', name: '유시(酉時)' },
  { value: '20', label: '戌(술) 19:30~21:29', name: '술시(戌時)' },
  { value: '22', label: '亥(해) 21:30~23:29', name: '해시(亥時)' },
] as const

export const BIRTH_HOUR_VALUES = BIRTH_HOURS.map(h => h.value)

export function getBirthHourLabel(value: string): string {
  return BIRTH_HOURS.find(h => h.value === value)?.label || '모름'
}

export function getBirthHourName(value: string): string {
  return BIRTH_HOURS.find(h => h.value === value)?.name || '모름'
}

/** 신용점수 구간 */
export const CREDIT_SCORE_RANGES = [
  { value: 'unknown', label: '모름 / 선택 안 함' },
  { value: '900-1000', label: '900~1000점 (1~3등급, 우수)' },
  { value: '800-899', label: '800~899점 (4등급, 양호)' },
  { value: '700-799', label: '700~799점 (5등급, 양호)' },
  { value: '600-699', label: '600~699점 (6~7등급, 보통)' },
  { value: '500-599', label: '500~599점 (8등급, 주의)' },
  { value: '0-499', label: '499점 이하 (9~10등급, 위험)' },
] as const

export function getCreditScoreLabel(value: string): string {
  return CREDIT_SCORE_RANGES.find(r => r.value === value)?.label || '모름'
}

/** 연도 옵션 (최근 81년) */
const currentYear = new Date().getFullYear()
export const YEARS = Array.from({ length: 81 }, (_, i) => currentYear - i)
export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export function getDaysInMonth(year: number, month: number): number {
  if (!year || !month) return 31
  return new Date(year, month, 0).getDate()
}
