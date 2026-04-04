import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Lazy loading pages
const HomePage = lazy(() => import('@/pages/Home'))
const DashboardPage = lazy(() => import('@/pages/Dashboard'))
const CasesPage = lazy(() => import('@/pages/Cases'))
const ConflictExplorerPage = lazy(() => import('@/pages/ConflictExplorer'))
const AuthPage = lazy(() => import('@/pages/Auth'))
const BranchViewPage = lazy(() => import('@/pages/BranchView'))
const SettingsPage = lazy(() => import('@/pages/Settings'))
import { AppLayout } from '@/app/layouts/AppLayout'

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/branch-view" element={<BranchViewPage />} />
            <Route path="/conflict-explorer" element={<ConflictExplorerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
