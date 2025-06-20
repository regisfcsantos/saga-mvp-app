// client/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom'; // useParams é a chave aqui
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './ProfilePage.css';

const ProfilePage = () => {
    const { username } = useParams(); // Pega o :username da URL, se existir
    const { currentUser, isLoading: authLoading, setCurrentUser } = useAuth(); // Usuário logado

    const [viewedUser, setViewedUser] = useState(null); // O usuário do perfil que estamos vendo
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [requestBoxError, setRequestBoxError] = useState('');
    const [requestBoxSuccess, setRequestBoxSuccess] = useState('');

    const isMyProfile = !username || (currentUser && currentUser.username === username);

    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            setError('');
            try {
                let profileData;
                if (isMyProfile) {
                    // Se é meu perfil, uso os dados do AuthContext
                    // Mas preciso fazer uma chamada para pegar as listas de competições/inscrições
                    const response = await axios.get(`/api/users/profile/${currentUser.username}`);

                    console.log('--- FRONTEND (PASSO 3) --- Resposta da API recebida:', response.data);

                    profileData = response.data;
                } else {
                    // Se é o perfil de outra pessoa, busco os dados dela pela API
                    const response = await axios.get(`/api/users/profile/${username}`);
                    profileData = response.data;
                }
                setViewedUser(profileData);
            } catch (err) {
                console.error("Erro ao carregar dados do perfil:", err);
                setError(err.response?.data?.message || "Não foi possível carregar o perfil.");
            } finally {
                setIsLoading(false);
            }
        };

        // Só busca se tivermos as informações necessárias (currentUser para "meu perfil" ou username para público)
        if (!authLoading && (isMyProfile ? currentUser : username)) {
            fetchProfileData();
        } else if (!authLoading) {
            // Se não está logado e tenta ver /perfil, não faz nada (ProtectedRoute já redireciona)
            // Se tenta ver um perfil público, o username existe e a busca é feita.
            setIsLoading(false);
        }

    }, [username, currentUser, isMyProfile, authLoading]); // Roda quando qualquer um destes mudar

    const handleRequestBoxRole = async () => {
        setRequestBoxError('');
        setRequestBoxSuccess('');
        if (!window.confirm("Você tem certeza que quer solicitar para se tornar um Box? Seu perfil será enviado para análise.")) {
            return;
        }
        try {
            const response = await axios.put('/api/users/me/request-box-role');
            // Atualiza o estado local do usuário para refletir a mudança imediatamente
            setCurrentUser(prevUser => ({
                ...prevUser,
                role: 'box',
                is_box_approved: false
            }));
            setRequestBoxSuccess(response.data.message || 'Solicitação enviada com sucesso! Aguarde a aprovação do administrador.');
        } catch (err) {
            console.error("Erro ao solicitar ser Box:", err);
            setRequestBoxError(err.response?.data?.message || 'Falha ao enviar solicitação.');
        }
    };

    const handleDeleteCompetition = async (compId, compName) => {
        if (window.confirm(`Você tem certeza que quer excluir a competição "${compName}"? Esta ação não pode ser desfeita.`)) {
            try {
                await axios.delete(`/api/competitions/${compId}`);
                alert('Competição excluída com sucesso!');
                // Refresca os dados do perfil para remover a competição da lista
                // Isso pode ser melhorado para não buscar tudo de novo, mas para o MVP é eficaz.
                window.location.reload(); 
            } catch (error) {
                console.error("Erro ao excluir competição:", error);
                alert(`Falha ao excluir competição: ${error.response?.data?.message || 'Erro desconhecido'}`);
            }
        }
    };

    if (isLoading || authLoading) return <div className="profile-page-container">Carregando perfil...</div>;
    if (error) return <div className="profile-page-container" style={{color: 'red'}}>Erro: {error}</div>;
    if (!viewedUser) return <div className="profile-page-container">Usuário não encontrado.</div>;

    return (
        <div className="profile-page-container">
            <div className="profile-card">
                <img 
                    src={viewedUser.profile_photo_url || '/default-avatar.png'} 
                    alt="Perfil" 
                    className="profile-card-image"
                />
                <h1 className="profile-card-name">{viewedUser.username}</h1>
                <p className="profile-card-subtitle">{viewedUser.tipo_esporte || 'Atleta'}</p>
                
                <div className="profile-stats-container">
                    <div className="profile-stat-box">
                        <span className="value">{viewedUser.role}</span>
                        <span className="label">Tipo de Usuário</span>
                    </div>
                    <div className="profile-stat-box">
                        <span className="value">N/A</span>
                        <span className="label">Score Global</span>
                    </div>
                </div>
            </div>

            {/* Card de Competições Criadas */}
            {viewedUser.role === 'box' && viewedUser.created_competitions?.length > 0 && (
                <div className="profile-content-card">
                    <h3>Competições Criadas</h3>
                    <table className="my-competitions-table">
                        <thead>
                            <tr>
                                <th>Competição</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viewedUser.created_competitions.map(comp => (
                                <tr key={comp.id}>
                                    <td data-label="Competição"><strong>{comp.name}</strong></td>
                                    <td data-label="Status"><span className={`status-badge status-${comp.status}`}>{comp.status.replace('_', ' ')}</span></td>
                                    <td data-label="Ações">
                                        <div className="competition-item-actions">
                                            <Link to={`/competicoes/${comp.id}`} className="action-button primary">Ver</Link>
                                            {isMyProfile && (
                                                <>
                                                    <Link to={`/competicoes/${comp.id}/gerenciar-inscricoes`} className="action-button primary">Gerenciar</Link>
                                                    <Link to={`/editar-competicao/${comp.id}`} className="action-button secondary">Editar</Link>
                                                    <button onClick={() => handleDeleteCompetition(comp.id, comp.name)} className="action-button destructive">Excluir</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Card de Inscrições */}
            {viewedUser.inscriptions?.length > 0 && (
                <div className="profile-content-card">
                    <h3>Minhas Inscrições</h3>
                    <table className="my-competitions-table">
                       <thead>
                            <tr>
                                <th>Competição</th>
                                <th>Status da Inscrição</th>
                                <th>Prova</th> {/* <<--- NOVA COLUNA */}
                            </tr>
                        </thead>
                        <tbody>
                            {viewedUser.inscriptions.map(insc => (
                                <tr key={insc.inscription_id}>
                                    <td data-label="Competição"><strong>
                                        <Link to={`/competicoes/${insc.competition_id}`} style={{fontWeight: 'bold', textDecoration: 'none'}}>
                                            {insc.competition_name}
                                        </Link>
                                    </strong></td>
                                    <td data-label="Status da Inscrição"><span className={`status-badge status-${insc.inscription_status}`}>{insc.inscription_status.replace(/_/g, ' ')}</span></td>
                                    <td data-label="Prova">
                                        {/* <<--- CÉLULA CONDICIONAL PARA O LINK DO VÍDEO ---<<< */}
                                        {insc.video_url ? (
                                            <a href={insc.video_url} target="_blank" rel="noopener noreferrer" className="youtube-link-icon" title="Ver vídeo da prova">
                                                <i className="fab fa-youtube"></i> Ver Prova
                                            </a>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Card de Ações (Aparece apenas no seu próprio perfil) */}
            {isMyProfile && (
                <div className="profile-content-card">
                    <h3>Ações</h3>
                    <div className="profile-actions">
                        <Link to="/editar-perfil" className="edit-profile-button">Editar Perfil</Link>
                        {currentUser.role === 'atleta' && (
                             <button onClick={handleRequestBoxRole} className="request-box-button">
                                Solicitar ser um Box
                            </button>
                        )}
                        {currentUser.role === 'box' && currentUser.is_box_approved && (
                            <Link to="/criar-competicao" className="create-competition-button">
                                + Criar Nova Competição
                            </Link>
                        )}
                         {currentUser.role === 'admin' && (
                            <Link to="/admin/aprovar-boxes" className="action-button manage">Painel Admin</Link>
                        )}
                        {requestBoxError && <p style={{color: 'red', textAlign:'center'}}>{requestBoxError}</p>}
                        {requestBoxSuccess && <p style={{color: 'green', textAlign:'center'}}>{requestBoxSuccess}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;