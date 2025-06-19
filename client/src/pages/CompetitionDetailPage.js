// client/src/pages/CompetitionDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CompetitionActionPanel from '../components/CompetitionActionPanel'; // <<--- IMPORTE O NOVO PAINEL
import './CompetitionDetailPage.css';

const CompetitionDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const [competition, setCompetition] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [inscriptionError, setInscriptionError] = useState('');
    const [userInscription, setUserInscription] = useState(null);
    const [ranking, setRanking] = useState([]);

    useEffect(() => {
        // ... (o useEffect para buscar dados permanece o mesmo)
        const fetchCompetitionAndInscription = async () => {
            window.scrollTo(0, 0);
            setIsLoading(true);
            try {
                const [compResponse, rankingResponse] = await Promise.all([
                    axios.get(`/api/competitions/${id}`),
                    axios.get(`/api/competitions/${id}/ranking`)
                ]);

                setCompetition(compResponse.data);
                setRanking(rankingResponse.data);

                if (currentUser) {
                    const inscResponse = await axios.get(`/api/inscriptions/status/${id}`);
                    setUserInscription(inscResponse.data.status ? inscResponse.data : null);
                }
            } catch (err) {
                setError(err.response?.data?.message || `Não foi possível encontrar os dados da competição.`);
            } finally {
                setIsLoading(false);
            }
        };
        if (id) {
            fetchCompetitionAndInscription();
        }
    }, [id, currentUser]);

    // A função de inscrição agora está mais simples
    const handleInscription = async () => {
        if (!currentUser) {
            alert("Você precisa fazer login para se inscrever.");
            navigate('/login', { state: { from: location } });
            return;
        }

        setInscriptionError('');
        try {
            const response = await axios.post(`/api/inscriptions/compete/${id}`);
            // Atualiza o estado local para refletir a nova inscrição pendente
            setUserInscription(response.data.inscription); 
        } catch (err) {
            setInscriptionError(err.response?.data?.message || 'Falha ao se inscrever. Tente novamente.');
        }
    };

    if (isLoading) return <div className="loading-container">Carregando...</div>;
    if (error) return <div className="error-container">Erro: {error}</div>;
    if (!competition) return <div className="loading-container">Competição não encontrada.</div>;

    return (
        <div className="detail-page-container">
            <img 
                src={competition.banner_image_url || 'https://via.placeholder.com/960x320?text=SAGA'} 
                alt={`Banner de ${competition.name}`} 
                className="detail-banner"
            />
            {/* ... (o cabeçalho com título e logo continua o mesmo) ... */}
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

            {/* Link de Gerenciamento para o admin/criador */}
            {currentUser && (currentUser.id === competition.creator_id || currentUser.role === 'admin') && (
                 <div style={{ padding: '15px 30px', backgroundColor: '#fff3cd', borderBottom: '1px solid #eee' }}>
                    <Link to={`/competicoes/${id}/gerenciar-inscricoes`} style={{fontWeight: 'bold', textDecoration: 'none'}}>
                        Gerenciar Inscrições
                    </Link>
                </div>
            )}

            <div className="detail-content-grid">
                <main className="detail-main-content">
                    {/* AQUI ESTÁ A MÁGICA: O painel dinâmico substitui a lógica antiga */}
                    <section className="detail-section">
                        <CompetitionActionPanel 
                            competition={competition}
                            userInscription={userInscription}
                            onInscription={handleInscription}
                        />
                        {inscriptionError && <p className="form-error-message">{inscriptionError}</p>}
                    </section>
                    
                    {/* ... (as seções de Descrição, Regras, Premiação e Ranking continuam as mesmas) ... */}
                     <section className="detail-section">
                        <h2>Descrição</h2>
                        <p>{competition.description || 'Nenhuma descrição fornecida.'}</p>
                    </section>
                    <section className="detail-section">
                        <h2>Regras</h2>
                        <p>{competition.rules || 'Nenhuma regra fornecida.'}</p>
                    </section>
                    {/* ... etc ... */}
                </main>

                <aside className="detail-sidebar">
                    {/* As informações da sidebar agora são apenas de consulta */}
                    <section className="detail-section">
                        <h3>Datas Importantes</h3>
                        <ul>
                            <li><strong>Inscrições:</strong> {new Date(competition.inscription_start_date).toLocaleDateString('pt-BR')} até {new Date(competition.inscription_end_date).toLocaleDateString('pt-BR')}</li>
                            <li><strong>Envio de Provas:</strong> {new Date(competition.submission_start_date).toLocaleDateString('pt-BR')} até {new Date(competition.submission_end_date).toLocaleDateString('pt-BR')}</li>
                            <li><strong>Resultados:</strong> {new Date(competition.results_date).toLocaleDateString('pt-BR')}</li>
                        </ul>
                    </section>
                     {/* ... (outras seções da sidebar como Patrocinadores e Contato) ... */}
                </aside>
            </div>
        </div>
    );
};

export default CompetitionDetailPage;