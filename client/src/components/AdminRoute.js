// client/src/components/AdminRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
    const { currentUser, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div>Verificando autenticação e permissões...</div>; // Ou um Spinner
    }

    if (!currentUser) {
        // Não logado, redireciona para login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (currentUser.role !== 'admin') {
        // Logado, mas não é admin, redireciona para uma página de "não autorizado" ou para o perfil
        console.warn("Tentativa de acesso à rota de admin por usuário não admin:", currentUser.email);
        return <Navigate to="/perfil" state={{ message: "Acesso negado: Recurso de administrador." }} replace />;
        // Ou crie uma página específica <UnauthorizedPage /> e redirecione para ela
    }

    // Logado e é admin, renderiza o componente filho
    return children;
};

export default AdminRoute;