import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import InvestigatorPage from './pages/InvestigatorPage'
import SurvivorPage from './pages/SurvivorPage'
import WitnessPage from './pages/WitnessPage'
import GraphPage from './pages/GraphPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/investigator" element={<InvestigatorPage />} />
        <Route path="/survivor" element={<SurvivorPage />} />
        <Route path="/witness" element={<WitnessPage />} />
        <Route path="/graph" element={<GraphPage />} />
      </Routes>
    </BrowserRouter>
  )
}
