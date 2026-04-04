/**
 * Card — glassmorphism wrapper, light cream theme
 */
export default function Card({ children, className = '', onClick, role }) {
  return (
    <div
      role={role}
      onClick={onClick}
      className={[
        'bg-white/90 backdrop-blur-md',
        'border-2 border-[#C3CC9B] rounded-2xl p-8',
        'shadow-[0_4px_20px_rgba(154,177,122,0.15)]',
        'transition-all duration-300',
        onClick
          ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(154,177,122,0.25)] hover:border-[#9AB17A]'
          : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
