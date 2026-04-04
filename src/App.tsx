import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import type { UserInput, AppState } from './types'
import InputForm from './components/InputForm'
import ResultView from './components/ResultView'

// 카카오 SDK 초기화
function initKakao() {
  const Kakao = (window as unknown as Record<string, unknown>).Kakao as {
    init: (key: string) => void
    isInitialized: () => boolean
  } | undefined

  const key = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined
  if (Kakao && key && !Kakao.isInitialized()) {
    Kakao.init(key)
  }
}

export default function App() {
  const [state, setState] = useState<AppState>({ step: 'input' })

  useEffect(() => {
    initKakao()
  }, [])

  function handleSubmit(input: UserInput) {
    setState({ step: 'result', input })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setState({ step: 'input' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-8">
      {/* 헤더 */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          ✨ 금전운세
        </h1>
        <p className="text-indigo-200/60 text-sm">AI가 분석하는 나만의 금전운세</p>
      </header>

      {/* 메인 카드 */}
      <main className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 shadow-2xl">
          {state.step === 'input' ? (
            <InputForm onSubmit={handleSubmit} isLoading={false} />
          ) : (
            <ResultView input={state.input} onBack={handleBack} />
          )}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="mt-8 text-center">
        <p className="text-white/20 text-xs">
          &copy; 2026 금전운세. 엔터테인먼트 목적입니다.
        </p>
      </footer>

      <Analytics />
      <SpeedInsights />
    </div>
  )
}
