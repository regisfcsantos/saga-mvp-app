// SAGA_MVP/models/submissionModel.js
const db = require('../config/db');

const Submission = {
    // Cria uma nova submissão de vídeo para uma inscrição
    create: async ({ inscription_id, video_url, athlete_comments }) => {
        const query = `
            INSERT INTO submissions (inscription_id, video_url, athlete_comments)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const params = [inscription_id, video_url, athlete_comments];
        const { rows } = await db.query(query, params);
        return rows[0];
    },

    // Busca todas as submissões para uma competição específica (para a página de avaliação do Box)
    findAllByCompetitionId: async (competitionId) => {
        const query = `
            SELECT 
                s.id AS submission_id,
                s.video_url,
                s.athlete_comments,
                s.score,
                s.creator_feedback,
                s.submission_date,
                s.evaluation_date,
                i.id AS inscription_id,
                u.id AS athlete_id,
                u.username AS athlete_username,
                u.profile_photo_url AS athlete_photo_url
            FROM submissions s
            JOIN inscriptions i ON s.inscription_id = i.id
            JOIN users u ON i.athlete_id = u.id
            WHERE i.competition_id = $1
            ORDER BY s.submission_date ASC;
        `;
        const { rows } = await db.query(query, [competitionId]);
        return rows;
    },

    findAllByUser: async (userId) => {
        const query = `
            SELECT 
                s.score,
                c.category
            FROM submissions s
            JOIN inscriptions i ON s.inscription_id = i.id
            JOIN competitions c ON i.competition_id = c.id
            WHERE i.athlete_id = $1 AND s.score IS NOT NULL;
        `;
        const { rows } = await db.query(query, [userId]);
        return rows;
    },
    
    // Busca uma submissão pelo seu próprio ID
    findById: async (submissionId) => {
        const query = 'SELECT * FROM submissions WHERE id = $1';
        const { rows } = await db.query(query, [submissionId]);
        return rows[0];
    },

    // Atribui uma nota e um feedback a uma submissão
    grade: async (submissionId, { score, creator_feedback, validation_status }) => {
        const query = `
            UPDATE submissions
            SET score = $1, 
                creator_feedback = $2, 
                evaluation_date = CURRENT_TIMESTAMP,
                validation_status = $3
            WHERE id = $4
            RETURNING *;
        `;
        const params = [score, creator_feedback, validation_status, submissionId];
        const { rows } = await db.query(query, params);
        return rows[0];
    },

    // (Opcional) Busca o ranking de uma competição (submissões com nota)
    getRankingByCompetitionId: async (competitionId) => {
        const query = `
            SELECT 
                s.score,
                s.video_url,
                u.username AS athlete_username,
                u.profile_photo_url AS athlete_photo
            FROM submissions s
            JOIN inscriptions i ON s.inscription_id = i.id
            JOIN users u ON i.athlete_id = u.id
            WHERE i.competition_id = $1 AND s.score IS NOT NULL
            ORDER BY s.score DESC, s.submission_date ASC;
        `;
        const { rows } = await db.query(query, [competitionId]);
        return rows;
    },

    updateByUser: async (submissionId, athleteId, { video_url, athlete_comments }) => {
        // A query abaixo inclui "WHERE id = $1 AND inscription_id IN (SELECT id FROM inscriptions WHERE athlete_id = $2)"
        // Isso é uma camada de segurança para garantir que o atleta só possa editar uma submissão que lhe pertence.
        const query = `
            UPDATE submissions
            SET video_url = $3, athlete_comments = $4, submission_date = CURRENT_TIMESTAMP
            WHERE id = $1 AND inscription_id IN (SELECT id FROM inscriptions WHERE athlete_id = $2)
            RETURNING *;
        `;
        const params = [submissionId, athleteId, video_url, athlete_comments];
        const { rows } = await db.query(query, params);
        return rows[0]; // Retorna a submissão atualizada
    }
};

module.exports = Submission;