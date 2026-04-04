import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  convertLunarToSolar,
  getLeapMonth,
  getLunarDaysInMonth,
} from '../../lib/lunar-converter'
import { getDaysInMonth } from '../../lib/constants'

interface UseLunarDatePickerResult {
  birthYear: string
  birthMonth: string
  birthDay: string
  isLunar: boolean
  isLeapMonth: boolean
  leapMonth: number | null
  dateError: string
  daysInMonth: number[]
  setBirthYear: (year: string) => void
  setBirthMonth: (month: string) => void
  setBirthDay: (day: string) => void
  setIsLunar: (isLunar: boolean) => void
  setIsLeapMonth: (isLeapMonth: boolean) => void
  setDateError: (error: string) => void
  getSolarDate: () => Promise<{ year: string; month: string; day: string } | null>
  validateFutureDate: () => boolean
}

function checkFutureDate(year: string, month: string, day: string): string | null {
  if (!year || !month || !day) return null
  const selectedDate = new Date(Number(year), Number(month) - 1, Number(day))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return selectedDate > today ? '미래 날짜는 선택할 수 없어요!' : null
}

export function useLunarDatePicker(): UseLunarDatePickerResult {
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [isLunar, setIsLunarState] = useState(false)
  const [isLeapMonth, setIsLeapMonth] = useState(false)
  const [leapMonth, setLeapMonth] = useState<number | null>(null)
  const [lunarDays, setLunarDays] = useState<number[]>([])
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    if (isLunar && birthYear) {
      getLeapMonth(Number(birthYear)).then(setLeapMonth)
    } else {
      setLeapMonth(null)
    }
    setIsLeapMonth(false)
  }, [isLunar, birthYear])

  useEffect(() => {
    if (isLunar && birthYear && birthMonth) {
      const shouldBeLeapMonth = isLeapMonth && leapMonth === Number(birthMonth)
      getLunarDaysInMonth(Number(birthYear), Number(birthMonth), shouldBeLeapMonth)
        .then(days => {
          setLunarDays(Array.from({ length: days }, (_, i) => i + 1))
        })
    }
  }, [isLunar, birthYear, birthMonth, isLeapMonth, leapMonth])

  const solarDaysInMonth = useMemo(() => {
    const maxDays = getDaysInMonth(Number(birthYear), Number(birthMonth))
    return Array.from({ length: maxDays }, (_, i) => i + 1)
  }, [birthYear, birthMonth])

  const daysInMonth = useMemo(() => {
    return isLunar && lunarDays.length > 0 ? lunarDays : solarDaysInMonth
  }, [isLunar, lunarDays, solarDaysInMonth])

  useEffect(() => {
    if (birthDay && Number(birthDay) > daysInMonth.length) {
      setBirthDay('')
    }
  }, [daysInMonth.length, birthDay])

  const handleYearChange = useCallback((year: string) => {
    setBirthYear(year)
    setDateError('')
  }, [])

  const handleMonthChange = useCallback((month: string) => {
    setBirthMonth(month)
    setDateError('')
  }, [])

  const handleDayChange = useCallback((day: string) => {
    setBirthDay(day)
    setDateError('')
  }, [])

  const handleSetIsLunar = useCallback((lunar: boolean) => {
    setIsLunarState(lunar)
    setIsLeapMonth(false)
    setBirthDay('')
    setDateError('')
  }, [])

  const validateFutureDate = useCallback((): boolean => {
    const error = checkFutureDate(birthYear, birthMonth, birthDay)
    if (error) {
      setDateError(error)
      return false
    }
    setDateError('')
    return true
  }, [birthYear, birthMonth, birthDay])

  const getSolarDate = useCallback(async () => {
    if (!birthYear || !birthMonth || !birthDay) return null

    if (isLunar) {
      const shouldBeLeapMonth = isLeapMonth && leapMonth === Number(birthMonth)
      const result = await convertLunarToSolar(
        Number(birthYear), Number(birthMonth), Number(birthDay), shouldBeLeapMonth
      )
      if (!result.success) {
        setDateError(result.error)
        return null
      }
      setDateError('')
      return {
        year: String(result.solar.year),
        month: String(result.solar.month),
        day: String(result.solar.day),
      }
    }

    return { year: birthYear, month: birthMonth, day: birthDay }
  }, [birthYear, birthMonth, birthDay, isLunar, isLeapMonth, leapMonth])

  return {
    birthYear, birthMonth, birthDay,
    isLunar, isLeapMonth, leapMonth, dateError, daysInMonth,
    setBirthYear: handleYearChange,
    setBirthMonth: handleMonthChange,
    setBirthDay: handleDayChange,
    setIsLunar: handleSetIsLunar,
    setIsLeapMonth, setDateError,
    getSolarDate, validateFutureDate,
  }
}
