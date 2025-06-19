// client/src/pages/HomePage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import CompetitionCard from '../components/CompetitionCard';
import './HomePage.css';

const HomePage = () => {
    // AGORA, allCompetitions guardará o objeto { Categoria: [comps] }
    const [allCompetitions, setAllCompetitions] = useState({});
    const [filteredCompetitions, setFilteredCompetitions] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const carouselRefs = useRef({});

    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);

    const fetchAllCompetitions = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/competitions');
            // MUDANÇA 1: Salvamos o objeto exatamente como ele vem da API.
            setAllCompetitions(response.data);
        } catch (err) {
            console.error("Erro ao buscar competições:", err);
            setError("Não foi possível carregar as competições.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllCompetitions();
    }, [fetchAllCompetitions]);
    
    // MUDANÇA 2: Lógica de filtro totalmente reescrita para usar a nova estrutura de dados.
    useEffect(() => {
        if (activeSearch) {
            const searchResult = {};
            // Itera sobre cada categoria em allCompetitions
            for (const category in allCompetitions) {
                // Filtra as competições dentro do array de cada categoria
                const matchingCompetitions = allCompetitions[category].filter(comp =>
                    comp.name.toLowerCase().includes(activeSearch.toLowerCase())
                );
                // Se encontrou algo, adiciona a categoria e os resultados ao objeto final
                if (matchingCompetitions.length > 0) {
                    searchResult[category] = matchingCompetitions;
                }
            }
            setFilteredCompetitions(searchResult);

        } else if (activeCategory) {
            const newFiltered = {};
            // Verifica se a categoria clicada existe nos dados recebidos
            if (allCompetitions[activeCategory]) {
                // Cria um novo objeto contendo APENAS a categoria ativa
                newFiltered[activeCategory] = allCompetitions[activeCategory];
            }
            setFilteredCompetitions(newFiltered);

        } else {
            // Se não há filtro ativo, apenas exibe tudo que veio da API
            setFilteredCompetitions(allCompetitions);
        }
    }, [activeSearch, activeCategory, allCompetitions]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setActiveCategory(null);
        setActiveSearch(searchTerm);
    };

    const handleCategoryClick = (categoryName) => {
        setSearchTerm('');
        setActiveSearch('');

        // Lógica de toggle explícita
        // 1. Verificamos se a categoria clicada JÁ é a que está ativa
        const isDeactivating = activeCategory === categoryName;

        // 2. Se for, definimos o estado como null (desativar).
        //    Se não for, definimos o estado com o nome da nova categoria (ativar).
        if (isDeactivating) {
            setActiveCategory(null);
        } else {
            setActiveCategory(categoryName);
        }
    };
    
    // O resto do componente não precisa de alterações.
    const handleScroll = (categoryName) => {
        if (carouselRefs.current[categoryName]) {
            carouselRefs.current[categoryName].scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    const categoriesData = [
        { name: 'Calistenia', iconFile: 'calistenia.svg' },
        { name: 'Cardio', iconFile: 'cardio.svg' },
        { name: 'Ginastico', iconFile: 'ginastico.svg' },
        { name: 'Crossfit Geral', iconFile: 'crossfit.svg' },
        { name: 'LPO', iconFile: 'LPO.svg' },
        { name: 'Powerlifting', iconFile: 'powerlifting.svg' },
    ];
    
    // MUDANÇA 3: Usamos Object.keys, que funciona perfeitamente com nossa nova estrutura de dados
    const categoriesToDisplay = Object.keys(filteredCompetitions);

    return (
        <div className="homepage-container">
            <header className="homepage-header-sticky">
                <form className="main-search-bar" onSubmit={handleSearchSubmit}>
                    <input 
                        type="text" 
                        placeholder="Buscar por nome da competição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>

                <nav className="category-carousel">
                    {categoriesData.map(cat => (
                        <div 
                            key={cat.name} 
                            className={`category-item ${activeCategory === cat.name ? 'active' : ''}`}
                            onClick={() => handleCategoryClick(cat.name)}
                        >
                            <div className="category-icon-wrapper">
                                <img 
                                    src={`${process.env.PUBLIC_URL}/icons/${cat.iconFile}`} 
                                    alt={`${cat.name} icon`}
                                    className="category-icon-svg" 
                                />
                            </div>
                            <span>{cat.name}</span>
                        </div>
                    ))}
                </nav>
            </header>

            <main className="competitions-area">
                {isLoading && <p className="loading-message">Carregando...</p>}
                {error && <p className="error-message">{error}</p>}

                {!isLoading && !error && (
                    categoriesToDisplay.length > 0 ? (
                        categoriesToDisplay.map(categoryName => (
                            <section id={categoryName.toLowerCase().replace(/\s/g, '')} key={categoryName} className="competition-section">
                                <div className="competition-section-header">
                                    <h2>{categoryName}</h2>
                                    {filteredCompetitions[categoryName].length > 1 && (
                                        <button className="scroll-arrow-btn" onClick={() => handleScroll(categoryName)}>
                                            <i className="fas fa-arrow-right"></i>
                                        </button>
                                    )}
                                </div>
                                <div 
                                    className="competition-carousel" 
                                    ref={el => (carouselRefs.current[categoryName] = el)}
                                >
                                    {filteredCompetitions[categoryName].map(comp => (
                                        <CompetitionCard key={comp.id} competition={comp} />
                                    ))}
                                </div>
                            </section>
                        ))
                    ) : (
                        <p className="no-competitions-message">
                            {activeSearch 
                                ? `Nenhuma competição encontrada para "${activeSearch}".`
                                : "Nenhuma competição disponível no momento."
                            }
                        </p>
                    )
                )}
            </main>
        </div>
    );
};

export default HomePage;