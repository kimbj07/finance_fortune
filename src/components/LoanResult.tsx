import type { LoanFortune } from '../types'
import ScoreGauge from './ScoreGauge'
import LuckCard from './LuckCard'

interface LoanResultProps {
  fortune: LoanFortune
}

const LUCK_ICONS: Record<string, string> = {
  timing: '🕐',
  rate: '📊',
  repayment: '💳',
}

export default function LoanResult({ fortune }: LoanResultProps) {
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
            className="px-4 py-2 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-sm font-medium"
          >
            #{keyword}
          </span>
        ))}
      </div>

      {/* 상세 운세 */}
      <div className="grid grid-cols-1 gap-3">
        <LuckCard icon={LUCK_ICONS.timing!} title="대출 타이밍" text={fortune.timingLuck} titleClass="text-teal-200" />
        <LuckCard icon={LUCK_ICONS.rate!} title="금리 흐름" text={fortune.rateLuck} titleClass="text-teal-200" />
        <LuckCard icon={LUCK_ICONS.repayment!} title="상환운" text={fortune.repaymentLuck} titleClass="text-teal-200" />
      </div>

      {/* 주의할 점 */}
      <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-400/20">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <h4 className="text-amber-200 font-medium text-sm mb-1">주의할 점</h4>
            <p className="text-white/70 text-sm">{fortune.cautionPoint}</p>
          </div>
        </div>
      </div>

      {/* 행운의 행동 */}
      <div className="bg-green-500/10 rounded-2xl p-4 border border-green-400/20">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">🍀</span>
          <div>
            <h4 className="text-green-200 font-medium text-sm mb-1">대출운을 높이는 행동</h4>
            <p className="text-white/70 text-sm">{fortune.luckyAction}</p>
          </div>
        </div>
      </div>

      {/* 면책 */}
      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
        <p className="text-white/30 text-xs text-center leading-relaxed">
          본 대출운은 재미 목적의 운세이며, 실제 대출 결정의 근거가 아닙니다.
        </p>
      </div>
    </div>
  )
}
