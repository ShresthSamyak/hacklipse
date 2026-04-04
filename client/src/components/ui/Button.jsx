/**
 * Button — variant: 'primary' | 'secondary'
 */
export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
  onClick,
  fullWidth = false,
}) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl cursor-pointer transition-all duration-300 px-8 py-3.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const variants = {
    primary: [
      'bg-gradient-to-br from-[#9AB17A] to-[#7a9a5a] text-white border-none',
      'shadow-[0_4px_15px_rgba(154,177,122,0.3)]',
      'hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(154,177,122,0.4)]',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      'focus-visible:ring-[#9AB17A]',
    ].join(' '),
    secondary: [
      'bg-white text-[#5a7a5a] border-2 border-[#9AB17A]',
      'hover:bg-[#FDF8F0] hover:border-[#5a7a5a]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'focus-visible:ring-[#9AB17A]',
    ].join(' '),
    'secondary-dark': [
      'bg-transparent text-[#9AB17A] border-2 border-[#9AB17A]',
      'hover:bg-[rgba(154,177,122,0.1)] hover:-translate-y-0.5',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'focus-visible:ring-[#9AB17A]',
    ].join(' '),
  }

  return (
    <button
      type={type}
      className={`${base} ${variants[variant] ?? variants.primary} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
