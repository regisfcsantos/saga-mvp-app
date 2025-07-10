// client/src/components/EventListings.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import EventCard from './EventCard'; // Usamos o nosso card genérico
import './EventListings.css'; // Importamos o CSS que acabamos de renomear

// O componente agora recebe 'eventType' para saber o que buscar: 'competition' ou 'challenge'
const EventListings = ({ eventType }) => {
    const [events, setEvents] = useState([]); // Agora é uma lista simples
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const carouselRefs = useRef({});

    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            // A chamada da API agora usa a prop 'eventType' para filtrar no backend
            const response = await axios.get(`/api/competitions?type=${eventType}`);
            // A API agora retorna uma lista simples, não um objeto agrupado
            setEvents(response.data);
            setFilteredEvents(response.data); // Inicialmente, mostramos tudo
        } catch (err) {
            console.error(`Erro ao buscar ${eventType}s:`, err);
            setError(`Não foi possível carregar os ${eventType}s.`);
        } finally {
            setIsLoading(false);
        }
    }, [eventType]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);
    
    // Lógica de filtro simplificada para a lista simples
    useEffect(() => {
        let result = events;
        if (activeSearch) {
            result = events.filter(event =>
                event.name.toLowerCase().includes(activeSearch.toLowerCase())
            );
        }
        setFilteredEvents(result);
    }, [activeSearch, events]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setActiveSearch(searchTerm);
    };
    
    const handleScroll = (categoryName) => {
        // A lógica de scroll pode ser mantida se você agrupar por uma nova propriedade no futuro
    };

    return (
        <div className="homepage-container">
            <header className="homepage-header-sticky">
                <form className="main-search-bar" onSubmit={handleSearchSubmit}>
                    <input 
                        type="text" 
                        placeholder={`Buscar por nome do ${eventType === 'competition' ? 'competição' : 'desafio'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>

                {/* O carrossel de categorias de filtro foi removido por simplicidade, 
                    já que desafios não têm categorias. Ele pode ser reimplementado aqui depois se necessário. */}
            </header>

            <main className="competitions-area">
                {isLoading && <p className="loading-message">Carregando...</p>}
                {error && <p className="error-message">{error}</p>}

                {!isLoading && !error && (
                    <div className="event-grid"> 
                        {filteredEvents.length > 0 ? (
                            filteredEvents.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))
                        ) : (
                            <p className="no-competitions-message">
                                {activeSearch 
                                    ? `Nenhum resultado encontrado para "${activeSearch}".`
                                    : `Nenhum ${eventType === 'competition' ? 'competição' : 'desafio'} disponível no momento.`
                                }
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

// CSS adicional para o grid de eventos
const styles = `
.event-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    padding: 0 20px 20px 20px;
}
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


export default EventListings;