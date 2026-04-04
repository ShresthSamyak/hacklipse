/**
 * Badge — priority: 'high' | 'medium' | 'low'
 */
export default function Badge({ children, priority = 'high', className = '' }) {
  const styles = {
    high: 'bg-[rgba(154,177,122,0.15)] text-[#9AB17A] border border-[#9AB17A]',
    medium: 'bg-[rgba(228,223,181,0.5)] text-[#8A7650] border border-[#C3CC9B]',
    low: 'bg-[rgba(251,232,206,0.5)] text-[#8A7650] border border-[#DBCEA5]',
  }

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-3.5 py-1.5',
        'rounded-full text-xs font-semibold font-mono-code',
        styles[priority] ?? styles.high,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
