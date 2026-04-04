import { useState } from 'react'
import type { UserInput } from '../types'
import { BIRTH_HOURS, YEARS, MONTHS, CREDIT_SCORE_RANGES } from '../../lib/constants'
import { useLunarDatePicker } from '../hooks/useLunarDatePicker'

interface InputFormProps {
  onSubmit: (input: UserInput) => void
  isLoading: boolean
}

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [birthHour, setBirthHour] = useState('unknown')
  const [creditScore, setCreditScore] = useState('unknown')

  const {
    birthYear, birthMonth, birthDay,
    isLunar, isLeapMonth, leapMonth, dateError, daysInMonth,
    setBirthYear, setBirthMonth, setBirthDay,
    setIsLunar, setIsLeapMonth,
    getSolarDate, validateFutureDate,
  } = useLunarDatePicker()

  const isValid = name.trim() && birthYear && birthMonth && birthDay && gender

  const selectClass = "px-3 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition appearance-none"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || !gender) return

    if (!validateFutureDate()) return

    // 음력이면 양력으로 변환
    const solarDate = await getSolarDate()
    if (!solarDate) return

    onSubmit({
      name: name.trim(),
      birthYear: Number(solarDate.year),
      birthMonth: Number(solarDate.month),
      birthDay: Number(solarDate.day),
      gender,
      birthHour,
      creditScore,
    })
  }

  return (
    <form onSubmit={e => { void handleSubmit(e) }} className="space-y-6">
      {/* 이름 */}
      <div>
        <label className="block text-sm font-medium text-indigo-200 mb-2">이름</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          maxLength={20}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
        />
      </div>

      {/* 생년월일 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-indigo-200">생년월일</label>
          <div className="flex rounded-lg overflow-hidden border border-white/20">
            <button
              type="button"
              onClick={() => setIsLunar(false)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                !isLunar ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              양력
            </button>
            <button
              type="button"
              onClick={() => setIsLunar(true)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                isLunar ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              음력
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <select value={birthYear} onChange={e => setBirthYear(e.target.value)} className={selectClass}>
            <option value="" className="text-gray-900">년도</option>
            {YEARS.map(y => (
              <option key={y} value={String(y)} className="text-gray-900">{y}년</option>
            ))}
          </select>
          <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)} className={selectClass}>
            <option value="" className="text-gray-900">월</option>
            {MONTHS.map(m => (
              <option key={m} value={String(m)} className="text-gray-900">{m}월</option>
            ))}
          </select>
          <select value={birthDay} onChange={e => setBirthDay(e.target.value)} className={selectClass}>
            <option value="" className="text-gray-900">일</option>
            {daysInMonth.map(d => (
              <option key={d} value={String(d)} className="text-gray-900">{d}일</option>
            ))}
          </select>
        </div>

        {/* 윤달 체크박스 */}
        {isLunar && leapMonth !== null && birthMonth && Number(birthMonth) === leapMonth && (
          <label className="flex items-center gap-2 mt-2 text-sm text-indigo-200/70 cursor-pointer">
            <input
              type="checkbox"
              checked={isLeapMonth}
              onChange={e => setIsLeapMonth(e.target.checked)}
              className="w-4 h-4 rounded border-white/30 text-indigo-500 focus:ring-indigo-400"
            />
            윤달 (윤{leapMonth}월)
          </label>
        )}

        {dateError && (
          <p className="text-red-400 text-sm mt-2">{dateError}</p>
        )}
      </div>

      {/* 성별 */}
      <div>
        <label className="block text-sm font-medium text-indigo-200 mb-2">성별</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGender('male')}
            className={`py-3 rounded-xl border transition font-medium ${
              gender === 'male'
                ? 'bg-indigo-500 border-indigo-400 text-white'
                : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
            }`}
          >
            남성
          </button>
          <button
            type="button"
            onClick={() => setGender('female')}
            className={`py-3 rounded-xl border transition font-medium ${
              gender === 'female'
                ? 'bg-indigo-500 border-indigo-400 text-white'
                : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
            }`}
          >
            여성
          </button>
        </div>
      </div>

      {/* 태어난 시간 (옵셔널) */}
      <div>
        <label className="block text-sm font-medium text-indigo-200 mb-2">
          태어난 시간 <span className="text-white/40">(선택)</span>
        </label>
        <select
          value={birthHour}
          onChange={e => setBirthHour(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition appearance-none"
        >
          {BIRTH_HOURS.map(h => (
            <option key={h.value} value={h.value} className="text-gray-900">
              {h.label}
            </option>
          ))}
        </select>
      </div>

      {/* 신용점수 (옵셔널) */}
      <div>
        <label className="block text-sm font-medium text-indigo-200 mb-2">
          신용점수 <span className="text-white/40">(선택)</span>
        </label>
        <select
          value={creditScore}
          onChange={e => setCreditScore(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition appearance-none"
        >
          {CREDIT_SCORE_RANGES.map(r => (
            <option key={r.value} value={r.value} className="text-gray-900">
              {r.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-white/30 mt-1">신용점수를 입력하면 더 정확한 금전운세를 받을 수 있어요</p>
      </div>

      {/* 제출 */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">&#10024;</span>
            운세를 읽는 중...
          </span>
        ) : (
          '나의 금전운세 보기 ✨'
        )}
      </button>

      {/* 면책 */}
      <p className="text-center text-xs text-white/30 mt-4">
        본 서비스는 엔터테인먼트 목적이며 전문 금융 자문이 아닙니다.
      </p>
    </form>
  )
}
