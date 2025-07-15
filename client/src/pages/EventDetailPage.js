// client/src/pages/EventDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CompetitionActionPanel from '../components/CompetitionActionPanel';
import './CompetitionDetailPage.css';
import './ProfilePage.css';

// Renomeamos o componente para refletir sua nova função
const EventDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const [event, setEvent] = useState(null); // Estado renomeado de 'competition' para 'event'
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [inscriptionError, setInscriptionError] = useState('');
    const [userInscription, setUserInscription] = useState(null);
    const [ranking, setRanking] = useState([]);

    const fetchEventData = async () => {
        window.scrollTo(0, 0);
        setIsLoading(true);
        try {
            // A rota da API é a mesma para buscar competições ou desafios
            const eventResponse = await axios.get(`/api/competitions/${id}`);
            const fetchedEvent = eventResponse.data;
            setEvent(fetchedEvent);

            const rankingResponse = await axios.get(`/api/competitions/${id}/ranking`);
            setRanking(rankingResponse.data);

            // A busca de status de inscrição continua a mesma
            if (currentUser) {
                const inscResponse = await axios.get(`/api/inscriptions/status/${id}`);
                setUserInscription(inscResponse.data.status ? inscResponse.data : null);
            }
        } catch (err) {
            setError(err.response?.data?.message || `Não foi possível encontrar os dados do evento.`);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (id) {
            fetchEventData();
        }
    }, [id, currentUser]);

    // A função de inscrição não precisa de mudanças
    const handleInscription = async () => {
        if (!currentUser) {
            alert("Você precisa fazer login para se inscrever.");
            navigate('/login', { state: { from: location } });
            return;
        }

        setInscriptionError('');
        try {
            await axios.post(`/api/inscriptions/compete/${id}`);
            fetchEventData();
        } catch (err) {
            setInscriptionError(err.response?.data?.message || 'Falha ao se inscrever. Tente novamente.');
        }
    };

    const handleResetChallenge = async () => {
        if (!userInscription || !window.confirm("Tem certeza que deseja participar novamente? Sua pontuação anterior será removida do ranking e você poderá enviar uma nova prova.")) {
            return;
        }
        try {
            await axios.post(`/api/inscriptions/${userInscription.id}/reset-challenge`);
            alert("Tudo certo! Pode enviar sua nova tentativa.");
            fetchEventData(); // Recarrega tudo para mostrar o formulário de envio novamente
        } catch (err) {
            alert(err.response?.data?.message || "Não foi possível resetar sua participação.");
        }
    };

    if (isLoading) return <div className="loading-container">Carregando...</div>;
    if (error) return <div className="error-container">Erro: {error}</div>;
    if (!event) return <div className="loading-container">Evento não encontrado.</div>;

    // Variável de ajuda para facilitar a leitura do código condicional
    const isCompetition = event.type === 'competition';
    const hasBeenEvaluated = event.type === 'challenge' && userInscription?.evaluation_date;

    return (
        <div className="detail-page-container">
            <img 
                src={event.banner_image_url || 'https://via.placeholder.com/960x320?text=SAGA'} 
                alt={`Banner de ${event.name}`} 
                className="detail-banner"
            />
            <div className="detail-header">
                {event.logo_image_url && <img src={event.logo_image_url} alt="Logo do Evento" className="detail-logo" />}
                <div className="detail-title-section">
                    <h1>{event.name}</h1>
                    {event.creator_username && (
                        <p className="detail-creator-info">
                            Criado por: <Link to={`/perfil/${event.creator_username}`}>{event.creator_username}</Link>
                        </p>
                    )}
                </div>
            </div>

            {/* O link de gerenciamento continua funcionando como antes */}
            {currentUser && (currentUser.id === event.creator_id || currentUser.role === 'admin') && (
                 <div style={{ padding: '15px 30px', backgroundColor: '#f7f7f7', borderBottom: '1px solid #eee', display: 'flex', gap: '10px' }}>
                    <Link to={`/competicoes/${id}/gerenciar-inscricoes`} className="action-button primary">
                        Gerenciar
                    </Link>
                    <Link to={`/competicoes/${id}/analisar-envios`} className="action-button secondary">
                        Analisar Envios
                    </Link>
                </div>
            )}

            <div className="detail-content-grid">
                <main className="detail-main-content">
                    
                    {hasBeenEvaluated ? (
                        <div className="action-panel">
                            <h3>Você já participou!</h3>
                            <p>Sua pontuação foi registrada no ranking. Deseja tentar melhorar sua marca?</p>
                            <button onClick={handleResetChallenge} className="inscription-button">
                                Participar Novamente
                            </button>
                        </div>
                    ) : (
                        <section className="detail-section">
                            <CompetitionActionPanel 
                                competition={event}
                                userInscription={userInscription}
                                onInscription={handleInscription}
                                currentUser={currentUser}
                            />
                            {inscriptionError && <p className="form-error-message">{inscriptionError}</p>}
                        </section>
                    )}
                    
                    <section className="detail-section">
                        <h2>Descrição</h2>
                        <p>{event.description || 'Nenhuma descrição fornecida.'}</p>
                    </section>
                    <section className="detail-section">
                        <h2>Regras</h2>
                        <p>{event.rules || 'Nenhuma regra fornecida.'}</p>
                    </section>
                    <section className="detail-section">
                        <h2>Premiação</h2>
                        <p>{event.awards_info || 'Nenhuma informação sobre premiação.'}</p>
                    </section>
                    
                    {ranking.length > 0 && (
                        <section className="detail-section">
                            <h2>Ranking</h2>
                            <ol className="ranking-list">
                                {ranking.map((rank, index) => (
                                    <li key={rank.submission_id || index} className="ranking-item">
                                        <span className="ranking-position">{index + 1}º</span>
                                        <div className="ranking-athlete-info">
                                            <img src={rank.athlete_photo || '/default-avatar.png'} alt={rank.athlete_username} className="ranking-athlete-photo"/>
                                            <span className="ranking-athlete-name" title={rank.athlete_username}>
                                                {rank.athlete_username.length > 13 ? rank.athlete_username.slice(0, 13) + '...' : rank.athlete_username}
                                            </span>
                                        </div>
                                        <span className="ranking-score">{rank.score}</span>
                                        {rank.video_url && (
                                            <a href={rank.video_url} target="_blank" rel="noopener noreferrer" className="youtube-link-icon" title="Ver vídeo da prova">
                                                <i className="fab fa-youtube"></i>
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )}
                </main>

                <aside className="detail-sidebar">
                    {/* Seção de Datas agora é condicional */}
                    {isCompetition && (
                        <section className="detail-section">
                            <h3>Datas Importantes</h3>
                            <ul>
                                <li><strong>Inscrições:</strong> {new Date(event.inscription_start_date).toLocaleDateString('pt-BR')} até {new Date(event.inscription_end_date).toLocaleDateString('pt-BR')}</li>
                                <li><strong>Envio de Provas:</strong> {new Date(event.submission_start_date).toLocaleDateString('pt-BR')} até {new Date(event.submission_end_date).toLocaleDateString('pt-BR')}</li>
                                <li><strong>Resultados:</strong> {new Date(event.results_date).toLocaleDateString('pt-BR')}</li>
                            </ul>
                        </section>
                    )}
                    <section className="detail-section">
                        <h3>Patrocinadores</h3>
                        <p>{event.sponsors_info || 'Sem patrocinadores informados.'}</p>
                    </section>
                    <section className="detail-section">
                        <h3>Contato</h3>
                        <p>{event.contact_details || 'Nenhum contato fornecido.'}</p>
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default EventDetailPage;