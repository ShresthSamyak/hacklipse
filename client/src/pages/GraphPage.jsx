import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import BranchGraph from '../components/graph/BranchGraph'
import GraphLegend from '../components/graph/GraphLegend'

export default function GraphPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-[#f8fafc]">
      <Navbar />

      <main className="flex-grow flex flex-col" style={{ height: 'calc(100vh - 4rem - 100px)' }}>
        {/* Top bar */}
        <div className="p-6 bg-[#0f172a] border-b border-[#334155] flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-mono-code gradient-text-dark">
              Visual Branch Graph
            </h1>
            <p className="text-sm text-[#94a3b8] mt-1">Interactive timeline divergence map</p>
          </div>
          <GraphLegend />
        </div>

        {/* Graph */}
        <BranchGraph />
      </main>

      <Footer />
    </div>
  )
}
