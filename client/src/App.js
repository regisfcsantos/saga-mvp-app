// client/src/App.js
import React, { useState } from 'react'; // React é sempre necessário para JSX
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Sidenav from './components/Sidenav';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import AdminBoxRequestsPage from './pages/AdminBoxRequestsPage';
import CreateCompetitionPage from './pages/CreateCompetitionPage';
import CompetitionDetailPage from './pages/CompetitionDetailPage';
import InscriptionManagementPage from './pages/InscriptionManagementPage';
import AnalyzeSubmissionsPage from './pages/AnalyzeSubmissionsPage';
import ContactPage from './pages/ContactPage';
import BottomNav from './components/BottomNav'; // Importe o novo componente
import { useAuth } from './contexts/AuthContext';
import UserSearchPage from './pages/UserSearchPage'; // <<--- Importe
import NotificationsPage from './pages/NotificationsPage';
import CreditsPage from './pages/CreditsPage';

function App() {
  const { currentUser } = useAuth();
  const [isSidenavOpen, setIsSidenavOpen] = useState(false); // Estado para controlar o menu

  // Função para abrir/fechar o menu
  const toggleSidenav = () => {
    setIsSidenavOpen(!isSidenavOpen);
  };

  return (
    <Router>
      <Navbar onBurgerClick={toggleSidenav} />

      {/* Passa o estado e a função de fechar para o Sidenav */}
      <Sidenav isOpen={isSidenavOpen} onClose={toggleSidenav} />

      <main className="page-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/perfil/:username?" // <<--- O '?' torna o parâmetro opcional
            element={
              <ProtectedRoute> {/* Continua protegida para garantir que você esteja logado para ver seu próprio perfil */}
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
          {/* <<--- NOVA ROTA PARA EDIÇÃO ---<<< */}
          <Route 
            path="/editar-competicao/:id" 
            element={
              <ProtectedRoute>
                <CreateCompetitionPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/competicoes/:id"
            element={<CompetitionDetailPage />
            }
          />
        <Route 
          path="/competicoes/:competitionId/gerenciar-inscricoes"
          element={
              <ProtectedRoute> {/* Garante que só usuários logados acessem */}
                  <InscriptionManagementPage /> {/* O próprio componente verifica se é o criador/admin */}
              </ProtectedRoute>
          }
        />
        <Route 
          path="/competicoes/:competitionId/analisar-envios" // <-- Nova rota
          element={
              <ProtectedRoute> {/* Garante que só usuários logados acessem */}
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
        </Routes>
      </main>
      
      <BottomNav />
    </Router>
  );
}

export default App;