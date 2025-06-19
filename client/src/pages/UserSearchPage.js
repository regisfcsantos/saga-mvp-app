// client/src/pages/UserSearchPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserSearchResult from '../components/UserSearchResult'; // Seu componente de resultado já está pronto!
import './UserSearchPage.css'; // Usaremos um CSS para estilizar

const UserSearchPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('Busque por atletas ou boxes.');

    // Este useEffect implementa um "debounce": ele espera o usuário
    // parar de digitar por 300ms antes de fazer a chamada à API,
    // o que evita sobrecarregar seu servidor com requisições a cada tecla.
    useEffect(() => {
        const timerId = setTimeout(async () => {
            // Se o campo de busca estiver vazio, limpamos os resultados.
            if (searchTerm.trim() === '') {
                setResults([]);
                setMessage('Busque por atletas ou boxes.');
                return;
            }

            setIsLoading(true);
            try {
                // Chamada para a sua API que já existe!
                const response = await axios.get(`/api/users/search?q=${searchTerm}`);
                setResults(response.data);

                // Se não houver resultados, exibe uma mensagem amigável.
                if (response.data.length === 0) {
                    setMessage(`Nenhum resultado encontrado para "${searchTerm}".`);
                }
            } catch (error) {
                console.error("Erro ao buscar usuários:", error);
                setMessage("Ocorreu um erro ao realizar a busca. Tente novamente.");
            } finally {
                setIsLoading(false);
            }
        }, 300);

        // Limpa o timer se o usuário digitar novamente antes dos 300ms
        return () => clearTimeout(timerId);
    }, [searchTerm]); // Este efeito roda toda vez que 'searchTerm' muda.

    return (
        <div className="search-page-container">
            <div className="search-bar-wrapper">
                {/* Ícone de lupa para consistência visual */}
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                    type="text"
                    placeholder="Buscar por nome de usuário..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus // Foca no campo de busca assim que a página carrega
                />
            </div>

            <div className="search-results-list">
                {isLoading ? (
                    <p className="search-message">Buscando...</p>
                ) : results.length > 0 ? (
                    results.map(user => (
                        // Usando seu componente UserSearchResult para cada resultado
                        <UserSearchResult key={user.id} user={user} />
                    ))
                ) : (
                    // Exibe a mensagem de "nenhum resultado" ou a inicial
                    <p className="search-message">{message}</p>
                )}
            </div>
        </div>
    );
};

export default UserSearchPage;