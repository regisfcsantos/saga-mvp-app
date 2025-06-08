// client/src/pages/AnalyzeSubmissionsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './AnalyzeSubmissionsPage.css';

const AnalyzeSubmissionsPage = () => {
    const { competitionId } = useParams();
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    // Poderíamos buscar os dados da competição também para mostrar o nome
    const [competitionName, setCompetitionName] = useState('');

    const fetchSubmissions = useCallback(async () => {
        setIsLoading(true);
        try {
            // Busca o nome da competição
            const compResponse = await axios.get(`/api/competitions/${competitionId}`);
            setCompetitionName(compResponse.data.name);

            // Busca as submissões
            const subResponse = await axios.get(`/api/competitions/${competitionId}/submissions`);
            setSubmissions(subResponse.data);
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
        const score = form.score.value;
        const creator_feedback = form.feedback.value;

        try {
            await axios.put(`/api/submissions/${submissionId}/grade`, { score, creator_feedback });
            alert('Avaliação salva com sucesso!');
            fetchSubmissions(); // Recarrega para mostrar a nota salva
        } catch (err) {
            console.error("Erro ao salvar avaliação:", err);
            alert(`Falha ao salvar: ${err.response?.data?.message || 'Erro desconhecido'}`);
        }
    };

    if (isLoading) return <div className="analyze-page-container">Carregando submissões...</div>;
    if (error) return <div className="analyze-page-container" style={{color: 'red'}}>{error}</div>;

    return (
        <div className="analyze-page-container">
            <h1 className="analyze-page-title">Analisar Envios: {competitionName}</h1>

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

                            {sub.score !== null ? (
                                <div className="graded-feedback">
                                    <h4>Avaliado</h4>
                                    <p><strong>Nota:</strong> {sub.score}</p>
                                    {sub.creator_feedback && <p><strong>Seu Feedback:</strong> {sub.creator_feedback}</p>}
                                </div>
                            ) : (
                                <form className="evaluation-form" onSubmit={(e) => handleGradeSubmit(e, sub.submission_id)}>
                                    <label htmlFor={`score-${sub.submission_id}`}>Nota (ex: 0-100):</label>
                                    <input type="number" id={`score-${sub.submission_id}`} name="score" required />

                                    <label htmlFor={`feedback-${sub.submission_id}`}>Feedback para o Atleta (Opcional):</label>
                                    <textarea id={`feedback-${sub.submission_id}`} name="feedback" rows="2"></textarea>

                                    <button type="submit" className="save-grade-button">Salvar Nota</button>
                                </form>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnalyzeSubmissionsPage;