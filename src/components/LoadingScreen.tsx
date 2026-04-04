const LOADING_MESSAGES = [
  '별자리의 기운을 읽고 있어요...',
  '사주의 흐름을 분석하는 중...',
  '금전운의 흐름을 파악하고 있어요...',
  '재물의 기운이 모이고 있어요...',
]

export default function LoadingScreen() {
  const message = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-indigo-500/30 border-t-indigo-400 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-3xl">🔮</span>
      </div>
      <p className="text-white/60 text-sm animate-pulse">{message}</p>
    </div>
  )
}
