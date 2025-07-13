// SAGA_MVP/models/userModel.js
const db = require('../config/db'); // Importa a configuração da sua conexão com o banco de dados

const User = {
    // Encontra um usuário pelo ID
    findById: async (id) => {
        const query = `
            SELECT u.*,
                (SELECT json_agg(...) FROM user_selos ... WHERE us.user_id = u.id) as selos,
                (SELECT json_agg(...) FROM inscriptions ... WHERE i.athlete_id = u.id) as inscriptions,
                (SELECT json_agg(...) FROM competitions ... WHERE c.creator_id = u.id) as created_competitions
            FROM users u
            WHERE u.id = $1;
        `;
        // ...
    },

    // Encontra um usuário pelo email
    findByEmail: async (email) => {
        const query = 'SELECT * FROM users WHERE email = $1'; // Retorna todos os campos para uso interno seguro
        const { rows } = await db.query(query, [email]);
        return rows[0];
    },

    // Encontra um usuário pelo ID social e provedor (usado pelo Passport.js)
    findBySocialId: async (socialId, provider) => {
        const query = 'SELECT * FROM users WHERE social_id = $1 AND social_provider = $2';
        const { rows } = await db.query(query, [socialId, provider]);
        return rows[0];
    },

    // Encontra um usuário pelo username (para perfis públicos)
    findByUsername: async (username) => {
        // Esta query agora usa LEFT JOIN e agregação JSON para buscar todos os selos do usuário de uma só vez
        const query = `
            SELECT 
                u.*,
                -- Agrega todos os selos encontrados em um array de objetos JSON chamado 'selos'
                (
                    SELECT json_agg(json_build_object(
                        'challenge_id', c.id,
                        'challenge_name', c.name,
                        'selo_icon_url', c.logo_image_url,
                        'achieved_at', us.achieved_at
                    ))
                    FROM user_selos us
                    JOIN competitions c ON us.challenge_id = c.id
                    WHERE us.user_id = u.id
                ) as selos,
                -- <<--- COLOQUEI AQUI TAMBÉM A BUSCA DAS LISTAS QUE VOCÊ JÁ TINHA ---<<<
                (SELECT json_agg(i.*) FROM inscriptions i WHERE i.athlete_id = u.id) as inscriptions,
                (SELECT json_agg(c.*) FROM competitions c WHERE c.creator_id = u.id) as created_competitions
            FROM users u
            WHERE u.username = $1;
        `;
        const { rows } = await db.query(query, [username]);
        return rows[0];
    },

    // Cria um novo usuário (usado pelo Passport.js durante o cadastro social)
    create: async ({ username, email, profile_photo_url, social_provider, social_id, role = 'atleta' }) => {
        const query = `
            INSERT INTO users (username, email, profile_photo_url, social_provider, social_id, role, scores, levels, selos)
        VALUES ($1, $2, $3, $4, $5, $6, '{}'::jsonb, '{}'::jsonb, ARRAY[]::text[])
        RETURNING * 
        `;
        // Retorna todos os campos do usuário recém-criado
        const params = [username, email, profile_photo_url, social_provider, social_id, role];
        const { rows } = await db.query(query, params);
        return rows[0];
    },

    // Atualiza o perfil de um usuário (ex: bio, username se permitido, foto)
    updateProfile: async (userId, fieldsToUpdate) => {
        // Pega as chaves dos campos que queremos atualizar (ex: ['bio', 'username', 'tipo_esporte'])
        const fields = Object.keys(fieldsToUpdate);

        // Se nenhum campo válido foi enviado, não faz nada e retorna o usuário como está.
        if (fields.length === 0) {
            return await db.query('SELECT * FROM users WHERE id = $1', [userId]).rows[0];
        }

        // Mapeia as chaves para criar os trechos da query SQL (ex: "bio" = $2, "username" = $3)
        // O $1 será sempre o userId na cláusula WHERE. Por isso começamos o index com 2.
        const setClauses = fields.map((field, index) => `"${field}" = $${index + 2}`).join(', ');

        // Pega os valores correspondentes às chaves na mesma ordem
        const values = fields.map(field => fieldsToUpdate[field]);

        // Monta a query final de forma dinâmica
        const query = `
            UPDATE users
            SET ${setClauses}
            WHERE id = $1
            RETURNING *;
        `;

        try {
            // Executa a query com o userId e os outros valores
            const { rows } = await db.query(query, [userId, ...values]);
            
            // Retorna o usuário completamente atualizado do banco
            return rows[0];

        } catch (error) {
            console.error('Erro no model ao atualizar perfil:', error);
            // Re-lança o erro para que a camada de Rota (userRoutes) possa tratá-lo
            // (por exemplo, para pegar o erro de username duplicado)
            throw error;
        }
    },

    updateScoresAndLevels: async (userId, { scores, levels }) => {
        const query = `
            UPDATE users
            SET scores = $1, levels = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, scores, levels;
        `;
        // MUDANÇA: Removemos JSON.stringify(). Agora o driver do DB lida com isso.
        const values = [scores, levels, userId];
        try {
            const { rows } = await db.query(query, values);
            return rows[0];
        } catch (error) {
            console.error('Erro no model ao atualizar scores e levels:', error);
            throw error;
        }
    },

    // Atualiza o usuário para solicitar o papel de "box"
    requestBoxRole: async (userId) => {
        const query = `
            UPDATE users 
            SET role = 'box', is_box_approved = FALSE, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 AND role = 'atleta' 
            RETURNING *;
        `;
        // Retorna todos os campos do usuário atualizado
        const { rows } = await db.query(query, [userId]);
        return rows[0];
    },

    // (Para uso futuro do Admin) Aprova um usuário como "box"
    approveBox: async (boxId) => {
        const query = `
            UPDATE users 
            SET is_box_approved = TRUE, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 AND role = 'box' 
            RETURNING *;
        `;
        const { rows } = await db.query(query, [boxId]);
        return rows[0];
    },

    // (Para uso futuro do Admin ou do próprio usuário) Linka uma conta social a um usuário existente
    linkSocialAccount: async (userId, { social_id, social_provider, profile_photo_url }) => {
        const query = `
            UPDATE users
            SET social_id = $1, social_provider = $2, profile_photo_url = COALESCE($3, profile_photo_url), updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *;
        `;
        const params = [social_id, social_provider, profile_photo_url, userId];
        const { rows } = await db.query(query, params);
        return rows[0];
    },
    // NOVA FUNÇÃO: Listar todas as solicitações pendentes para se tornar "Box"
    getPendingBoxRequests: async () => {
        const query = `
            SELECT id, username, email, created_at 
            FROM users 
            WHERE role = 'box' AND is_box_approved = FALSE 
            ORDER BY created_at ASC;
        `;
        const { rows } = await db.query(query);
        return rows;
    },

    findAllAdmins: async () => {
        const query = `SELECT id FROM users WHERE role = 'admin'`;
        const { rows } = await db.query(query);
        return rows;
    },

    searchByUsername: async (searchTerm, limit = 10) => {
        // ILIKE faz uma busca case-insensitive. '%' é um coringa.
        // Selecionamos apenas os campos necessários para a lista de resultados.
        const query = `
            SELECT id, username, profile_photo_url, role
            FROM users
            WHERE username ILIKE $1
            LIMIT $2;
        `;
        const values = [`%${searchTerm}%`, limit];
        const { rows } = await db.query(query, values);
        return rows;
    },

    // NOVA FUNÇÃO (Opcional, mas recomendada): Rejeitar uma solicitação de "Box"
    // Isso reverte o usuário para 'atleta'. Outra opção seria deletar o usuário
    // ou adicionar um status 'rejeitado', mas reverter para atleta é simples para o MVP.
    rejectBoxRequest: async (userId) => {
        const query = `
            UPDATE users 
            SET role = 'atleta', is_box_approved = FALSE, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 AND role = 'box' AND is_box_approved = FALSE
            RETURNING id, username, email, role, is_box_approved; 
        `;
        // Retorna o usuário atualizado
        const { rows } = await db.query(query, [userId]);
        return rows[0];
    }

};

module.exports = User;