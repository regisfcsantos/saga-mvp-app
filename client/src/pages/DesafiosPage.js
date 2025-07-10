// client/src/pages/DesafiosPage.js
import React from 'react';
import HeaderTabs from '../components/HeaderTabs';
import EventListings from '../components/EventListings'; // Importa o mesmo componente "cérebro"

const DesafiosPage = () => {
    return (
        <div>
            {/* 1. Mostra as mesmas abas de navegação */}
            <HeaderTabs />

            {/* 2. Renderiza a lista, dizendo a ela para buscar APENAS desafios */}
            <EventListings eventType="challenge" />
        </div>
    );
};

export default DesafiosPage;