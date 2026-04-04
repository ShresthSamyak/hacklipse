/**
 * InputField — type: 'text' | 'date' | 'textarea'
 */
export default function InputField({
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 6,
  className = '',
  label,
  disabled = false,
}) {
  const baseStyle = [
    'w-full bg-white/80 border-2 border-[#C3CC9B] rounded-xl',
    'px-4 py-3.5 text-[#2d3a2d] text-base font-sans',
    'transition-all duration-300',
    'focus:outline-none focus:border-[#9AB17A] focus:shadow-[0_0_0_3px_rgba(154,177,122,0.2)]',
    'placeholder:text-gray-400',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    className,
  ].join(' ')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          disabled={disabled}
          className={baseStyle}
        />
      ) : (
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseStyle}
        />
      )}
    </div>
  )
}
