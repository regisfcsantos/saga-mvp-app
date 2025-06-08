// client/src/components/Searchbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Searchbar.css';

const Searchbar = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const searchContainerRef = useRef(null);

    // Efeito para "debounce" da busca: só busca após o usuário parar de digitar
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.trim().length > 1) {
                try {
                    const response = await axios.get(`/api/users/search?q=${searchTerm}`);
                    setResults(response.data);
                    setShowResults(true);
                } catch (error) {
                    console.error("Erro na busca de usuários:", error);
                }
            } else {
                setResults([]);
                setShowResults(false);
            }
        }, 300); // Atraso de 300ms

        // Função de limpeza: cancela o timeout anterior se o usuário digitar novamente
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Efeito para fechar o dropdown se clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchContainerRef]);

    return (
        <div className="search-container" ref={searchContainerRef}>
            <input
                type="text"
                className="search-input"
                placeholder="Buscar atletas ou boxes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm.length > 1 && setShowResults(true)}
            />
            {showResults && results.length > 0 && (
                <div className="search-results-dropdown">
                    {results.map(user => (
                        <Link 
                            to={`/perfil/${user.username}`} 
                            key={user.id} 
                            className="search-result-item"
                            onClick={() => setShowResults(false)} // Esconde dropdown ao clicar
                        >
                            <img src={user.profile_photo_url || 'https://via.placeholder.com/35'} alt={user.username} className="search-result-photo" />
                            <span>{user.username} ({user.role})</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Searchbar;