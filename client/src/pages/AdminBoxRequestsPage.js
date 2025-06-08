// client/src/pages/AdminBoxRequestsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
// import './AdminBoxRequestsPage.css'; // Crie este arquivo para estilos depois

const adminPageStyles = {
    container: { padding: '20px', maxWidth: '900px', margin: '20px auto' },
    title: { marginBottom: '20px', textAlign: 'center' },
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
    th: { border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', textAlign: 'left' },
    td: { border: '1px solid #ddd', padding: '8px', textAlign: 'left' },
    button: { padding: '6px 12px', marginRight: '5px', borderRadius: '4px', border: 'none', cursor: 'pointer' },
    approveButton: { backgroundColor: '#28a745', color: 'white' },
    rejectButton: { backgroundColor: '#dc3545', color: 'white' },
    message: { marginTop: '10px', fontWeight: 'bold' },
    errorMessage: { color: 'red' },
    successMessage: { color: 'green' }
};

const AdminBoxRequestsPage = () => {
    const { currentUser } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    const fetchPendingRequests = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.get('/api/admin/pending-boxes'); // O proxy cuida da URL base
            setPendingRequests(response.data);
        } catch (err) {
            console.error("Erro ao buscar solicitações pendentes:", err);
            setError(err.response?.data?.message || "Falha ao buscar solicitações pendentes.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (currentUser && currentUser.role === 'admin') {
            fetchPendingRequests();
        }
    }, [currentUser, fetchPendingRequests]);

    const handleApprove = async (userId) => {
        setActionMessage('');
        try {
            const response = await axios.put(`/api/admin/approve-box/${userId}`);
            setActionMessage(response.data.message || 'Usuário aprovado com sucesso!');
            fetchPendingRequests(); // Atualiza a lista após a ação
        } catch (err) {
            console.error("Erro ao aprovar solicitação:", err);
            setActionMessage(`Falha ao aprovar: ${err.response?.data?.message || 'Erro desconhecido.'}`);
        }
    };

    const handleReject = async (userId) => {
        setActionMessage('');
        try {
            const response = await axios.put(`/api/admin/reject-box/${userId}`);
            setActionMessage(response.data.message || 'Solicitação rejeitada com sucesso!');
            fetchPendingRequests(); // Atualiza a lista após a ação
        } catch (err) {
            console.error("Erro ao rejeitar solicitação:", err);
            setActionMessage(`Falha ao rejeitar: ${err.response?.data?.message || 'Erro desconhecido.'}`);
        }
    };

    if (isLoading) {
        return <div style={adminPageStyles.container}>Carregando solicitações...</div>;
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return <div style={{...adminPageStyles.container, ...adminPageStyles.errorMessage}}>Acesso negado. Esta página é apenas para administradores.</div>;
    }

    if (error) {
        return <div style={{...adminPageStyles.container, ...adminPageStyles.errorMessage}}>Erro: {error}</div>;
    }

    return (
        <div style={adminPageStyles.container}>
            <h1 style={adminPageStyles.title}>Aprovar Solicitações de Box</h1>
            // Correção em AdminBoxRequestsPage.js
            {actionMessage && (
                <p style={actionMessage.includes('sucesso') ? adminPageStyles.successMessage : adminPageStyles.errorMessage}>
                    {actionMessage}
                </p>
            )}

            {pendingRequests.length === 0 ? (
                <p>Nenhuma solicitação de Box pendente no momento.</p>
            ) : (
                <table style={adminPageStyles.table}>
                    <thead>
                        <tr>
                            <th style={adminPageStyles.th}>ID do Usuário</th>
                            <th style={adminPageStyles.th}>Username</th>
                            <th style={adminPageStyles.th}>Email</th>
                            <th style={adminPageStyles.th}>Data da Solicitação</th>
                            <th style={adminPageStyles.th}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingRequests.map(user => (
                            <tr key={user.id}>
                                <td style={adminPageStyles.td}>{user.id}</td>
                                <td style={adminPageStyles.td}>{user.username}</td>
                                <td style={adminPageStyles.td}>{user.email}</td>
                                <td style={adminPageStyles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td style={adminPageStyles.td}>
                                    <button 
                                        onClick={() => handleApprove(user.id)}
                                        style={{...adminPageStyles.button, ...adminPageStyles.approveButton}}
                                    >
                                        Aprovar
                                    </button>
                                    <button 
                                        onClick={() => handleReject(user.id)}
                                        style={{...adminPageStyles.button, ...adminPageStyles.rejectButton}}
                                    >
                                        Rejeitar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminBoxRequestsPage;