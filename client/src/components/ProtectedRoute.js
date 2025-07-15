// client/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { currentUser, isLoading } = useAuth();
    const location = useLocation(); // Para saber de onde o usuário veio

    if (isLoading) {
        // Enquanto verifica o usuário, mostre um loader ou nada para evitar flicker
        return <div>Verificando autenticação...</div>; // Ou null, ou um componente de Spinner
    }

    if (!currentUser) {
        // Usuário não está logado, redireciona para a página de login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const isPending = currentUser.status === 'pending_invitation';
    const isOnInvitationPage = location.pathname === '/validar-convite';

    // Se o usuário está pendente e tenta acessar qualquer rota protegida
    if (isPending && !isOnInvitationPage) {
        return <Navigate to="/validar-convite" replace />;
    }

    return children;
};

export default ProtectedRoute;