// client/src/pages/InvitationPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './InvitationPage.css'; // Vamos criar este arquivo a seguir

const InvitationPage = () => {
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setCurrentUser } = useAuth(); // Usado para forçar a atualização do usuário
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 1. Envia o código para o backend para validação
            await axios.post('/api/auth/validate-invite', { inviteCode });
            
            // 2. Se a validação for bem-sucedida, busca os dados do usuário atualizado
            const response = await axios.get('/api/auth/current_user');
            
            // 3. Atualiza o contexto de autenticação com o novo status 'active'
            if (response.data.user) {
                setCurrentUser(response.data.user);
            }
            
            // 4. O AuthStatusHandler irá automaticamente redirecionar para /perfil
            // mas podemos forçar para garantir.
            navigate('/perfil');

        } catch (err) {
            setError(err.response?.data?.message || 'Ocorreu um erro. Verifique o código e tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="invitation-page-container">
            <div className="invitation-card">
                <h2>Quase lá!</h2>
                <p>Para ativar sua conta, por favor, insira o código do convite que você recebeu.</p>
                
                <form onSubmit={handleSubmit} className="invitation-form">
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Seu código de convite"
                        className="invitation-input"
                        required
                    />
                    
                    {error && <p className="invitation-error">{error}</p>}
                    
                    <button type="submit" className="invitation-button" disabled={isLoading}>
                        {isLoading ? 'Verificando...' : 'Ativar Conta'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InvitationPage;