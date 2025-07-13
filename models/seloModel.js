// models/seloModel.js
const db = require('../config/db');

const Selo = {
    /**
     * Adiciona um novo selo a um usuário.
     * @param {number} userId - O ID do usuário que conquistou o selo.
     * @param {number} challengeId - O ID do desafio (que está na tabela competitions).
     * @returns {Promise<object>} O registro do selo criado.
     */
    create: async (userId, challengeId) => {
        const query = `
            INSERT INTO user_selos (user_id, challenge_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, challenge_id) DO NOTHING
            RETURNING *;
        `;
        // "ON CONFLICT... DO NOTHING" é uma forma segura de evitar erros
        // caso a gente tente inserir um selo que o usuário já possui.
        const params = [userId, challengeId];
        const { rows } = await db.query(query, params);
        return rows[0];
    },

    /**
     * Encontra todos os selos conquistados por um usuário.
     * Vamos precisar disso no próximo passo, para exibir no perfil.
     * @param {number} userId - O ID do usuário.
     * @returns {Promise<Array<object>>} Uma lista de selos com detalhes do desafio.
     */
    findByUserId: async (userId) => {
        const query = `
            SELECT
                us.achieved_at,
                c.id as challenge_id,
                c.name as challenge_name,
                -- MUDANÇA: Agora priorizamos a imagem da medalha.
                COALESCE(c.medal_image_url, c.logo_image_url) as selo_icon_url
            FROM user_selos us
            JOIN competitions c ON us.challenge_id = c.id
            WHERE us.user_id = $1
            ORDER BY us.achieved_at DESC;
        `;
        const { rows } = await db.query(query, [userId]);
        return rows;
    }
};

module.exports = Selo;