// SAGA_MVP/models/inscriptionModel.js
const db = require('../config/db');

const Inscription = {
    // Cria uma nova inscrição para um atleta em uma competição
    create: async ({ athlete_id, competition_id, status = 'pendente_pagamento' }) => {
        const query = `
            INSERT INTO inscriptions (athlete_id, competition_id, status)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const params = [athlete_id, competition_id, status];
        const { rows } = await db.query(query, params);
        return rows[0];
    },

    // Verifica se um usuário já está inscrito em uma competição
    findByAthleteAndCompetition: async (athlete_id, competition_id) => {
        const query = 'SELECT * FROM inscriptions WHERE athlete_id = $1 AND competition_id = $2';
        const { rows } = await db.query(query, [athlete_id, competition_id]);
        return rows[0];
    },

    // (Para o Admin/Box) Lista todas as inscrições de uma competição
    findByCompetitionId: async (competition_id) => {
        // Busca inscrições e junta com dados do atleta para exibição
        const query = `
            SELECT i.*, u.username, u.email, u.profile_photo_url
            FROM inscriptions i
            JOIN users u ON i.athlete_id = u.id
            WHERE i.competition_id = $1
            ORDER BY i.inscription_date ASC;
        `;
        const { rows } = await db.query(query, [competition_id]);
        return rows;
    },

    findCompetitionsByAthleteId: async (athleteId) => {
        const query = `
            SELECT 
                i.status AS inscription_status,
                i.id AS inscription_id,
                c.id AS competition_id,
                c.name AS competition_name,
                c.status AS competition_status,
                s.video_url -- <<--- CAMPO ADICIONADO
            FROM inscriptions i
            JOIN competitions c ON i.competition_id = c.id
            LEFT JOIN submissions s ON i.id = s.inscription_id -- <<--- JOIN ADICIONADO
            WHERE i.athlete_id = $1
            ORDER BY i.inscription_date DESC;
        `;
        const { rows } = await db.query(query, [athleteId]);
        return rows;
    },

    // (Para o Admin/Box) Atualiza o status de uma inscrição (ex: para 'confirmada')
    updateStatus: async (inscriptionId, status) => {
        const query = `
            UPDATE inscriptions
            SET status = $1
            WHERE id = $2
            RETURNING *;
        `;
        const { rows } = await db.query(query, [status, inscriptionId]);
        return rows[0];
    },
    
    deleteById: async (inscriptionId) => {
        const query = 'DELETE FROM inscriptions WHERE id = $1 RETURNING *;';
        const { rows } = await db.query(query, [inscriptionId]);
        return rows[0]; // Retorna a inscrição que foi deletada
    }
};

module.exports = Inscription;