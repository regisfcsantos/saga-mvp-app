// client/src/components/SeloGallery.js
import React from 'react';

// Recebemos a lista de selos como uma prop
const SeloGallery = ({ selos }) => {
    // Se o usuário não tiver selos ou a lista estiver vazia, não renderizamos nada.
    if (!selos || selos.length === 0) {
        return null;
    }

    return (
        <div className="selo-gallery-container">
            <h4>Conquistas</h4>
            <div className="selo-gallery">
                {selos.map((selo, index) => (
                    <div key={index} className="selo-item" title={`${selo.challenge_name}\nConquistado em: ${new Date(selo.achieved_at).toLocaleDateString('pt-BR')}`}>
                        <img 
                            src={selo.selo_icon_url || 'https://via.placeholder.com/60?text=Selo'} 
                            alt={selo.challenge_name} 
                            className="selo-icon" 
                        />
                        {/* O tooltip é opcional, mas melhora a experiência */}
                        <span className="tooltip-text">{selo.challenge_name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SeloGallery;