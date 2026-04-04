import { useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import Button from '../ui/Button'

/**
 * RoleCard — a clickable card for Survivor, Witness, or Investigator roles
 */
export default function RoleCard({ icon, title, description, buttonLabel, onAction, buttonVariant = 'primary' }) {
  return (
    <Card>
      {/* Icon circle */}
      <div
        className="w-20 h-20 bg-gradient-to-br from-[#9AB17A] to-[#C3CC9B] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_4px_15px_rgba(154,177,122,0.3)]"
        aria-hidden="true"
      >
        <i className={`${icon} text-3xl text-white`} />
      </div>

      <h3 className="text-2xl font-semibold text-center text-[#5a7a5a] mb-3 font-serif-display">
        {title}
      </h3>
      <p className="text-center text-gray-600 mb-6">{description}</p>

      <Button variant={buttonVariant} fullWidth onClick={onAction}>
        {buttonLabel}
      </Button>
    </Card>
  )
}
