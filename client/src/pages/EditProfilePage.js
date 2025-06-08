// client/src/pages/EditProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './EditProfilePage.css'; // Crie este arquivo para estilos

const EditProfilePage = () => {
    const { currentUser, setCurrentUser, isLoading } = useAuth(); // setCurrentUser para atualizar o contexto
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || '');
            setBio(currentUser.bio || '');
            setProfilePhotoUrl(currentUser.profile_photo_url || '');
        }
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (bio.length > 280) {
            setError('A biografia não pode exceder 280 caracteres.');
            return;
        }

        // No MVP, username pode ser mais complexo de alterar devido à unicidade.
        // Vamos focar em bio e profile_photo_url (como texto por enquanto).
        const profileDataToUpdate = {
            bio: bio,
            // profile_photo_url: profilePhotoUrl, // Descomente se quiser permitir edição da URL da foto
            // username: username // Descomente se quiser permitir edição do username (requer mais validação no backend)
        };

        try {
            const response = await axios.put('/api/users/me', profileDataToUpdate, {
                headers: {
                    // Se sua API PUT /api/users/me precisar de autenticação via token no header,
                    // você precisará adicioná-lo. Com sessões baseadas em cookies (configuração atual do Passport),
                    // o cookie de sessão geralmente é enviado automaticamente pelo navegador.
                }
            });

            setCurrentUser(prevUser => ({ ...prevUser, ...response.data })); // Atualiza o usuário no AuthContext
            setSuccess('Perfil atualizado com sucesso!');
            // setTimeout(() => navigate('/perfil'), 2000); // Opcional: redireciona após um tempo
        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            setError(err.response?.data?.message || 'Falha ao atualizar o perfil. Tente novamente.');
        }
    };

    if (isLoading) {
        return <div className="container">Carregando...</div>;
    }
    if (!currentUser) {
        // Normalmente, ProtectedRoute cuidaria disso, mas como fallback:
        navigate('/login');
        return null; 
    }

    return (
        <div className="container">
            <h2>Editar Perfil</h2>
            {error && <p className="errorMessage" >{error}</p>}
            {success && <p className="successMessage">{success}</p>}
            <form onSubmit={handleSubmit}>
                <div className="formGroup">
                    <label htmlFor="username">Nome de Usuário:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled // MVP: Deixar username desabilitado para evitar problemas de unicidade por enquanto
                    />
                    <small>O nome de usuário não pode ser alterado nesta versão.</small>
                </div>
                <div className="formGroup">
                    <label htmlFor="bio">Bio (até 280 caracteres):</label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={280}
                    />
                </div>
                <div className="formGroup">
                    <label htmlFor="profilePhotoUrl">URL da Foto de Perfil:</label>
                    <input
                        type="text"
                        id="profilePhotoUrl"
                        value={profilePhotoUrl}
                        onChange={(e) => setProfilePhotoUrl(e.target.value)}
                        disabled // Para login social, a foto vem do provedor. Deixar desabilitado por enquanto.
                    />
                     <small>A foto de perfil é gerenciada pelo seu provedor de login social (Google/Facebook).</small>
                </div>
                <button type="submit">Salvar Alterações</button>
                <button type="button" className="buttonCancel" onClick={() => navigate('/perfil')}>
                    Cancelar
                </button>
            </form>
        </div>
    );
};

export default EditProfilePage;