// client/src/components/ProfileScorecard.js
import React from 'react';
import './ProfileScorecard.css'; // Importa nosso novo CSS

const ProfileScorecard = ({ scores, levels }) => {
    // Verifica se os scores existem e não são um objeto vazio
    const hasScores = scores && Object.keys(scores).length > 0;

    if (!hasScores) {
        return (
            <div className="scorecard-container">
                <h3>Meu Nível de Atleta</h3>
                <p style={{ textAlign: 'center', color: '#888' }}>
                    Complete suas primeiras competições avaliadas para ver seus scores aqui!
                </p>
            </div>
        );
    }

    return (
        <div className="scorecard-container">
            <h3>Meu Nível de Atleta</h3>
            {Object.keys(scores).map(competencia => (
                <div key={competencia} className="score-item">
                    <span className="competencia-nome">{competencia}</span>
                    <div className="score-bar-container">
                        <div 
                            className="score-bar" 
                            style={{ width: `${scores[competencia] / 10}%` }} // Ex: score 850 -> 85% da barra
                        ></div>
                    </div>
                    <span className="score-valor">{scores[competencia]}</span>
                    <span className={`level-badge level-${levels[competencia]?.toLowerCase()}`}>
                        {levels[competencia] || '-'}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default ProfileScorecard;