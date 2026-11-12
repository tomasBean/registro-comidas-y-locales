import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { APP_NAME } from './config/app';
import { HomeScreen } from './features/home/HomeScreen';
import { AppShell } from './ui/layout/AppShell';

// HashRouter: GitHub Pages cannot rewrite unknown paths to index.html.
export function App() {
  return (
    <HashRouter>
      <AppShell title={APP_NAME}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
