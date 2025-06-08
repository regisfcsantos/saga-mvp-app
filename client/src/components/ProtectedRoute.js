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
        // Passa a localização atual para que possamos redirecionar de volta após o login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Usuário está logado, renderiza o componente filho (a página protegida)
    return children;
};

export default ProtectedRoute;