interface ErrorScreenProps {
  message: string
  onRetry: () => void
}

export default function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <span className="text-5xl">🌙</span>
      <div className="text-center space-y-2">
        <p className="text-white/80 text-sm">{message}</p>
        <p className="text-white/40 text-xs">잠시 후 다시 시도해주세요</p>
      </div>
      <button
        onClick={onRetry}
        className="px-6 py-3 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-sm font-medium hover:bg-indigo-500/30 transition"
      >
        다시 시도하기
      </button>
    </div>
  )
}
