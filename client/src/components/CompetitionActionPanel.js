// client/src/components/CompetitionActionPanel.js
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import VideoSubmissionForm from './VideoSubmissionForm'; // <<--- Usaremos um formulário separado

const CompetitionActionPanel = ({ competition, userInscription, onInscription }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLoginRedirect = () => {
        alert("Você precisa fazer login para se inscrever.");
        navigate('/login', { state: { from: location } });
    };

    // Cenário 1: Usuário não está inscrito E inscrições estão abertas
    if (!userInscription) {
        const isInscriptionOpen = competition.status === 'publicada' && new Date(competition.inscription_end_date) > new Date();
        return (
            <div className="action-panel">
                <h3>Inscrição</h3>
                <p className={`price-tag ${parseFloat(competition.price) === 0 ? 'free' : ''}`}>
                    {parseFloat(competition.price) === 0 ? 'Grátis' : `R$ ${parseFloat(competition.price).toFixed(2)}`}
                </p>
                <button
                    onClick={onInscription}
                    className={`inscription-button ${!isInscriptionOpen ? 'closed' : ''}`}
                    disabled={!isInscriptionOpen}
                    title={!isInscriptionOpen ? "Inscrições encerradas" : "Clique para se inscrever"}
                >
                    {isInscriptionOpen ? 'Inscreva-se Agora' : 'Inscrições Encerradas'}
                </button>
            </div>
        );
    }
    
    // Cenário 2: Inscrição PENDENTE DE PAGAMENTO
    // client/src/components/CompetitionActionPanel.js

// ... (início do componente e outros cenários)

    // Cenário 2: Inscrição PENDENTE DE PAGAMENTO
    if (userInscription.status === 'pendente_pagamento') {
        // <<--- INÍCIO DA SEÇÃO ATUALIZADA ---<<<
        return (
            <div className="action-panel payment-panel">
                <h3>Pagamento Pendente</h3>
                <p>Sua pré-inscrição foi realizada! Para confirmar sua vaga, siga as instruções de pagamento abaixo.</p>
                
                <div className="payment-instructions">
                    <h4>Instruções de Pagamento</h4>

                    {/* Método de Pagamento (Ex: PIX) */}
                    {competition.payment_method_name &&
                        <p><strong>Método Sugerido:</strong> {competition.payment_method_name}</p>
                    }

                    {/* Detalhes (Chave PIX ou Conta) */}
                    {competition.payment_details && (
                        <div className="payment-method-section">
                            <strong>Chave PIX / Dados da Conta:</strong>
                            <pre className="payment-details-box">{competition.payment_details}</pre>
                        </div>
                    )}

                    {/* Contato para Envio do Comprovante */}
                    {competition.proof_of_payment_contact && (
                         <div className="payment-method-section">
                            <strong>Enviar Comprovante via {competition.proof_of_payment_recipient || 'o método indicado'}:</strong>
                            <p>{competition.proof_of_payment_contact}</p>
                        </div>
                    )}
                    
                    {/* Instruções Detalhadas */}
                    {competition.payment_instructions_detailed && (
                         <div className="payment-method-section">
                            <strong>Instruções Adicionais:</strong>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{competition.payment_instructions_detailed}</p>
                        </div>
                    )}
                </div>
                <small>Após o pagamento, o criador da competição irá aprovar sua participação.</small>
            </div>
        );
        // <<--- FIM DA SEÇÃO ATUALIZADA ---<<<
    }

    // Cenário 3: Inscrição CONFIRMADA
    if (userInscription.status === 'confirmada') {
        const isSubmissionPeriodOpen = new Date() > new Date(competition.submission_start_date) && new Date() < new Date(competition.submission_end_date);
        
        if (isSubmissionPeriodOpen) {
            // Se o período de envio estiver aberto, mostra o formulário
            return (
                <div className="action-panel submission-panel">
                    <h3>Sua Prova</h3>
                    <VideoSubmissionForm competition={competition} userInscription={userInscription} />
                </div>
            );
        } else {
            // Se o período estiver fechado ou não tiver começado
            return (
                <div className="action-panel">
                    <h3>Inscrição Confirmada</h3>
                    <p>Sua participação está confirmada! O período para envio de provas não está ativo no momento.</p>
                    <p><strong>Período de Envio:</strong> {new Date(competition.submission_start_date).toLocaleDateString('pt-BR')} até {new Date(competition.submission_end_date).toLocaleDateString('pt-BR')}</p>
                </div>
            );
        }
    }

    // Cenário Padrão (outros status como 'rejeitada', etc.)
    return (
        <div className="action-panel">
            <h3>Status da Inscrição</h3>
            <p>Seu status atual nesta competição é: <strong>{userInscription.status}</strong>.</p>
        </div>
    );
};

export default CompetitionActionPanel;