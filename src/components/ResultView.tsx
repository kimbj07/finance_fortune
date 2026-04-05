import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { domToPng } from 'modern-screenshot'
import type { UserInput, MonthlyFortune, WeeklyFortune, LoanFortune, FortuneResponse } from '../types'
import { fetchFortune } from '../services/api'
import { getSessionId } from '../utils/session'
import { CREDIT_SCORE_RANGES } from '../../lib/constants'
import MonthlyResult from './MonthlyResult'
import WeeklyResult from './WeeklyResult'
import LoanResult from './LoanResult'
import LoadingScreen from './LoadingScreen'
import ErrorScreen from './ErrorScreen'

interface ResultViewProps {
  input: UserInput
  onBack: () => void
}

function buildBirthDate(input: UserInput): string {
  const m = String(input.birthMonth).padStart(2, '0')
  const d = String(input.birthDay).padStart(2, '0')
  return `${input.birthYear}-${m}-${d}`
}

/** PII를 해시하여 React Query 캐시 키에서 평문 노출 방지 */
function hashForQueryKey(input: UserInput, birthDate: string): string {
  const raw = `${input.name}|${birthDate}|${input.birthHour}|${input.gender}|${input.creditScore}`
  return btoa(encodeURIComponent(raw)).slice(0, 24)
}

export default function ResultView({ input, onBack }: ResultViewProps) {
  const [activeTab, setActiveTab] = useState<'monthly' | 'weekly' | 'loan'>('monthly')
  const resultRef = useRef<HTMLDivElement>(null)

  const birthDate = buildBirthDate(input)
  const sessionId = getSessionId()

  // 월간 운세 fetch
  const monthly = useQuery({
    queryKey: ['fortune', 'monthly', hashForQueryKey(input, birthDate)],
    queryFn: () => fetchFortune({
      name: input.name,
      birthDate,
      birthHour: input.birthHour,
      gender: input.gender,
      creditScore: input.creditScore,
      period: 'monthly',
      sessionId,
    }),
  })

  // 주간 운세 fetch (월간 결과를 context로 전달)
  const monthlyResult = monthly.data?.result as MonthlyFortune | undefined
  const weekly = useQuery({
    queryKey: ['fortune', 'weekly', hashForQueryKey(input, birthDate)],
    queryFn: () => fetchFortune({
      name: input.name,
      birthDate,
      birthHour: input.birthHour,
      gender: input.gender,
      creditScore: input.creditScore,
      period: 'weekly',
      sessionId,
      monthlyContext: monthlyResult
        ? { score: monthlyResult.score, summary: monthlyResult.summary }
        : undefined,
    }),
    enabled: !!monthly.data, // 월간 완료 후 주간 요청
  })

  // 대출운 fetch
  const loan = useQuery({
    queryKey: ['fortune', 'loan', hashForQueryKey(input, birthDate)],
    queryFn: () => fetchFortune({
      name: input.name,
      birthDate,
      birthHour: input.birthHour,
      gender: input.gender,
      creditScore: input.creditScore,
      period: 'loan',
      sessionId,
    }),
    enabled: activeTab === 'loan', // 탭 클릭 시에만 요청
  })

  const currentQuery = activeTab === 'monthly' ? monthly : activeTab === 'weekly' ? weekly : loan
  const currentData: FortuneResponse | undefined = currentQuery.data
  const currentLoading = currentQuery.isLoading
  const currentError = currentQuery.error
  const currentRefetch = currentQuery.refetch

  // 이미지 다운로드
  const handleDownload = useCallback(async () => {
    if (!resultRef.current) return
    try {
      const dataUrl = await domToPng(resultRef.current, {
        scale: 2,
        backgroundColor: '#1e1b4b',
      })
      const link = document.createElement('a')
      const tabLabel = activeTab === 'monthly' ? '월간' : activeTab === 'weekly' ? '주간' : '대출운'
      link.download = `금전운세_${input.name}_${tabLabel}_${new Date().toISOString().slice(0,7)}.png`
      link.href = dataUrl
      link.click()
    } catch {
      // silent fail
    }
  }, [input.name, activeTab])

  // 카카오 공유 (서비스 링크)
  const handleKakaoShare = useCallback(() => {
    const Kakao = (window as unknown as Record<string, unknown>).Kakao as {
      isInitialized: () => boolean
      Share: { sendDefault: (config: unknown) => void }
    } | undefined

    if (!Kakao?.isInitialized?.()) return

    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '금전운세 - AI 금전운세',
        description: 'AI가 분석하는 나만의 금전운세! 이번 달 나의 금전운은?',
        imageUrl: `${window.location.origin}/og-image.png`,
        link: {
          mobileWebUrl: window.location.origin,
          webUrl: window.location.origin,
        },
      },
      buttons: [
        {
          title: '나도 금전운세 보기',
          link: {
            mobileWebUrl: window.location.origin,
            webUrl: window.location.origin,
          },
        },
      ],
    })
  }, [])

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'monthly'
              ? 'bg-indigo-500 text-white shadow'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          월간 운세
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'weekly'
              ? 'bg-indigo-500 text-white shadow'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          주간 운세
        </button>
        <button
          onClick={() => setActiveTab('loan')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'loan'
              ? 'bg-teal-500 text-white shadow'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          대출운
        </button>
      </div>

      {/* 결과 영역 */}
      {currentLoading ? (
        <LoadingScreen />
      ) : currentError ? (
        <ErrorScreen
          message={currentError instanceof Error ? currentError.message : '오류가 발생했습니다'}
          onRetry={() => { void currentRefetch() }}
        />
      ) : currentData ? (
        <>
          <div ref={resultRef} className="p-1">
            {/* 유저 정보 헤더 */}
            <div className="text-center mb-4">
              <h2 className="text-white font-bold text-lg">
                {input.name}님의 {activeTab === 'monthly' ? '월간' : activeTab === 'weekly' ? '주간' : '대출'} {activeTab === 'loan' ? '운세' : '금전운세'}
              </h2>
              <p className="text-white/40 text-xs mt-1">
                {input.birthYear}년 {input.birthMonth}월 {input.birthDay}일생
              </p>
              {input.creditScore !== 'unknown' && (
                <CreditScoreBadge creditScore={input.creditScore} />
              )}
            </div>

            {activeTab === 'monthly' && currentData.result.period === 'monthly' ? (
              <MonthlyResult fortune={currentData.result as MonthlyFortune} />
            ) : activeTab === 'weekly' && currentData.result.period === 'weekly' ? (
              <WeeklyResult fortune={currentData.result as WeeklyFortune} />
            ) : activeTab === 'loan' && currentData.result.period === 'loan' ? (
              <LoanResult fortune={currentData.result as LoanFortune} />
            ) : null}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleDownload}
              className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 text-white/80 text-sm font-medium hover:bg-white/20 transition flex items-center justify-center gap-2"
            >
              <span>📷</span> 이미지 저장
            </button>
            <button
              onClick={handleKakaoShare}
              className="flex-1 py-3 rounded-xl bg-yellow-400/90 text-gray-900 text-sm font-bold hover:bg-yellow-400 transition flex items-center justify-center gap-2"
            >
              <span>💬</span> 친구에게 추천
            </button>
          </div>
        </>
      ) : null}

      {/* 다시 보기 */}
      <button
        onClick={onBack}
        className="w-full py-3 text-white/40 text-sm hover:text-white/60 transition"
      >
        다른 운세 보기
      </button>

      {/* 면책 */}
      <p className="text-center text-xs text-white/20 pb-4">
        본 서비스는 엔터테인먼트 목적이며 전문 금융 자문이 아닙니다.
      </p>
    </div>
  )
}

const CREDIT_BADGE_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  '900-1000': { bg: 'bg-emerald-500/15', border: 'border-emerald-400/30', text: 'text-emerald-200', label: '신용 우수' },
  '800-899': { bg: 'bg-blue-500/15', border: 'border-blue-400/30', text: 'text-blue-200', label: '신용 양호' },
  '700-799': { bg: 'bg-blue-500/15', border: 'border-blue-400/30', text: 'text-blue-200', label: '신용 양호' },
  '600-699': { bg: 'bg-yellow-500/15', border: 'border-yellow-400/30', text: 'text-yellow-200', label: '신용 보통' },
  '500-599': { bg: 'bg-orange-500/15', border: 'border-orange-400/30', text: 'text-orange-200', label: '신용 주의' },
  '0-499': { bg: 'bg-red-500/15', border: 'border-red-400/30', text: 'text-red-200', label: '신용 위험' },
}

function CreditScoreBadge({ creditScore }: { creditScore: string }) {
  const style = CREDIT_BADGE_STYLES[creditScore]
  if (!style) return null

  const range = CREDIT_SCORE_RANGES.find(r => r.value === creditScore)
  const scoreText = range ? range.value.replace('-', '~') + '점' : ''

  return (
    <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full ${style.bg} border ${style.border}`}>
      <span className="text-xs">📊</span>
      <span className={`text-xs font-medium ${style.text}`}>
        {style.label} ({scoreText}) 기준 맞춤 분석
      </span>
    </div>
  )
}
