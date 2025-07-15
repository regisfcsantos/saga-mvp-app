// client/src/components/AuthStatusHandler.js
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthStatusHandler = () => {
    const { currentUser, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Não faz nada enquanto o status de autenticação ainda está carregando
        if (isLoading) {
            return;
        }

        const isPending = currentUser?.status === 'pending_invitation';
        const isOnInvitationPage = location.pathname === '/validar-convite';

        // Caso 1: Se o usuário está pendente e NÃO está na página de convite,
        // força o redirecionamento para a página de convite.
        if (isPending && !isOnInvitationPage) {
            navigate('/validar-convite', { replace: true });
        }
        
        // Caso 2: Se o usuário NÃO está mais pendente mas está na página de convite
        // (ex: acabou de validar), redireciona ele para o perfil.
        else if (currentUser && !isPending && isOnInvitationPage) {
            navigate('/perfil', { replace: true });
        }

    }, [currentUser, isLoading, navigate, location.pathname]);

    // Este componente não renderiza nada no DOM
    return null;
};

export default AuthStatusHandler;