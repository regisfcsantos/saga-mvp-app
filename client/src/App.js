// client/src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Sidenav from './components/Sidenav';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import AuthStatusHandler from './components/AuthStatusHandler';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import AdminBoxRequestsPage from './pages/AdminBoxRequestsPage';
import CreateCompetitionPage from './pages/CreateCompetitionPage';
import EventDetailPage from './pages/EventDetailPage'; // <<--- MUDANÇA: Importa o novo nome
import DesafiosPage from './pages/DesafiosPage';   // <<--- MUDANÇA: Importa a nova página
import InscriptionManagementPage from './pages/InscriptionManagementPage';
import AnalyzeSubmissionsPage from './pages/AnalyzeSubmissionsPage';
import ContactPage from './pages/ContactPage';
import BottomNav from './components/BottomNav';
import UserSearchPage from './pages/UserSearchPage';
import NotificationsPage from './pages/NotificationsPage';
import CreditsPage from './pages/CreditsPage';
import InvitationPage from './pages/InvitationPage';
import AdminInviteGeneratorPage from './pages/AdminInviteGeneratorPage';
import TermosDeServicoPage from './pages/TermosDeServicoPage';
import PoliticaDePrivacidadePage from './pages/PoliticaDePrivacidadePage';

function App() {
  const [isSidenavOpen, setIsSidenavOpen] = useState(false);

  const toggleSidenav = () => {
    setIsSidenavOpen(!isSidenavOpen);
  };

  return (
    <Router>
      <Navbar onBurgerClick={toggleSidenav} />
      <Sidenav isOpen={isSidenavOpen} onClose={toggleSidenav} />

      <main className="page-content">
        <Routes>
            <Route 
              path="/validar-convite" 
              element={
                <ProtectedRoute>
                  <InvitationPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/gerar-convite" 
              element={
                <AdminRoute>
                  <AdminInviteGeneratorPage />
                </AdminRoute>
              } 
            />

            <Route path="/" element={<HomePage />} />
            <Route path="/desafios" element={<DesafiosPage />} /> {/* <<--- MUDANÇA: Nova rota para desafios */}
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/perfil/:username?"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/editar-perfil"
              element={
                <ProtectedRoute>
                  <EditProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/aprovar-boxes" 
              element={
                <AdminRoute>
                  <AdminBoxRequestsPage />
                </AdminRoute>
              } 
            />
            <Route 
              path="/criar-competicao" 
              element={
                <ProtectedRoute>
                  <CreateCompetitionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/editar-competicao/:id" 
              element={
                <ProtectedRoute>
                  <CreateCompetitionPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/editar-desafio/:id" 
              element={
                <ProtectedRoute>
                  <CreateCompetitionPage />
                </ProtectedRoute>
              } 
            />

            {/* <<--- MUDANÇA: As rotas de detalhe agora usam o novo componente flexível ---<<< */}
            <Route path="/competicoes/:id" element={<EventDetailPage />} />
            <Route path="/desafios/:id" element={<EventDetailPage />} />
            
            <Route 
              path="/competicoes/:competitionId/gerenciar-inscricoes"
              element={
                  <ProtectedRoute>
                      <InscriptionManagementPage />
                  </ProtectedRoute>
              }
            />
            <Route 
              path="/competicoes/:competitionId/analisar-envios"
              element={
                  <ProtectedRoute>
                      <AnalyzeSubmissionsPage />
                  </ProtectedRoute>
              }
            />
            
            <Route path="/creditos" element={<CreditsPage />} />
            <Route path="/buscar-usuarios" element={<UserSearchPage />} />
            <Route 
              path="/notificacoes" 
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/contato" element={<ContactPage />} />
            <Route path="/termos-de-servico" element={<TermosDeServicoPage />} />
            <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidadePage />} />

        </Routes>
      </main>
      
      <BottomNav />
    </Router>
  );
}

export default App;