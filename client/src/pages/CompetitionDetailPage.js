// client/src/pages/CompetitionDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './CompetitionDetailPage.css'; // Importa os estilos que acabamos de criar

const CompetitionDetailPage = () => {
    const { id } = useParams(); // Pega o 'id' da URL (ex: /competicoes/1)
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth(); // Pega o usuário logado para verificações futuras
    const [competition, setCompetition] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [inscriptionError, setInscriptionError] = useState('');
    const [userInscription, setUserInscription] = useState(null);
    const [hasSubmitted, setHasSubmitted] = useState(false); // Para saber se já enviou vídeo
    const [videoUrl, setVideoUrl] = useState('');
    const [athleteComments, setAthleteComments] = useState('');
    const [submissionError, setSubmissionError] = useState('');
    const [submissionSuccess, setSubmissionSuccess] = useState('');
    const [ranking, setRanking] = useState([]); 

    useEffect(() => {
        const fetchCompetitionAndInscription = async () => {
            window.scrollTo(0, 0);
            setIsLoading(true);
            try {
                // Usaremos Promise.all para buscar dados da competição e do ranking em paralelo
                const [compResponse, rankingResponse] = await Promise.all([
                    axios.get(`/api/competitions/${id}`),
                    axios.get(`/api/competitions/${id}/ranking`) // Busca da nova rota de ranking
                ]);

                setCompetition(compResponse.data);
                setRanking(rankingResponse.data);

                // Se houver um usuário logado, busca o status da inscrição dele
                if (currentUser) {
                    const inscResponse = await axios.get(`/api/inscriptions/status/${id}`);
                    if (inscResponse.data && inscResponse.data.status) {
                        setUserInscription(inscResponse.data);
                        // Aqui podemos verificar futuramente se já existe uma submissão para esta inscrição
                    }
                }
            } catch (err) {
                console.error(`Erro ao buscar dados da página da competição ${id}:`, err);
                setError(err.response?.data?.message || `Não foi possível encontrar os dados da competição.`);
            } finally {
                setIsLoading(false);
            }
        };
        if (id) {
            fetchCompetitionAndInscription();
        }
    }, [id, currentUser]); // Roda se o ID ou o usuário logado mudar

    const handleVideoSubmitOrUpdate = async (e) => {
        e.preventDefault();
        // ... (lógica para limpar erros/sucesso e validar se videoUrl existe)

        const submissionData = {
            video_url: videoUrl,
            athlete_comments: athleteComments
        };

        try {
            let response;
            if (userInscription.submission_id) {
                // MODO EDIÇÃO: Já existe uma submissão, então fazemos PUT para atualizar
                response = await axios.put(`/api/submissions/${userInscription.submission_id}`, submissionData);
                alert("Prova atualizada com sucesso!");
            } else {
                // MODO CRIAÇÃO: Não há submissão, fazemos POST para criar
                submissionData.inscription_id = userInscription.id;
                response = await axios.post('/api/submissions/', submissionData);
                alert("Prova enviada com sucesso!");
            }

            // Recarrega os dados da página para refletir a mudança
            // (O ideal seria atualizar o estado localmente, mas recarregar é mais simples para o MVP)
            window.location.reload(); 

        } catch (err) {
            console.error("Erro no envio/atualização da prova:", err);
            setSubmissionError(err.response?.data?.message || 'Falha ao processar sua prova.');
        }
    };

    const handleInscription = async () => {
        setInscriptionError('');

        if (!currentUser) {
            // Se o usuário não estiver logado, redireciona para a página de login.
            // state: { from: location } ajuda a redirecionar de volta para esta página após o login.
            alert("Você precisa fazer login para se inscrever.");
            navigate('/login', { state: { from: location } });
            return;
        }

        try {
            const response = await axios.post(`/api/inscriptions/compete/${id}`);
            alert(response.data.message); // Alerta de sucesso da pré-inscrição
            // Redireciona para a página de instruções de pagamento
            navigate('/pagamento/instrucoes', { state: { competitionName: competition.name } });
        } catch (err) {
            console.error("Erro no processo de inscrição:", err);
            setInscriptionError(err.response?.data?.message || 'Falha ao se inscrever. Tente novamente.');
        }
    };

    if (isLoading) return <div className="loading-container">Carregando detalhes da competição...</div>;
    if (error) return <div className="error-container">Erro: {error}</div>;
    if (!competition) return <div className="loading-container">Competição não encontrada.</div>;

    const isInscriptionOpen = competition.status === 'publicada' && competition.inscription_end_date ? new Date(competition.inscription_end_date) > new Date() : false;

    const isSubmissionPeriodOpen = competition.submission_start_date && competition.submission_end_date ?
        (new Date() > new Date(competition.submission_start_date) && new Date() < new Date(competition.submission_end_date))
        : false;

    // Condição para mostrar o formulário de submissão
    const canSubmit = userInscription && userInscription.status === 'confirmada' && isSubmissionPeriodOpen && !hasSubmitted;

    return (
        <div className="detail-page-container">
            <img 
                src={competition.banner_image_url || 'https://via.placeholder.com/960x320?text=SAGA'} 
                alt={`Banner de ${competition.name}`} 
                className="detail-banner"
            />

            <div className="detail-header">
                {competition.logo_image_url && <img src={competition.logo_image_url} alt="Logo da Competição" className="detail-logo" />}
                <div className="detail-title-section">
                    <h1>{competition.name}</h1>
                    {competition.creator_username && (
                        <p className="detail-creator-info">
                            Criado por: <Link to={`/perfil/${competition.creator_username}`}>{competition.creator_username}</Link>
                        </p>
                    )}
                </div>
            </div>

            {currentUser && (currentUser.id === competition.creator_id || currentUser.role === 'admin') && (
                <div style={{ padding: '15px 30px', backgroundColor: '#fff3cd', borderBottom: '1px solid #eee' }}>
                    <Link 
                        to={`/competicoes/${id}/gerenciar-inscricoes`} 
                        style={{fontWeight: 'bold', textDecoration: 'none'}}
                    >
                        Gerenciar Inscrições desta Competição
                    </Link>
                </div>
            )}

            <div className="detail-content-grid">
                <main className="detail-main-content">
                    <section className="detail-section">
                        <h2>Sua Prova</h2>
                        {userInscription && userInscription.status === 'confirmada' && isSubmissionPeriodOpen ? (
                            <form onSubmit={handleVideoSubmitOrUpdate} className="submission-form">
                                {userInscription.submission_id ? (
                                    <p>Você já enviou sua prova. Você pode editar o link e os comentários abaixo e salvar as alterações.</p>
                                ) : (
                                    <p>O período de envio de provas está aberto. Envie o link do seu vídeo abaixo. Boa sorte!</p>
                                )}
                                <div className="form-group-comp">
                                    <label htmlFor="videoUrl" className="form-label-comp">Link do Vídeo (YouTube, Vimeo, etc.):</label>
                                    <input
                                        type="url"
                                        id="videoUrl"
                                        className="form-input-comp"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://exemplo.com/meu-video"
                                        required
                                    />
                                </div>
                                <div className="form-group-comp">
                                    <label htmlFor="athleteComments" className="form-label-comp">Comentários (Opcional):</label>
                                    <textarea
                                        id="athleteComments"
                                        className="form-textarea-comp"
                                        rows="3"
                                        value={athleteComments}
                                        onChange={(e) => setAthleteComments(e.target.value)}
                                        placeholder="Alguma observação sobre seu envio?"
                                    ></textarea>
                                </div>
                                <button type="submit" className="inscription-button">
                                    {userInscription.submission_id ? 'Atualizar Envio' : 'Enviar Prova'}
                                </button>
                                {submissionError && <p className="form-error-message">{submissionError}</p>}
                            </form>
                        ) : (
                            <p>
                                {hasSubmitted ? "Você já enviou sua prova para esta competição."
                                : userInscription && userInscription.status === 'confirmada' ? "O período para envio de provas não está ativo."
                                : userInscription ? `Sua inscrição está com o status: ${userInscription.status}. Você precisa estar com a inscrição 'confirmada' para enviar.`
                                : "Você precisa estar inscrito e ter sua inscrição confirmada para enviar uma prova."
                                }
                            </p>
                        )}
                        {submissionSuccess && <p className="form-success-message">{submissionSuccess}</p>}
                    </section>
                    <section className="detail-section">
                        <h2>Descrição</h2>
                        <p>{competition.description || 'Nenhuma descrição fornecida.'}</p>
                    </section>
                    <section className="detail-section">
                        <h2>Regras</h2>
                        <p>{competition.rules || 'Nenhuma regra fornecida.'}</p>
                    </section>
                    <section className="detail-section">
                        <h2>Premiação</h2>
                        <p>{competition.awards_info || 'Nenhuma informação sobre premiação.'}</p>
                    </section>
                    <section className="detail-section">
                        <h2>Ranking</h2>
                        {ranking.length > 0 ? (
                            <ol className="ranking-list">
                                {ranking.map((player, index) => (
                                    <li key={player.athlete_username + index} className="ranking-item">
                                        <span className="ranking-position">{index + 1}º</span>
                                        <div className="ranking-athlete-info">
                                            <img src={player.athlete_photo_url || 'https://via.placeholder.com/45'} alt={player.athlete_username} className="ranking-athlete-photo" />
                                            <span className="ranking-athlete-name">{player.athlete_username}</span>
                                        </div>
                                        <div className="ranking-score">{player.score} pts</div>
                                        <a href={player.video_url} target="_blank" rel="noopener noreferrer" className="youtube-link-icon" title="Ver vídeo da prova">
                                            <i className="fab fa-youtube"></i>
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p>O ranking será divulgado após o período de avaliação das provas.</p>
                        )}
                    </section>
                </main>

                <aside className="detail-sidebar">
                    <section className="detail-section">
                        <h3>Inscrição</h3>
                        <p className={`price-tag ${parseFloat(competition.price) === 0 ? 'free' : ''}`}>
                            {parseFloat(competition.price) === 0 ? 'Grátis' : `R$ ${parseFloat(competition.price).toFixed(2)}`}
                        </p>
                        <button 
                        onClick={handleInscription}
                        className={`inscription-button ${!isInscriptionOpen ? 'closed' : ''}`} 
                        // CORREÇÃO: Remova '!currentUser' da condição disabled
                        disabled={!isInscriptionOpen} 
                        title={!isInscriptionOpen ? "Inscrições encerradas" : "Clique para se inscrever"}
                    >
                        {isInscriptionOpen ? 'Inscreva-se Agora' : 'Inscrições Encerradas'}
                    </button>
                        {inscriptionError && <p style={{color: 'red', marginTop: '10px'}}>{inscriptionError}</p>}
                         {!currentUser && <p style={{fontSize: '0.8em', textAlign: 'center', marginTop: '10px'}}>Faça <Link to="/login">login</Link> para se inscrever.</p>}
                    </section>
                    <section className="detail-section">
                        <h3>Datas Importantes</h3>
                        <ul>
                            <li><strong>Inscrições:</strong> {new Date(competition.inscription_start_date).toLocaleDateString('pt-BR')} até {new Date(competition.inscription_end_date).toLocaleDateString('pt-BR')}</li>
                            <li><strong>Envio de Provas:</strong> {new Date(competition.submission_start_date).toLocaleDateString('pt-BR')} até {new Date(competition.submission_end_date).toLocaleDateString('pt-BR')}</li>
                            <li><strong>Resultados:</strong> {new Date(competition.results_date).toLocaleDateString('pt-BR')}</li>
                        </ul>
                    </section>
                    {competition.sponsors_info && (
                        <section className="detail-section">
                            <h3>Patrocinadores</h3>
                            <p>{competition.sponsors_info}</p>
                        </section>
                    )}
                    {competition.contact_details && (
                         <section className="detail-section">
                            <h3>Contato</h3>
                            <p>{competition.contact_details}</p>
                        </section>
                    )}
                </aside>

            </div>
        </div>
    );
};

export default CompetitionDetailPage;