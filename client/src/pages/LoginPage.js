// client/src/pages/LoginPage.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // Para verificar se já está logado
import { Navigate } from 'react-router-dom'; // Para redirecionar se já logado
import './LoginPage.css'; // Importe o arquivo CSS

const LoginPage = () => {
    const { currentUser, isLoading } = useAuth();

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:5001/api/auth/google';
    };

    const handleFacebookLogin = () => {
        window.location.href = 'http://localhost:5001/api/auth/facebook';
    };

    if (isLoading) {
        return <div>Carregando...</div>;
    }

    if (currentUser) {
        return <Navigate to="/perfil" replace />;
    }

    // Extrai o parâmetro de erro da URL para exibir uma mensagem mais específica
    const queryParams = new URLSearchParams(window.location.search);
    const loginError = queryParams.get('error');

    return (
        <div className="login-page-container">
            <h1 className="login-title">Login no SAGA</h1>
            <div className="login-button-container">
                <button onClick={handleGoogleLogin} className="login-button google">
                    <i className="fab fa-google"></i> {/* Ícone virá do Font Awesome */}
                    Login com Google
                </button>
                <button onClick={handleFacebookLogin} className="login-button facebook">
                    <i className="fab fa-facebook-f"></i> {/* Ícone virá do Font Awesome */}
                    Login com Facebook
                </button>
            </div>
            {loginError && (
                <p className="login-error-message">
                    Falha no login. Por favor, tente novamente.
                    {loginError === 'google_failed' && " (Google)"}
                    {loginError === 'facebook_failed' && " (Facebook)"}
                    {/* Você pode adicionar mais mensagens de erro específicas aqui se o backend as enviar */}
                </p>
            )}
        </div>
    );
};

export default LoginPage;