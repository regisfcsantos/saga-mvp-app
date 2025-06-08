// client/src/pages/HomePage.js
import React, { useState, useEffect } from 'react'; // Removido useCallback, não é mais essencial aqui
import axios from 'axios';
import CompetitionCard from '../components/CompetitionCard';
import './HomePage.css';

const HomePage = () => {
    const [competitions, setCompetitions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Estados para os campos de filtro. Eles SÓ controlam o que está nos inputs.
    const [filterName, setFilterName] = useState('');
    const [filterCreator, setFilterCreator] = useState('');

    // Este useEffect agora roda APENAS UMA VEZ quando a página carrega,
    // para buscar a lista inicial de competições sem nenhum filtro.
    useEffect(() => {
        const fetchInitialCompetitions = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await axios.get('/api/competitions'); // Busca sem filtros
                setCompetitions(response.data);
            } catch (err) {
                console.error("Erro ao buscar competições iniciais:", err);
                setError(err.response?.data?.message || "Não foi possível carregar as competições.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialCompetitions();
    }, []); // O array de dependências vazio [] garante que isso rode só uma vez.

    // Esta função agora é chamada APENAS pelo botão "Filtrar"
    const handleFilterSubmit = async (e) => {
        e.preventDefault(); // Impede o recarregamento da página pelo formulário
        setIsLoading(true);
        setError('');
        try {
            // Constrói os parâmetros de query com os valores atuais dos estados de filtro
            const params = new URLSearchParams();
            if (filterName) params.append('name', filterName);
            if (filterCreator) params.append('creator', filterCreator);

            // Faz a requisição com os parâmetros
            const response = await axios.get('/api/competitions', { params });
            setCompetitions(response.data);
        } catch (err) {
            console.error("Erro ao filtrar competições:", err);
            setError(err.response?.data?.message || "Não foi possível aplicar os filtros.");
        } finally {
            setIsLoading(false);
        }
    };

    if (error) return <div className="error-message">Erro: {error}</div>;

    return (
        <div className="homepage-container">
            <header className="homepage-header">
                <h1>Explore Desafios e Competições SAGA</h1>
                <p>Encontre a competição perfeita para você e supere seus limites!</p>
            </header>

            <form className="filter-bar" onSubmit={handleFilterSubmit}>
                <input 
                    type="text"
                    className="filter-input"
                    placeholder="Buscar por nome da competição..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                />
                <input 
                    type="text"
                    className="filter-input"
                    placeholder="Buscar por criador (Box)..."
                    value={filterCreator}
                    onChange={(e) => setFilterCreator(e.target.value)}
                />
                <button type="submit" className="filter-button" disabled={isLoading}>
                    {isLoading ? 'Buscando...' : 'Filtrar'}
                </button>
            </form>

            {/* Mostra o loader apenas durante a busca */}
            {isLoading && <div className="loading-message">Carregando...</div>}

            {!isLoading && competitions.length === 0 && (
                <p className="no-competitions-message">Nenhuma competição encontrada com esses filtros.</p>
            )}

            {!isLoading && (
                <div className="competition-grid">
                    {competitions.map(comp => (
                        <CompetitionCard key={comp.id} competition={comp} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomePage;