// client/src/pages/AdminInviteGeneratorPage.js
import React, { useState } from 'react';
import axios from 'axios';
import './InvitationPage.css'; // Reutilizaremos o mesmo CSS para manter a consistência

const AdminInviteGeneratorPage = () => {
    const [generatedCode, setGeneratedCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerateCode = async () => {
        setError('');
        setGeneratedCode('');
        setIsCopied(false);
        setIsLoading(true);

        try {
            const response = await axios.post('/api/admin/invites/generate');
            setGeneratedCode(response.data.inviteCode);
        } catch (err) {
            setError(err.response?.data?.message || 'Não foi possível gerar o código.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Resetar o status "Copiado" após 2 segundos
    };

    return (
        <div className="invitation-page-container">
            <div className="invitation-card">
                <h2>Gerador de Convites</h2>
                <p>Clique no botão abaixo para gerar um novo código de convite de uso único.</p>
                
                <button onClick={handleGenerateCode} className="invitation-button" disabled={isLoading} style={{ marginBottom: '20px' }}>
                    {isLoading ? 'Gerando...' : 'Gerar Novo Convite'}
                </button>

                {error && <p className="invitation-error">{error}</p>}

                {generatedCode && (
                    <div className="generated-code-container">
                        <p>Convite gerado! Compartilhe com o novo usuário:</p>
                        <div className="code-display" onClick={copyToClipboard} title="Clique para copiar">
                            <strong>{generatedCode}</strong>
                            <i className="fas fa-copy" style={{ marginLeft: '10px' }}></i>
                        </div>
                        {isCopied && <p style={{ color: 'green', marginTop: '10px' }}>Copiado para a área de transferência!</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminInviteGeneratorPage;