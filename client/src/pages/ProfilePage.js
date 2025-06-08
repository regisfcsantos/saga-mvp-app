// client/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom'; // useParams é a chave aqui
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './ProfilePage.css';

const ProfilePage = () => {
    const { username } = useParams(); // Pega o :username da URL, se existir
    const { currentUser, isLoading: authLoading } = useAuth(); // Usuário logado

    const [viewedUser, setViewedUser] = useState(null); // O usuário do perfil que estamos vendo
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Determina se estamos vendo nosso próprio perfil
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

    if (isLoading || authLoading) return <div className="profile-page-container">Carregando perfil...</div>;
    if (error) return <div className="profile-page-container" style={{color: 'red'}}>Erro: {error}</div>;
    if (!viewedUser) return <div className="profile-page-container">Usuário não encontrado.</div>;

    // A partir daqui, usamos 'viewedUser' para exibir os dados.
    // E 'isMyProfile' para decidir se mostramos os botões de ação.

    return (
        <div className="profile-page-container">
            <h2>Perfil de {viewedUser.username}</h2>
            {viewedUser.profile_photo_url && (
                <img src={viewedUser.profile_photo_url} alt="Perfil" className="profile-image"/>
            )}

            <p><strong>Bio:</strong> {viewedUser.bio || "Nenhuma bio definida."}</p>
            {/* Mostra status de Box apenas se o perfil for de um Box */}
            {viewedUser.role === 'box' && (
                <p><strong>Status de Box:</strong> {viewedUser.is_box_approved ? <span style={{color: 'green'}}>Aprovado</span> : <span style={{color: '#ffa000'}}>Pendente</span>}</p>
            )}

            {/* Botões de ação SÓ aparecem se for o meu perfil */}
            {isMyProfile && (
                <div style={{margin: '20px 0'}}>
                    <Link to="/editar-perfil" className="edit-profile-button">Editar Perfil</Link>
                    {currentUser.role === 'atleta' && (
                        <button onClick={() => alert('Lógica de solicitar ser box a ser implementada aqui se necessário.')} className="request-box-button" style={{marginLeft: '10px'}}>
                            Solicitar ser um Box
                        </button>
                    )}
                </div>
            )}

            {/* Lista de Competições Criadas (se for um Box aprovado) */}
            {viewedUser.role === 'box' && viewedUser.is_box_approved && viewedUser.created_competitions?.length > 0 && (
                <div className="profile-section">
                    <h3>Competições Criadas</h3>
                    <table className="my-competitions-table">
                        {/* ... (cabeçalho da tabela) ... */}
                        <tbody>
                            {viewedUser.created_competitions.map(comp => (
                                <tr key={comp.id}>
                                    <td><strong>{comp.name}</strong></td>
                                    <td><span className={`status-badge status-${comp.status}`}>{comp.status}</span></td>
                                    <td>
                                        <div className="competition-item-actions">
                                            <Link to={`/competicoes/${comp.id}`} className="action-button view">Ver</Link>
                                            {/* Botões de gerenciamento SÓ aparecem se for o meu perfil */}
                                            {isMyProfile && (
                                                <>
                                                    <Link to={`/competicoes/${comp.id}/gerenciar-inscricoes`} className="action-button manage">Gerenciar</Link>
                                                    <Link to={`/editar-competicao/${comp.id}`} className="action-button edit">Editar</Link>
                                                    <button onClick={() => alert('Lógica de deletar a ser implementada aqui.')} className="action-button delete">Excluir</button>
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

            {/* Lista de Inscrições do Atleta */}
            {viewedUser.inscriptions?.length > 0 && (
                <div className="profile-section">
                    <h3>Inscrições em Competições</h3>
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
                                    <td><strong>
                                        <Link to={`/competicoes/${insc.competition_id}`} style={{fontWeight: 'bold', textDecoration: 'none'}}>
                                            {insc.competition_name}
                                        </Link>
                                    </strong></td>
                                    <td><span className={`status-badge status-${insc.inscription_status}`}>{insc.inscription_status.replace(/_/g, ' ')}</span></td>
                                    <td>
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
        </div>
    );
};

export default ProfilePage;