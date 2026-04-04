import { useEffect } from 'react'

/**
 * Modal — controlled via isOpen + onClose props
 * Closes on backdrop click or Escape key
 */
export default function Modal({ isOpen, onClose, children, title }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-[#FDF8F0] border-2 border-[#C3CC9B] rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {children}
      </div>
    </div>
  )
}
