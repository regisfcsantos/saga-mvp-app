// client/src/App.js
import React from 'react'; // React é sempre necessário para JSX
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import AdminBoxRequestsPage from './pages/AdminBoxRequestsPage';
import CreateCompetitionPage from './pages/CreateCompetitionPage';
import CompetitionDetailPage from './pages/CompetitionDetailPage'; // <-- IMPORTA A NOVA PÁGINA
import PaymentInstructionsPage from './pages/PaymentInstructionsPage';
import InscriptionManagementPage from './pages/InscriptionManagementPage';
import AnalyzeSubmissionsPage from './pages/AnalyzeSubmissionsPage';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="main-content-area">
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
            path="/pagamento/instrucoes" 
            element={
                <ProtectedRoute>
                    <PaymentInstructionsPage />
                </ProtectedRoute>
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;