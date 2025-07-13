// client/src/pages/EditProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './EditProfilePage.css'; // Nosso novo CSS

const EditProfilePage = () => {
    const { currentUser, setCurrentUser, isLoading } = useAuth();
    const navigate = useNavigate();

    // Adicionamos o novo estado para o tipo de esporte
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [tipoEsporte, setTipoEsporte] = useState(''); // <<--- NOVO ESTADO
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || '');
            setBio(currentUser.bio || '');
            setTipoEsporte(currentUser.tipo_esporte || ''); // <<--- Popula o novo estado
        }
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        // Prepara os dados para enviar à API
        const profileDataToUpdate = {
            username: username,
            bio: bio,
            tipo_esporte: tipoEsporte,
        };

        try {
            // A rota PUT /api/users/me já está pronta para receber estes dados
            const response = await axios.put('/api/users/me', profileDataToUpdate);

            // Atualiza o usuário no AuthContext com os novos dados
            setCurrentUser(prevUser => ({ ...prevUser, ...response.data })); 
            
            setSuccess('Perfil atualizado com sucesso!');
            
            setTimeout(() => {
                 // Navega para o novo username, se ele mudou
                navigate(`/perfil/${response.data.username}`);
            }, 1500);

        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            setError(err.response?.data?.message || 'Falha ao atualizar o perfil. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="edit-profile-container">Carregando...</div>;
    }

    return (
        <div className="edit-profile-container">
            <h2>Editar Perfil</h2>
            
            <form className="edit-profile-form" onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <div className="form-group">
                    <label htmlFor="username">Nome de Usuário:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        maxLength="25"
                    />
                     <small>Pode conter apenas letras, números e _. Mínimo 3 caracteres.</small>
                </div>

                <div className="form-group">
                    <label htmlFor="tipoEsporte">Tipo de Esporte:</label>
                    <input
                        type="text"
                        id="tipoEsporte"
                        value={tipoEsporte}
                        onChange={(e) => setTipoEsporte(e.target.value)}
                        placeholder="Ex: Crossfit, Calistenia, LPO"
                    />
                    <small>O esporte que você pratica ou que seu Box representa.</small>
                </div>

                <div className="form-group">
                    <label htmlFor="bio">Bio (até 280 caracteres):</label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={280}
                    />
                </div>
                
                <div className="form-actions">
                    <button type="button" className="button-cancel" onClick={() => navigate(-1)} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button type="submit" className="button-save" disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfilePage;