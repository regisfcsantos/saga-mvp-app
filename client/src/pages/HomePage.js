// client/src/pages/HomePage.js
import React from 'react';
import HeaderTabs from '../components/HeaderTabs';
import EventListings from '../components/EventListings'; // Importa nosso novo componente "cérebro"

const HomePage = () => {
    return (
        <div>
            {/* 1. Mostra as abas de navegação */}
            <HeaderTabs />
            
            {/* 2. Renderiza a lista, dizendo a ela para buscar APENAS competições */}
            <EventListings eventType="competition" />
        </div>
    );
};

export default HomePage;