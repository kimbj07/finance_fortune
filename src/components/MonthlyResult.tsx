import type { MonthlyFortune } from '../types'
import ScoreGauge from './ScoreGauge'
import LuckCard from './LuckCard'

interface MonthlyResultProps {
  fortune: MonthlyFortune
}

const LUCK_ICONS: Record<string, string> = {
  income: '💰',
  expense: '💸',
  savings: '🏦',
  investment: '📈',
}

export default function MonthlyResult({ fortune }: MonthlyResultProps) {
  return (
    <div className="space-y-6">
      {/* 점수 */}
      <div className="flex justify-center">
        <ScoreGauge score={fortune.score} />
      </div>

      {/* 종합 요약 */}
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
        <p className="text-white/90 leading-relaxed text-center">{fortune.summary}</p>
      </div>

      {/* 키워드 */}
      <div className="flex justify-center gap-3">
        {fortune.keywords.map((keyword, i) => (
          <span
            key={i}
            className="px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-sm font-medium whitespace-nowrap"
          >
            #{keyword}
          </span>
        ))}
      </div>

      {/* 상세 운세 */}
      <div className="grid grid-cols-1 gap-3">
        <LuckCard icon={LUCK_ICONS.income!} title="수입운" text={fortune.incomeLuck} />
        <LuckCard icon={LUCK_ICONS.expense!} title="지출운" text={fortune.expenseLuck} />
        <LuckCard icon={LUCK_ICONS.savings!} title="저축운" text={fortune.savingsLuck} />
        <LuckCard icon={LUCK_ICONS.investment!} title="투자운" text={fortune.investmentLuck} />
      </div>

      {/* 주의 시기 */}
      <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-400/20">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <h4 className="text-amber-200 font-medium text-sm mb-1">조심할 시기</h4>
            <p className="text-white/70 text-sm">{fortune.cautionPeriod}</p>
          </div>
        </div>
      </div>

      {/* 행운의 행동 */}
      <div className="bg-green-500/10 rounded-2xl p-4 border border-green-400/20">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">🍀</span>
          <div>
            <h4 className="text-green-200 font-medium text-sm mb-1">행운의 행동</h4>
            <p className="text-white/70 text-sm">{fortune.luckyAction}</p>
          </div>
        </div>
      </div>

      {/* 행운의 숫자 */}
      {fortune.luckyNumbers && (
        <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-400/20">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔮</span>
            <h4 className="text-purple-200 font-medium text-sm">이번 달 행운의 숫자</h4>
          </div>
          <div className="flex justify-center gap-3 mt-3">
            {fortune.luckyNumbers.map((num, i) => (
              <span
                key={i}
                className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg"
              >
                {num}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
