import type { WeeklyFortune } from '../types'
import ScoreGauge from './ScoreGauge'

interface WeeklyResultProps {
  fortune: WeeklyFortune
}

export default function WeeklyResult({ fortune }: WeeklyResultProps) {
  return (
    <div className="space-y-6">
      {/* 점수 */}
      <div className="flex justify-center">
        <ScoreGauge score={fortune.score} />
      </div>

      {/* 주간 요약 */}
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
        <p className="text-white/90 leading-relaxed text-center">{fortune.summary}</p>
      </div>

      {/* 상세 */}
      <div className="space-y-3">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-start gap-3">
          <span className="text-xl mt-0.5">💳</span>
          <div>
            <h4 className="text-indigo-200 font-medium text-sm mb-1">소비 운세</h4>
            <p className="text-white/70 text-sm leading-relaxed">{fortune.spendingTip}</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-start gap-3">
          <span className="text-xl mt-0.5">💎</span>
          <div>
            <h4 className="text-indigo-200 font-medium text-sm mb-1">저축 운세</h4>
            <p className="text-white/70 text-sm leading-relaxed">{fortune.savingTip}</p>
          </div>
        </div>

        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-400/20 flex items-start gap-3">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <h4 className="text-amber-200 font-medium text-sm mb-1">이번 주 주의</h4>
            <p className="text-white/70 text-sm leading-relaxed">{fortune.caution}</p>
          </div>
        </div>
      </div>

      {/* 행운 로또 번호 */}
      {fortune.lottoNumbers && (
        <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-400/20">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">🎱</span>
            <h4 className="text-purple-200 font-medium text-sm">이번 주 행운 로또 번호</h4>
          </div>
          <div className="flex justify-center gap-2">
            {fortune.lottoNumbers.map((num, i) => (
              <span
                key={i}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-gray-900 font-bold text-sm shadow-lg"
              >
                {num}
              </span>
            ))}
          </div>
          <p className="text-center text-xs text-white/30 mt-2">재미로만 참고하세요!</p>
        </div>
      )}
    </div>
  )
}
