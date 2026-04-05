/**
 * 원형 점수 게이지 컴포넌트
 */

interface ScoreGaugeProps {
  score: number
  size?: number
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e' // green
  if (score >= 60) return '#6366f1' // indigo
  if (score >= 40) return '#f59e0b' // amber
  return '#ef4444' // red
}

function getScoreLabel(score: number): string {
  if (score >= 85) return '대길'
  if (score >= 70) return '길'
  if (score >= 55) return '소길'
  if (score >= 40) return '보통'
  return '주의'
}

export default function ScoreGauge({ score, size = 140 }: ScoreGaugeProps) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="transform rotate-90 origin-center"
          fill="white"
          fontSize="32"
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
      <span
        className="text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap"
        style={{ backgroundColor: color + '30', color }}
      >
        {label}
      </span>
    </div>
  )
}
