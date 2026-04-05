interface LuckCardProps {
  icon: string
  title: string
  text: string
  titleClass?: string
}

export default function LuckCard({ icon, title, text, titleClass = 'text-indigo-200' }: LuckCardProps) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-start gap-3">
      <span className="text-xl mt-0.5">{icon}</span>
      <div>
        <h4 className={`${titleClass} font-medium text-sm mb-1`}>{title}</h4>
        <p className="text-white/70 text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
