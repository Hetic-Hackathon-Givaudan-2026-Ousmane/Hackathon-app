import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import ObservatoryPage from './pages/ObservatoryPage.tsx';

const TrendPage = lazy(() => import('./pages/TrendPage.tsx'));
const SourcesPage = lazy(() => import('./pages/SourcesPage.tsx'));
const BriefPage = lazy(() => import('./pages/BriefPage.tsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx'));

const loading = <p className="sr-only">Chargement</p>;

export default function App() {
  return (
    <Suspense fallback={loading}>
      <Routes>
        <Route path="/" element={<ObservatoryPage />} />
        <Route path="/tendance/:id" element={<TrendPage />} />
        <Route path="/tendance/:id/sources" element={<SourcesPage />} />
        <Route path="/tendance/:id/brief" element={<BriefPage />} />
        <Route path="/tableau-de-bord" element={<DashboardPage />} />
        <Route path="*" element={<ObservatoryPage />} />
      </Routes>
    </Suspense>
  );
}
