// SAGA_MVP/models/competitionModel.js
const db = require('../config/db'); // Importa a sua conexão com o banco de dados

const Competition = {
    // Criar uma nova competição
    create: async (data) => {
        const { 
            name, description, rules, inscription_start_date, inscription_end_date,
            submission_start_date, submission_end_date, results_date, banner_image_url,
            logo_image_url, medal_image_url, awards_info, sponsors_info, price,
            contact_details, status, creator_id,
            payment_method_name, payment_details, proof_of_payment_recipient,
            proof_of_payment_contact, payment_instructions_detailed, category,
            type // <-- NOVA VARIÁVEL
        } = data;
        const query = `
            INSERT INTO competitions (
                name, creator_id, description, rules, inscription_start_date, inscription_end_date, 
                submission_start_date, submission_end_date, results_date, banner_image_url, 
                logo_image_url, medal_image_url, awards_info, sponsors_info, price, 
                contact_details, status, payment_method_name, payment_details, 
                proof_of_payment_recipient, proof_of_payment_contact, payment_instructions_detailed, category,
                type 
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
            RETURNING *; 
        `;
        const params = [
            name, creator_id, description, rules, inscription_start_date, inscription_end_date, 
            submission_start_date, submission_end_date, results_date, banner_image_url, 
            logo_image_url, medal_image_url, awards_info, sponsors_info, price, 
            contact_details, status, payment_method_name, payment_details, 
            proof_of_payment_recipient, proof_of_payment_contact, payment_instructions_detailed, category,
            type 
        ];
        const { rows } = await db.query(query, params);
        return rows[0];
    },

    // Encontrar todas as competições (com informações do criador)
    // Podemos adicionar filtros e paginação aqui no futuro
    findAll: async (filters = {}) => {
        let query = `
            SELECT 
                c.*, 
                u.username AS creator_username,
                u.profile_photo_url AS creator_photo_url 
            FROM competitions c
            JOIN users u ON c.creator_id = u.id
        `;
        const whereClauses = [];
        const values = [];
        let paramCount = 1;

        // Filtro para não mostrar rascunhos
        whereClauses.push(`c.status <> 'rascunho'`);

        // NOVO: Filtro para o tipo de evento ('competition' ou 'challenge')
        if (filters.type) {
            whereClauses.push(`c.type = $${paramCount++}`);
            values.push(filters.type);
        }

        // Manter a busca por nome se necessário
        if (filters.name) {
            whereClauses.push(`c.name ILIKE $${paramCount++}`);
            values.push(`%${filters.name}%`);
        }
        
        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ' ORDER BY c.created_at DESC;';

        const { rows } = await db.query(query, values);
        return rows; // Retorna a lista simples diretamente
    },

    // Encontrar uma competição pelo seu ID (com informações do criador)
    findById: async (id) => {
        const query = `
            SELECT 
                c.*, 
                u.username AS creator_username,
                u.profile_photo_url AS creator_photo_url
            FROM competitions c
            JOIN users u ON c.creator_id = u.id
            WHERE c.id = $1;
        `;
        const { rows } = await db.query(query, [id]);
        return rows[0];
    },

    // Encontrar todas as competições criadas por um usuário específico (Box)
    findByCreatorId: async (creatorId) => {
        const query = `
            SELECT * FROM competitions 
            WHERE creator_id = $1 
            ORDER BY created_at DESC;
        `;
        const { rows } = await db.query(query, [creatorId]);
        return rows;
    },

    // Atualizar uma competição existente
    update: async (id, competitionData) => {
        const fields = [];
        const values = [];
        let paramCount = 1;

        // Monta a query dinamicamente com os campos que foram enviados para atualização
        for (const key in competitionData) {
            if (competitionData[key] !== undefined && key !== 'id' && key !== 'creator_id') { // Não permitir update de ID ou creator_id por aqui
                fields.push(`${key} = $${paramCount++}`);
                values.push(competitionData[key]);
            }
        }

        if (fields.length === 0) {
            return null; // Ou lançar um erro, ou retornar a competição existente
        }

        const query = `
            UPDATE competitions 
            SET ${fields.join(', ')} 
            WHERE id = $${paramCount}
            RETURNING *;
        `;
        values.push(id);

        const { rows } = await db.query(query, values);
        return rows[0];
    },

    // Deletar uma competição (cuidado com essa operação se houver inscrições/submissões)
    delete: async (id) => {
        // Para um MVP, um delete simples. Em um sistema real, você pode querer
        // marcar como "arquivada" ou verificar dependências antes de deletar.
        const query = 'DELETE FROM competitions WHERE id = $1 RETURNING *;';
        const { rows } = await db.query(query, [id]);
        return rows[0]; // Retorna a competição deletada
    }
    // Adicione mais funções conforme necessário (ex: para filtrar por status, etc.)
};

module.exports = Competition;