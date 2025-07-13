// client/src/components/CompetitionActionPanel.js
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import VideoSubmissionForm from './VideoSubmissionForm';
import './CompetitionActionPanel.css';

const CompetitionActionPanel = ({ competition, userInscription, onInscription }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLoginRedirect = () => {
        alert("Você precisa fazer login para se inscrever.");
        navigate('/login', { state: { from: location } });
    };

    // Cenário 1: Usuário não está inscrito E inscrições estão abertas
    if (!userInscription) {
        const isInscriptionOpen = (competition.type === 'challenge' && competition.status === 'publicada') ||
                                  (competition.type === 'competition' && competition.status === 'publicada' && new Date(competition.inscription_end_date) > new Date());
        
        const buttonText = competition.type === 'challenge' ? 'Inscrever-se no Desafio' : 
                          isInscriptionOpen ? 'Inscreva-se Agora' : 'Inscrições Encerradas';

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
                    {buttonText}
                </button>
            </div>
        );
    }

    if (userInscription.status === 'pendente_aprovacao') {
        return (
            <div className="action-panel">
                <h3>Solicitação Enviada</h3>
                <p>Sua inscrição no desafio foi enviada e está aguardando a aprovação do criador.</p>
                <p>Você será notificado assim que for aprovado.</p>
            </div>
        );
    }

    // Cenário 2: Inscrição PENDENTE DE PAGAMENTO
    if (userInscription.status === 'pendente_pagamento') {
        return (
            <div className="action-panel payment-panel">
                <h3>Pagamento Pendente</h3>
                <p className="payment-subtitle">Sua pré-inscrição foi registrada! Para confirmar sua vaga, siga as instruções abaixo.</p>
                
                <div className="payment-instructions">
                    {/* Instruções Gerais */}
                    {competition.payment_instructions_detailed &&
                        <div className="payment-section">
                            <h4>Instruções Gerais</h4>
                            <p>{competition.payment_instructions_detailed}</p>
                        </div>
                    }

                    {/* Detalhes do Pagamento (PIX ou Banco) */}
                    {competition.payment_details &&
                        <div className="payment-section">
                            <h4>{competition.payment_method_name || 'Dados para Pagamento'}</h4>
                            <pre className="payment-details-box">{competition.payment_details}</pre>
                        </div>
                    }
                    
                    {/* Envio do Comprovante */}
                    {competition.proof_of_payment_contact &&
                        <div className="payment-section">
                            <h4>Enviar Comprovante</h4>
                            <p>
                                Envie seu comprovante via <strong>{competition.proof_of_payment_recipient || 'o método indicado'}</strong> para o contato: <strong>{competition.proof_of_payment_contact}</strong>.
                            </p>
                        </div>
                    }
                </div>
                <small className="payment-footer">Após a validação do pagamento, o organizador irá aprovar sua participação.</small>
            </div>
        );
    }

    // Cenário 3: Inscrição CONFIRMADA
    if (userInscription.status === 'confirmada') {
        const isSubmissionOpen = competition.type === 'challenge' || 
                                 (new Date() > new Date(competition.submission_start_date) && new Date() < new Date(competition.submission_end_date));
            
        if (isSubmissionOpen) {
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
                    {competition.type === 'competition' && (
                        <>
                            <p>O período para envio de provas não está ativo no momento.</p>
                            <p><strong>Período de Envio:</strong> {new Date(competition.submission_start_date).toLocaleDateString('pt-BR')} até {new Date(competition.submission_end_date).toLocaleDateString('pt-BR')}</p>
                        </>
                    )}
                </div>
            );
        }
    }

    // Cenário Padrão (outros status como 'rejeitada', etc.)
    return (
        <div className="action-panel">
            <h3>Status da Inscrição</h3>
            <p>Seu status atual neste evento é: <strong>{userInscription.status.replace(/_/g, ' ')}</strong>.</p>
        </div>
    );
};

export default CompetitionActionPanel;