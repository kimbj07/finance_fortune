/**
 * 음력 -> 양력 변환 유틸리티
 * lunar-javascript 라이브러리 기반
 */

// lunar-javascript 타입 정의
interface LunarInstance {
  getSolar(): SolarInstance;
}

interface SolarInstance {
  getYear(): number;
  getMonth(): number;
  getDay(): number;
}

interface LunarYear {
  getLeapMonth(): number;
  getMonth(month: number): LunarMonth | null;
}

interface LunarMonth {
  getDayCount(): number;
}

interface LunarStatic {
  fromYmd(year: number, month: number, day: number): LunarInstance;
}

interface LunarYearStatic {
  fromYear(year: number): LunarYear;
}

// lunar-javascript 동적 import (ESM 호환)
let Lunar: LunarStatic | null = null;
let LunarYear: LunarYearStatic | null = null;

async function getLunar(): Promise<LunarStatic> {
  if (!Lunar) {
    // @ts-ignore - lunar-javascript has no type definitions
    const lunarJs = await import('lunar-javascript');
    Lunar = lunarJs.Lunar as LunarStatic;
  }
  return Lunar;
}

async function getLunarYear(): Promise<LunarYearStatic> {
  if (!LunarYear) {
    // @ts-ignore - lunar-javascript has no type definitions
    const lunarJs = await import('lunar-javascript');
    LunarYear = lunarJs.LunarYear as LunarYearStatic;
  }
  return LunarYear;
}

export interface SolarDate {
  year: number;
  month: number;
  day: number;
}

export interface LunarConversionResult {
  success: true;
  solar: SolarDate;
}

export interface LunarConversionError {
  success: false;
  error: string;
}

export type LunarConversionResponse = LunarConversionResult | LunarConversionError;

/**
 * 음력 날짜를 양력으로 변환
 * @param year 음력 연도
 * @param month 음력 월 (1-12)
 * @param day 음력 일
 * @param isLeapMonth 윤달 여부
 * @returns 양력 날짜 또는 에러
 */
export async function convertLunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth: boolean = false
): Promise<LunarConversionResponse> {
  try {
    const LunarClass = await getLunar();

    // 윤달인 경우 음수로 월을 전달
    const lunarMonth = isLeapMonth ? -month : month;
    const lunar = LunarClass.fromYmd(year, lunarMonth, day);
    const solar = lunar.getSolar();

    return {
      success: true,
      solar: {
        year: solar.getYear(),
        month: solar.getMonth(),
        day: solar.getDay(),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return {
      success: false,
      error: `음력 변환 실패: ${message}`,
    };
  }
}

/**
 * 해당 연도에 윤달이 있는지 확인하고, 있으면 윤달 월 반환
 * @param year 음력 연도
 * @returns 윤달 월 (1-12) 또는 null (윤달 없음)
 */
export async function getLeapMonth(year: number): Promise<number | null> {
  try {
    const LunarYearClass = await getLunarYear();
    const lunarYear = LunarYearClass.fromYear(year);
    const leapMonth = lunarYear.getLeapMonth();
    return leapMonth > 0 ? leapMonth : null;
  } catch {
    return null;
  }
}

/**
 * 음력 월의 일수 반환
 * @param year 음력 연도
 * @param month 음력 월 (1-12)
 * @param isLeapMonth 윤달 여부
 * @returns 해당 월의 일수 (29 또는 30)
 */
export async function getLunarDaysInMonth(
  year: number,
  month: number,
  isLeapMonth: boolean = false
): Promise<number> {
  try {
    const LunarYearClass = await getLunarYear();
    const lunarYear = LunarYearClass.fromYear(year);

    // 윤달인 경우 음수로 월을 전달
    const lunarMonth = isLeapMonth ? -month : month;
    const monthObj = lunarYear.getMonth(lunarMonth);

    if (monthObj) {
      return monthObj.getDayCount();
    }
    // 기본값: 30일
    return 30;
  } catch {
    // 기본값: 30일
    return 30;
  }
}
