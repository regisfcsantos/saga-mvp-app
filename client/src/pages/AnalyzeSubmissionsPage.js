// client/src/pages/AnalyzeSubmissionsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './AnalyzeSubmissionsPage.css';

const AnalyzeSubmissionsPage = () => {
    const { competitionId } = useParams();
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    // Poderíamos buscar os dados da competição também para mostrar o nome
    const [eventData, setEventData] = useState(null);

    const fetchSubmissions = useCallback(async () => {
        setIsLoading(true);
        try {
            // Busca o nome da competição
            const compResponse = await axios.get(`/api/competitions/${competitionId}`);
            setEventData(compResponse.data);

            // Busca as submissões
            const subResponse = await axios.get(`/api/competitions/${competitionId}/submissions`);
            setSubmissions(subResponse.data.map(s => ({ ...s, validation_status: s.validation_status || '' })));
        } catch (err) {
            console.error("Erro ao buscar dados:", err);
            setError(err.response?.data?.message || 'Falha ao carregar dados da página.');
        } finally {
            setIsLoading(false);
        }
    }, [competitionId]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleGradeSubmit = async (e, submissionId) => {
        e.preventDefault();
        const form = e.target;
        const payload = {
            score: form.score ? form.score.value : 0,
            creator_feedback: form.feedback.value,
            // Adiciona o status da validação se o campo existir no form
            validation_status: form.validation_status ? form.validation_status.value : null
        };

        try {
            await axios.put(`/api/submissions/${submissionId}/grade`, payload);
            alert('Avaliação salva com sucesso!');
            fetchSubmissions(); // Recarrega para mostrar a nota salva
        } catch (err) {
            console.error("Erro ao salvar avaliação:", err);
            alert(`Falha ao salvar: ${err.response?.data?.message || 'Erro desconhecido'}`);
        }
    };

    const EvaluationForm = ({ sub }) => {
        // Se for um DESAFIO
        if (eventData?.type === 'challenge') {
            return (
                <form className="evaluation-form" onSubmit={(e) => handleGradeSubmit(e, sub.submission_id)}>
                    <label htmlFor={`validation_status-${sub.submission_id}`}>Status do Desafio:</label>
                    <select id={`validation_status-${sub.submission_id}`} name="validation_status" required>
                        <option value="" disabled>Selecione um status...</option>
                        <option value="aprovado">Aprovado (Conceder Selo)</option>
                        <option value="reprovado">Reprovado</option>
                    </select>

                    <label htmlFor={`score-${sub.submission_id}`}>Nota (Opcional, para referência):</label>
                    <input type="number" id={`score-${sub.submission_id}`} name="score" defaultValue="1" />

                    <label htmlFor={`feedback-${sub.submission_id}`}>Feedback para o Atleta (Opcional):</label>
                    <textarea id={`feedback-${sub.submission_id}`} name="feedback" rows="2"></textarea>
                    <button type="submit" className="save-grade-button">Salvar Avaliação</button>
                </form>
            );
        }

        // Se for uma COMPETIÇÃO
        return (
            <form className="evaluation-form" onSubmit={(e) => handleGradeSubmit(e, sub.submission_id)}>
                <label htmlFor={`score-${sub.submission_id}`}>Nota (ex: 0-1000):</label>
                <input type="number" id={`score-${sub.submission_id}`} name="score" required />
                <label htmlFor={`feedback-${sub.submission_id}`}>Feedback para o Atleta (Opcional):</label>
                <textarea id={`feedback-${sub.submission_id}`} name="feedback" rows="2"></textarea>
                <button type="submit" className="save-grade-button">Salvar Nota</button>
            </form>
        );
    };

    if (isLoading) return <div className="analyze-page-container">Carregando submissões...</div>;
    if (error) return <div className="analyze-page-container" style={{color: 'red'}}>{error}</div>;


    return (
        <div className="analyze-page-container">
            <h1 className="analyze-page-title">Analisar Envios: {eventData?.name}</h1>

            {submissions.length === 0 ? (
                <p>Nenhuma prova foi enviada para esta competição ainda.</p>
            ) : (
                <div className="submission-list">
                    {submissions.map(sub => (
                        <article key={sub.submission_id} className="submission-item-card">
                            <header className="submission-header">
                                <div className="athlete-info">
                                    <img src={sub.athlete_photo_url || 'https://via.placeholder.com/50'} alt={sub.athlete_username} className="athlete-photo"/>
                                    <h3>{sub.athlete_username}</h3>
                                </div>
                                <span className="submission-date">Enviado em: {new Date(sub.submission_date).toLocaleString('pt-BR')}</span>
                            </header>

                            <div className="submission-video-link">
                                <strong>Link do Vídeo:</strong> <a href={sub.video_url} target="_blank" rel="noopener noreferrer">{sub.video_url}</a>
                            </div>

                            {sub.athlete_comments && <p className="submission-comments"><strong>Comentários do Atleta:</strong> {sub.athlete_comments}</p>}

                            {sub.evaluation_date ? (
                                <div className="graded-feedback">
                                    <h4>Avaliado</h4>
                                    <p><strong>Status:</strong> <span className={`status-badge status-${sub.validation_status}`}>{sub.validation_status}</span></p>
                                    <p><strong>Nota:</strong> {sub.score}</p>
                                    {sub.creator_feedback && <p><strong>Seu Feedback:</strong> {sub.creator_feedback}</p>}
                                </div>
                            ) : (
                               <EvaluationForm sub={sub} />
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnalyzeSubmissionsPage;