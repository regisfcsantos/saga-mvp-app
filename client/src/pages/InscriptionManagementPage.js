// client/src/pages/InscriptionManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './InscriptionManagementPage.css';

const InscriptionManagementPage = () => {
    const { competitionId } = useParams();
    const { currentUser } = useAuth();
    const [inscriptions, setInscriptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchInscriptions = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/competitions/${competitionId}/inscriptions`);
            setInscriptions(response.data);
        } catch (err) {
            console.error("Erro ao buscar inscrições:", err);
            setError(err.response?.data?.message || 'Falha ao carregar inscrições.');
        } finally {
            setIsLoading(false);
        }
    }, [competitionId]);

    useEffect(() => {
        if (currentUser) {
            fetchInscriptions();
        }
    }, [currentUser, fetchInscriptions]);

    const handleConfirm = async (inscriptionId) => {
        try {
            await axios.put(`/api/inscriptions/${inscriptionId}/confirm`);
            alert('Inscrição confirmada com sucesso!');
            fetchInscriptions(); // Recarrega a lista
        } catch (err) {
            alert(`Erro ao confirmar inscrição: ${err.response?.data?.message || 'Erro desconhecido.'}`);
        }
    };

    // <<--- NOVA FUNÇÃO PARA CANCELAR A INSCRIÇÃO ---<<<
    const handleCancel = async (inscriptionId) => {
        // Pede uma confirmação para evitar cliques acidentais
        if (window.confirm("Você tem certeza que deseja cancelar esta inscrição? Esta ação não pode ser desfeita.")) {
            try {
                await axios.delete(`/api/inscriptions/${inscriptionId}`);
                alert('Inscrição cancelada com sucesso!');
                fetchInscriptions(); // Recarrega a lista para remover o usuário
            } catch (err) {
                alert(`Erro ao cancelar inscrição: ${err.response?.data?.message || 'Erro desconhecido.'}`);
            }
        }
    };

    if (isLoading) return <div className="manage-inscriptions-container">Carregando...</div>;
    if (error) return <div className="manage-inscriptions-container" style={{color: 'red'}}>{error}</div>;

    return (
        <div className="manage-inscriptions-container">
            <h1 className="manage-inscriptions-title">Gerenciar Inscrições da Competição</h1>
            {inscriptions.length === 0 ? (
                <p>Ainda não há inscrições para esta competição.</p>
            ) : (
                <table className="inscriptions-table">
                    <thead>
                        <tr>
                            <th>Atleta</th>
                            <th>Data da Inscrição</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inscriptions.map(inscription => (
                            <tr key={inscription.id}>
                                <td data-label="Atleta">
                                    <div className="athlete-info">
                                        <img src={inscription.profile_photo_url || 'https://via.placeholder.com/40'} alt={inscription.username} className="athlete-photo" />
                                        <span>{inscription.username} ({inscription.email})</span>
                                    </div>
                                </td>
                                <td data-label="Data da Inscrição">{new Date(inscription.inscription_date).toLocaleString('pt-BR')}</td>
                                <td data-label="Status">
                                    <span className={`status-badge status-${inscription.status}`}>
                                        {inscription.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="actions-cell" data-label="Ações">
                                    {(inscription.status === 'pendente_pagamento' || inscription.status === 'pendente_aprovacao') && (
                                        <button 
                                            onClick={() => handleConfirm(inscription.id)}
                                            className="action-button confirm"
                                        >
                                            {inscription.status === 'pendente_aprovacao' ? 'Aprovar' : 'Confirmar Pag.'}
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => handleCancel(inscription.id)}
                                        className="action-button cancel"
                                        title="Cancelar Inscrição"
                                    >
                                        Cancelar
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

export default InscriptionManagementPage;