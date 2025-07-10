// client/src/components/CompetitionCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './EventCard.css'; // Importa os estilos do card

const EventCard = ({ event }) => {
    const { 
        id, 
        name, 
        creator_username,
        price, 
        banner_image_url, 
        inscription_end_date, 
        status,
        type // Nosso novo campo!
    } = event;

    let displayStatusText = '';
    let statusClassName = '';

    if (type === 'challenge') {
        displayStatusText = 'Sempre Disponível';
        statusClassName = 'open'; // Usamos a cor verde para indicar disponibilidade
    } else { // type === 'competition'
        const isInscriptionOpen = new Date(inscription_end_date) > new Date();
        switch (status) {
            case 'publicada':
                if (isInscriptionOpen) {
                    displayStatusText = `Inscrições até ${new Date(inscription_end_date).toLocaleDateString('pt-BR')}`;
                    statusClassName = 'open';
                } else {
                    displayStatusText = 'Inscrições Encerradas';
                    statusClassName = 'closed';
                }
                break;
            case 'inscricoes_encerradas':
                displayStatusText = 'Inscrições Encerradas';
                statusClassName = 'closed';
                break;
            case 'em_andamento':
                displayStatusText = 'Em Andamento';
                statusClassName = 'open'; // Pode usar a mesma cor de "abertas" ou uma diferente
                break;
            case 'finalizada':
                displayStatusText = 'Resultados Disponíveis'; // Ou 'Finalizada'
                statusClassName = 'finished';
                break;
            case 'em_analise':
                displayStatusText = 'Em Análise';
                statusClassName = 'closed'; // Ou uma cor neutra
                break;
            case 'cancelada':
                displayStatusText = 'Cancelada';
                statusClassName = 'closed';
                break;
            default:
                displayStatusText = 'Status Indefinido';
        }
    }
    
    // Não mostrar cards em rascunho (isso será filtrado na HomePage, mas como segurança)
    if (status === 'rascunho') {
        return null;
    }

    // O link agora aponta para o caminho correto do evento
    const linkTo = type === 'challenge' ? `/desafios/${id}` : `/competicoes/${id}`;

    return (
        <Link to={linkTo} className="competition-card">
            <img 
                src={banner_image_url || 'https://via.placeholder.com/400x225?text=SAGA'} 
                alt={`Banner de ${name}`} 
                className="competition-card-image" 
            />
            <div className="competition-card-content">
                <h3 className="competition-card-title">{name}</h3>
                {creator_username && <p className="competition-card-creator">Por: {creator_username}</p>}
                <p className={`competition-card-price ${parseFloat(price) === 0 ? 'free' : ''}`}>
                    {parseFloat(price) === 0 ? 'Grátis' : `R$ ${parseFloat(price).toFixed(2)}`}
                </p>
                <p className={`competition-card-status ${statusClassName}`}>
                    {displayStatusText}
                </p>
            </div>
        </Link>
    );
};

export default EventCard;