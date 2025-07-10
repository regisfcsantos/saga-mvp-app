// client/src/pages/CreateCompetitionPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './CreateCompetitionPage.css';

// O estado inicial agora inclui 'type' e 'category_ids' e remove o antigo 'category'
const initialFormData = {
    name: '', description: '', rules: '',
    inscription_start_date: '', inscription_end_date: '',
    submission_start_date: '', submission_end_date: '',
    results_date: '', banner_image_url: '', logo_image_url: '',
    medal_image_url: '', awards_info: '', sponsors_info: '',
    price: '0.00', contact_details: '', status: 'rascunho',
    type: 'competition', // Valor padrão é 'competição'
    category_ids: [], // Array para guardar os IDs das categorias selecionadas
    payment_method_name: '',
    payment_details: '',
    proof_of_payment_recipient: '',
    proof_of_payment_contact: '',
    payment_instructions_detailed: ''
};

const CreateCompetitionPage = () => {
    const { id: eventId } = useParams(); // Renomeado para eventId para clareza
    const isEditMode = Boolean(eventId);
    
    const { currentUser, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState(initialFormData);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allCategories, setAllCategories] = useState([]); // Novo estado para guardar as categorias

    // Novo useEffect para buscar todas as categorias quando o componente monta
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/api/competitions/utils/categories');
                setAllCategories(response.data);
            } catch (err) {
                console.error("Erro ao buscar categorias", err);
                setError("Não foi possível carregar as categorias do servidor.");
            }
        };
        fetchCategories();
    }, []);

    // useEffect para buscar os dados no modo de edição (agora lida com as novas estruturas)
    useEffect(() => {
        if (isEditMode) {
            const fetchEventData = async () => {
                setIsSubmitting(true);
                try {
                    const response = await axios.get(`/api/competitions/${eventId}`);
                    const eventData = response.data;

                    if (currentUser && currentUser.id !== eventData.creator_id && currentUser.role !== 'admin') {
                        setError("Você não tem permissão para editar este evento.");
                        setTimeout(() => navigate('/perfil'), 3000);
                        return;
                    }
                    
                    const formattedData = {};
                    for (const key in initialFormData) {
                        if (key === 'category_ids') {
                            // Pega apenas os IDs das categorias que vieram do backend
                            formattedData[key] = eventData.categories ? eventData.categories.map(cat => cat.id) : [];
                        } else if (eventData[key] !== null && eventData[key] !== undefined) {
                            if (key.includes('_date') && eventData[key]) {
                                formattedData[key] = eventData[key].slice(0, 16);
                            } else {
                                formattedData[key] = eventData[key];
                            }
                        } else {
                            formattedData[key] = initialFormData[key]; // Garante que todos os campos do estado inicial existam
                        }
                    }
                    setFormData(formattedData);
                } catch (err) {
                    console.error("Erro ao buscar dados do evento:", err);
                    setError("Não foi possível carregar os dados do evento.");
                } finally {
                    setIsSubmitting(false);
                }
            };
            fetchEventData();
        }
    }, [isEditMode, eventId, currentUser, navigate]);

    // Lógica de handleChange atualizada para lidar com checkboxes de categoria
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'category_ids') {
            const newCategoryIds = [...formData.category_ids];
            const categoryId = parseInt(value, 10);
            if (checked) {
                newCategoryIds.push(categoryId);
            } else {
                const index = newCategoryIds.indexOf(categoryId);
                if (index > -1) {
                    newCategoryIds.splice(index, 1);
                }
            }
            setFormData(prev => ({ ...prev, category_ids: newCategoryIds }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Lógica de handleSave atualizada para limpar dados desnecessários
    const handleSave = async (newStatus) => {
        setError(''); setSuccess(''); setIsSubmitting(true);
        let submissionData = { ...formData, status: newStatus };

        // Se for um desafio, garantir que campos de data da competição estejam nulos e categorias vazias
        if (submissionData.type === 'challenge') {
            submissionData = {
                ...submissionData,
                inscription_start_date: null,
                inscription_end_date: null,
                submission_start_date: null,
                submission_end_date: null,
                results_date: null,
                category_ids: []
            };
        }

        try {
            const response = isEditMode
                ? await axios.put(`/api/competitions/${eventId}`, submissionData)
                : await axios.post('/api/competitions', submissionData);
            
            const eventType = submissionData.type === 'competition' ? 'Competição' : 'Desafio';
            const actionType = newStatus === 'publicada' ? 'publicada' : 'salva';
            setSuccess(`Sucesso! ${eventType} "${response.data.name}" foi ${actionType}. Redirecionando...`);
            setTimeout(() => navigate('/perfil'), 2000);
        } catch (err) {
            console.error("Erro ao salvar evento:", err);
            const eventType = formData.type === 'competition' ? 'competição' : 'desafio';
            setError(err.response?.data?.message || `Falha ao salvar a ${eventType}.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
         if (isEditMode && window.confirm(`Você tem certeza que quer excluir este evento?`)) {
            setIsSubmitting(true);
            try {
                await axios.delete(`/api/competitions/${eventId}`);
                setSuccess('Evento excluído com sucesso! Redirecionando...');
                setTimeout(() => navigate('/perfil'), 2000);
            } catch (error) {
                console.error("Erro ao excluir:", error);
                setError(error.response?.data?.message || 'Falha ao excluir.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Função original mantida
    const getCurrentDateTimeLocal = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0,16);
    };

    // Lógica de autenticação e permissão mantida
    if (authLoading) return <div className="form-container-comp">Carregando...</div>;
    if (!currentUser || (currentUser.role !== 'admin' && !(currentUser.role === 'box' && currentUser.is_box_approved))) {
        return <Navigate to="/perfil" state={{ message: "Acesso negado." }} replace />;
    }

    // JSX completo e integrado
    return (
        <div className="form-container-comp">
            <h1 className="form-title-comp">{isEditMode ? `Editar ${formData.type === 'competition' ? 'Competição' : 'Desafio'}` : 'Criar Novo Evento'}</h1>
            {error && <p className="form-error-message">{error}</p>}
            {success && <p className="form-success-message">{success}</p>}

            <div className="form-comp">
                <div className="form-group-comp">
                    <label htmlFor="type" className="form-label-comp">Tipo de Evento:</label>
                    <select name="type" id="type" value={formData.type} onChange={handleChange} className="form-select-comp" required disabled={isEditMode || isSubmitting}>
                        <option value="competition">Competição</option>
                        <option value="challenge">Desafio</option>
                    </select>
                </div>

                <div className="form-group-comp">
                    <label htmlFor="name" className="form-label-comp">Nome do {formData.type === 'competition' ? 'Competição' : 'Desafio'}:</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="form-input-comp" required disabled={isSubmitting} />
                </div>

                <div className="form-group-comp">
                    <label htmlFor="description" className="form-label-comp">Descrição Completa:</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} className="form-textarea-comp" required disabled={isSubmitting} />
                </div>
                
                {/* O antigo seletor de categoria foi removido daqui */}
                
                {/* Campo de categorias agora é condicional e usa checkboxes */}
                {formData.type === 'competition' && (
                    <div className="form-group-comp">
                        <label className="form-label-comp">Categorias da Competição:</label>
                        <div className="category-checkbox-group">
                            {allCategories.length > 0 ? allCategories.map(cat => (
                                <div key={cat.id} className="category-checkbox-item">
                                    <input 
                                        type="checkbox" 
                                        id={`cat-${cat.id}`} 
                                        name="category_ids" 
                                        value={cat.id}
                                        checked={formData.category_ids.includes(cat.id)}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                    />
                                    <label htmlFor={`cat-${cat.id}`}>{cat.name}</label>
                                </div>
                            )) : <p>Carregando categorias...</p>}
                        </div>
                    </div>
                )}

                <div className="form-group-comp">
                    <label htmlFor="rules" className="form-label-comp">Regras:</label>
                    <textarea name="rules" id="rules" value={formData.rules} onChange={handleChange} className="form-textarea-comp" required disabled={isSubmitting} />
                </div>
                
                {/* Bloco de datas agora é condicional */}
                {formData.type === 'competition' && (
                    <>
                        <div className="form-group-pair-comp">
                            <div className="form-group-comp">
                                <label htmlFor="inscription_start_date" className="form-label-comp">Início das Inscrições:</label>
                                <input type="datetime-local" name="inscription_start_date" id="inscription_start_date" value={formData.inscription_start_date} onChange={handleChange} className="form-input-comp" min={getCurrentDateTimeLocal()} required disabled={isSubmitting} />
                            </div>
                            <div className="form-group-comp">
                                <label htmlFor="inscription_end_date" className="form-label-comp">Fim das Inscrições:</label>
                                <input type="datetime-local" name="inscription_end_date" id="inscription_end_date" value={formData.inscription_end_date} onChange={handleChange} className="form-input-comp" min={formData.inscription_start_date || getCurrentDateTimeLocal()} required disabled={isSubmitting} />
                            </div>
                        </div>

                        <div className="form-group-pair-comp">
                            <div className="form-group-comp">
                                <label htmlFor="submission_start_date" className="form-label-comp">Início Envio de Provas:</label>
                                <input type="datetime-local" name="submission_start_date" id="submission_start_date" value={formData.submission_start_date} onChange={handleChange} className="form-input-comp" min={formData.inscription_end_date || getCurrentDateTimeLocal()} disabled={isSubmitting} />
                            </div>
                            <div className="form-group-comp">
                                <label htmlFor="submission_end_date" className="form-label-comp">Fim Envio de Provas:</label>
                                <input type="datetime-local" name="submission_end_date" id="submission_end_date" value={formData.submission_end_date} onChange={handleChange} className="form-input-comp" min={formData.submission_start_date || getCurrentDateTimeLocal()} disabled={isSubmitting} />
                            </div>
                        </div>

                        <div className="form-group-comp">
                            <label htmlFor="results_date" className="form-label-comp">Data de Divulgação dos Resultados:</label>
                            <input type="datetime-local" name="results_date" id="results_date" value={formData.results_date} onChange={handleChange} className="form-input-comp" min={formData.submission_end_date || getCurrentDateTimeLocal()} disabled={isSubmitting} />
                        </div>
                    </>
                )}

                <p style={{fontSize: '0.9em', color: '#777', textAlign: 'center', margin: '15px 0'}}>Para as imagens, por favor, insira URLs de imagens já hospedadas online.</p>

                <div className="form-group-comp">
                    <label htmlFor="banner_image_url" className="form-label-comp">URL do Banner do Evento:</label>
                    <input type="url" name="banner_image_url" id="banner_image_url" value={formData.banner_image_url} onChange={handleChange} className="form-input-comp" placeholder="https://exemplo.com/banner.jpg" disabled={isSubmitting} />
                </div>
                <div className="form-group-comp">
                    <label htmlFor="logo_image_url" className="form-label-comp">URL do Logo do Evento (Opcional):</label>
                    <input type="url" name="logo_image_url" id="logo_image_url" value={formData.logo_image_url} onChange={handleChange} className="form-input-comp" placeholder="https://exemplo.com/logo.png" disabled={isSubmitting} />
                </div>
                <div className="form-group-comp">
                    <label htmlFor="medal_image_url" className="form-label-comp">URL da Imagem da Medalha/Selo (Opcional):</label>
                    <input type="url" name="medal_image_url" id="medal_image_url" value={formData.medal_image_url} onChange={handleChange} className="form-input-comp" placeholder="https://exemplo.com/medalha.png" disabled={isSubmitting} />
                </div>

                <div className="form-group-comp">
                    <label htmlFor="awards_info" className="form-label-comp">Informações da Premiação:</label>
                    <textarea name="awards_info" id="awards_info" value={formData.awards_info} onChange={handleChange} className="form-textarea-comp" disabled={isSubmitting} />
                </div>

                <div className="form-group-comp">
                    <label htmlFor="sponsors_info" className="form-label-comp">Patrocinadores (Opcional):</label>
                    <textarea name="sponsors_info" id="sponsors_info" value={formData.sponsors_info} onChange={handleChange} className="form-textarea-comp" disabled={isSubmitting} />
                </div>

                <div className="form-group-pair-comp">
                    <div className="form-group-comp">
                        <label htmlFor="price" className="form-label-comp">Preço da Inscrição (R$):</label>
                        <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} className="form-input-comp" min="0.00" step="0.01" disabled={isSubmitting} />
                    </div>
                    <div className="form-group-comp">
                        <label htmlFor="status" className="form-label-comp">Status:</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} className="form-select-comp" disabled={isSubmitting}>
                            <option value="rascunho">Rascunho</option>
                            <option value="publicada">Publicada</option>
                        </select>
                    </div>
                </div>

                <div className="form-group-comp">
                    <label htmlFor="contact_details" className="form-label-comp">Detalhes de Contato do Evento:</label>
                    <input type="text" name="contact_details" id="contact_details" value={formData.contact_details} onChange={handleChange} className="form-input-comp" placeholder="Email ou telefone para dúvidas" disabled={isSubmitting} />
                </div>
                
                <h2 style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>Detalhes de Pagamento (Opcional)</h2>
                <div className="form-group-pair-comp">
                    <div className="form-group-comp">
                        <label htmlFor="payment_method_name" className="form-label-comp">Método de Pagamento:</label>
                        <input type="text" name="payment_method_name" value={formData.payment_method_name || ''} onChange={handleChange} className="form-input-comp" placeholder="Ex: PIX, Transferência Bancária" disabled={isSubmitting} />
                    </div>
                    <div className="form-group-comp">
                        <label htmlFor="payment_details" className="form-label-comp">Chave PIX ou Dados Bancários:</label>
                        <textarea name="payment_details" value={formData.payment_details || ''} onChange={handleChange} className="form-textarea-comp" placeholder="Sua chave PIX ou dados da conta" disabled={isSubmitting} style={{minHeight: '60px'}}/>
                    </div>
                </div>

                <div className="form-group-pair-comp">
                    <div className="form-group-comp">
                        <label htmlFor="proof_of_payment_recipient" className="form-label-comp">Enviar Comprovante via:</label>
                        <input type="text" name="proof_of_payment_recipient" value={formData.proof_of_payment_recipient || ''} onChange={handleChange} className="form-input-comp" placeholder="Ex: Email, WhatsApp" disabled={isSubmitting} />
                    </div>
                    <div className="form-group-comp">
                        <label htmlFor="proof_of_payment_contact" className="form-label-comp">Contato para Envio do Comprovante:</label>
                        <input type="text" name="proof_of_payment_contact" value={formData.proof_of_payment_contact || ''} onChange={handleChange} className="form-input-comp" placeholder="Seu email ou número de WhatsApp" disabled={isSubmitting} />
                    </div>
                </div>

                <div className="form-group-comp">
                    <label htmlFor="payment_instructions_detailed" className="form-label-comp">Instruções Detalhadas de Pagamento:</label>
                    <textarea
                        name="payment_instructions_detailed"
                        value={formData.payment_instructions_detailed || ''}
                        onChange={handleChange}
                        className="form-textarea-comp"
                        placeholder="Ex: Para PIX, use a chave acima e envie o comprovante para o email@exemplo.com com o assunto 'Inscrição SAGA - [Seu Nome]'. Sua vaga será confirmada em até 48h."
                        disabled={isSubmitting}
                    />
                </div>

                <div className="form-actions-container">
                    {isEditMode && (
                         <button 
                            type="button" 
                            onClick={handleDelete} 
                            className="form-button-comp form-delete-button" 
                            disabled={isSubmitting}
                        >
                            Excluir Evento
                        </button>
                    )}
                    <div>
                        <button 
                            type="button" 
                            onClick={() => handleSave('rascunho')} 
                            className="form-button-comp form-draft-button" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar Rascunho'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => handleSave('publicada')} 
                            className="form-button-comp form-publish-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Publicando...' : `Publicar ${formData.type === 'competition' ? 'Competição' : 'Desafio'}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCompetitionPage;