import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RoleCard from '../components/home/RoleCard'
import HowItWorks from '../components/home/HowItWorks'
import Modal from '../components/ui/Modal'
import InputField from '../components/ui/InputField'
import Button from '../components/ui/Button'

export default function HomePage() {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [caseNumber, setCaseNumber] = useState('')

  const handleCaseLogin = (e) => {
    e.preventDefault()
    if (!caseNumber.trim()) return
    localStorage.setItem('currentCase', caseNumber.trim())
    setModalOpen(false)
    navigate('/investigator')
  }

  return (
    <>
      <main
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #FDF8F0 0%, #E4DFB5 100%)' }}
      >
        <div className="max-w-6xl w-full">
          {/* Header */}
          <header className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-[#9AB17A] to-[#C3CC9B] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" aria-hidden="true">
              <i className="fas fa-project-diagram text-3xl text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-3 font-serif-display gradient-text-light">
              ChronoMerge
            </h1>
            <p className="text-lg text-gray-600 mb-3">Narrative Merge Engine</p>
            <div className="w-48 h-1 bg-gradient-to-r from-[#9AB17A] to-[#E4DFB5] mx-auto rounded-full" aria-hidden="true" />
          </header>

          {/* Role Selection Cards */}
          <section aria-label="Select your role" className="grid md:grid-cols-3 gap-8 mb-8">
            <RoleCard
              icon="fas fa-heart"
              title="Survivor"
              description="Share your story in a safe, confidential space"
              buttonLabel="Begin Testimony"
              buttonVariant="primary"
              onAction={() => navigate('/survivor')}
            />
            <RoleCard
              icon="fas fa-eye"
              title="Witness"
              description="Contribute what you observed"
              buttonLabel="Add Account"
              buttonVariant="primary"
              onAction={() => navigate('/witness')}
            />
            <RoleCard
              icon="fas fa-balance-scale"
              title="Investigator"
              description="Access case dashboard and analysis"
              buttonLabel="Case Login"
              buttonVariant="secondary"
              onAction={() => setModalOpen(true)}
            />
          </section>

          {/* How It Works */}
          <HowItWorks />
        </div>
      </main>

      {/* Case Login Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Case Access">
        <h3 className="text-2xl font-semibold text-center text-[#5a7a5a] mb-2 font-serif-display">
          Case Access
        </h3>
        <p className="text-gray-600 text-center mb-6">
          Enter your case number to access the investigator dashboard
        </p>
        <form onSubmit={handleCaseLogin}>
          <InputField
            id="case-number-home"
            type="text"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="Case Number (e.g., CASE-2024-001)"
            required
            className="mb-4"
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" fullWidth type="submit">
              Access Dashboard
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
