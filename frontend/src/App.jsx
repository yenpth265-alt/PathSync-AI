import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import DocumentsPage from './pages/DocumentsPage';
import UniversitiesPage from './pages/UniversitiesPage';
import EssayCopilotPage from './pages/EssayCopilotPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/universities" element={<UniversitiesPage />} />
              <Route path="/essay-copilot" element={<EssayCopilotPage />} />
              
              {/* Fallback for Smart Match or others */}
              <Route path="/smart-match" element={
                <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '12px' }}>Smart Match</h2>
                  <p>This feature is coming soon...</p>
                </div>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
