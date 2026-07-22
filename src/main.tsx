import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CampaignSetup from './pages/CampaignSetup';
import ArticleEditor from './pages/ArticleEditor';
import AdminPanel from './pages/AdminPanel';
import Articles from './pages/Articles';
import LandingPage from './pages/LandingPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaign/new" element={<CampaignSetup />} />
        <Route path="/article/:id" element={<ArticleEditor />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/articles" element={<Articles />} />
        {/* Placeholder for missing routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
