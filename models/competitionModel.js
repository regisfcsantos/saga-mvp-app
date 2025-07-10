// SAGA_MVP/models/competitionModel.js
const db = require('../config/db');

const Competition = {
    // Criar um novo evento (Competição ou Desafio)
    create: async (data) => {
        // <<--- MUDANÇA AQUI: Capturamos 'type' e 'category_ids' e removemos 'category' ---<<<
        const { 
            name, description, rules, inscription_start_date, inscription_end_date,
            submission_start_date, submission_end_date, results_date, banner_image_url,
            logo_image_url, medal_image_url, awards_info, sponsors_info, price,
            contact_details, status, creator_id, type, // Novo campo 'type'
            // Novos campos de pagamento (já estavam aqui)
            payment_method_name, payment_details, proof_of_payment_recipient,
            proof_of_payment_contact, payment_instructions_detailed,
            category_ids // Array com os IDs das categorias
        } = data;
        
        const client = await db.getClient(); // Usamos um 'client' para controlar a transação

        try {
            await client.query('BEGIN'); // Inicia a transação

            // 1. Insere na tabela 'competitions'
            const competitionQuery = `
                INSERT INTO competitions (
                    name, creator_id, description, rules, inscription_start_date, inscription_end_date, 
                    submission_start_date, submission_end_date, results_date, banner_image_url, 
                    logo_image_url, medal_image_url, awards_info, sponsors_info, price, 
                    contact_details, status, type, payment_method_name, payment_details, 
                    proof_of_payment_recipient, proof_of_payment_contact, payment_instructions_detailed
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                RETURNING *; 
            `;
            const competitionParams = [
                name, creator_id, description, rules, inscription_start_date, inscription_end_date, 
                submission_start_date, submission_end_date, results_date, banner_image_url, 
                logo_image_url, medal_image_url, awards_info, sponsors_info, price, 
                contact_details, status, type, payment_method_name, payment_details, 
                proof_of_payment_recipient, proof_of_payment_contact, payment_instructions_detailed
            ];
            const competitionResult = await client.query(competitionQuery, competitionParams);
            const newCompetition = competitionResult.rows[0];

            // 2. Se for uma competição e tiver categorias, insere na tabela de junção
            if (type === 'competition' && category_ids && category_ids.length > 0) {
                const categoryValues = category_ids.map(catId => `(${newCompetition.id}, ${catId})`).join(',');
                const categoryQuery = `
                    INSERT INTO competition_categories (competition_id, category_id) VALUES ${categoryValues};
                `;
                await client.query(categoryQuery);
            }

            await client.query('COMMIT'); // Confirma a transação
            return newCompetition;

        } catch (err) {
            await client.query('ROLLBACK'); // Desfaz tudo em caso de erro
            throw err;
        } finally {
            client.release(); // Libera o client de volta para o pool
        }
    },

    // <<--- MUDANÇA AQUI: A função 'findAll' foi simplificada. A lógica de grupo por categoria agora deve ser feita no frontend. ---<<<
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

        if (filters.name) {
            whereClauses.push(`c.name ILIKE $${paramCount++}`);
            values.push(`%${filters.name}%`);
        }
        // <<--- MUDANÇA AQUI: Novo filtro por 'type' ---<<<
        if (filters.type) {
            whereClauses.push(`c.type = $${paramCount++}`);
            values.push(filters.type);
        }

        // Por padrão, não mostramos rascunhos na listagem pública
        whereClauses.push(`c.status <> 'rascunho'`);

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }
        query += ' ORDER BY c.created_at DESC;';

        const { rows } = await db.query(query, values);
        return rows; // Retorna a lista simples
    },

    // <<--- MUDANÇA AQUI: 'findById' agora busca as categorias associadas ---<<<
    findById: async (id) => {
        const query = `
            SELECT 
                c.*, 
                u.username AS creator_username,
                u.profile_photo_url AS creator_photo_url,
                -- Agrega as categorias em um array de objetos JSON
                (SELECT json_agg(cat) FROM categories cat JOIN competition_categories cc ON cat.id = cc.category_id WHERE cc.competition_id = c.id) as categories
            FROM competitions c
            JOIN users u ON c.creator_id = u.id
            WHERE c.id = $1;
        `;
        const { rows } = await db.query(query, [id]);
        return rows[0];
    },
    
    // ... (findByCreatorId, delete não precisam de mudança imediata) ...
    findByCreatorId: async (creatorId) => {
        const query = `
            SELECT * FROM competitions 
            WHERE creator_id = $1 
            ORDER BY created_at DESC;
        `;
        const { rows } = await db.query(query, [creatorId]);
        return rows;
    },

    // <<--- MUDANÇA AQUI: 'update' agora também é uma transação para lidar com categorias ---<<<
    update: async (id, competitionData) => {
        const { category_ids, ...fieldsToUpdate } = competitionData;
        
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            const fields = [];
            const values = [];
            let paramCount = 1;

            for (const key in fieldsToUpdate) {
                if (fieldsToUpdate[key] !== undefined && key !== 'id' && key !== 'creator_id') {
                    fields.push(`${key} = $${paramCount++}`);
                    values.push(fieldsToUpdate[key]);
                }
            }
            
            let updatedCompetition;
            if (fields.length > 0) {
                const query = `
                    UPDATE competitions 
                    SET ${fields.join(', ')} 
                    WHERE id = $${paramCount}
                    RETURNING *;
                `;
                values.push(id);
                const { rows } = await client.query(query, values);
                updatedCompetition = rows[0];
            }

            // Atualiza as categorias se elas forem enviadas
            if (category_ids !== undefined) {
                // 1. Deleta as associações antigas
                await client.query('DELETE FROM competition_categories WHERE competition_id = $1', [id]);
                // 2. Insere as novas, se houver alguma
                if (updatedCompetition.type === 'competition' && category_ids.length > 0) {
                     const categoryValues = category_ids.map(catId => `(${id}, ${catId})`).join(',');
                     const categoryQuery = `
                         INSERT INTO competition_categories (competition_id, category_id) VALUES ${categoryValues};
                     `;
                     await client.query(categoryQuery);
                }
            }
            
            await client.query('COMMIT');
            
            // Retorna o resultado da busca atualizado para ter os dados completos
            return await Competition.findById(id);

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    delete: async (id) => {
        const query = 'DELETE FROM competitions WHERE id = $1 RETURNING *;';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }
};

module.exports = Competition;