// SAGA_MVP/models/userModel.js
const db = require('../config/db'); // Importa a configuração da sua conexão com o banco de dados

const User = {
    // Encontra um usuário pelo ID
    findById: async (id) => {
        const query = 'SELECT id, username, email, bio, profile_photo_url, role, is_box_approved, social_provider, social_id, created_at, updated_at FROM users WHERE id = $1';
        const { rows } = await db.query(query, [id]);
        return rows[0];
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
        // Seleciona apenas os campos que podem ser públicos ou são necessários para a lógica de perfil
        const query = 'SELECT id, username, email, bio, profile_photo_url, role, is_box_approved, created_at FROM users WHERE username = $1';
        const { rows } = await db.query(query, [username]);
        return rows[0];
    },

    // Cria um novo usuário (usado pelo Passport.js durante o cadastro social)
    create: async ({ username, email, profile_photo_url, social_provider, social_id, role = 'atleta' }) => {
        const query = `
            INSERT INTO users (username, email, profile_photo_url, social_provider, social_id, role)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *; 
        `;
        // Retorna todos os campos do usuário recém-criado
        const params = [username, email, profile_photo_url, social_provider, social_id, role];
        const { rows } = await db.query(query, params);
        return rows[0];
    },

    // Atualiza o perfil de um usuário (ex: bio, username se permitido, foto)
    updateProfile: async (id, { username, bio, profile_photo_url }) => {
        const fields = [];
        const values = [];
        let query = 'UPDATE users SET ';

        if (username !== undefined) {
            fields.push(`username = $${fields.length + 1}`);
            values.push(username);
        }
        if (bio !== undefined) {
            fields.push(`bio = $${fields.length + 1}`);
            values.push(bio);
        }
        if (profile_photo_url !== undefined) {
            fields.push(`profile_photo_url = $${fields.length + 1}`);
            values.push(profile_photo_url);
        }

        if (fields.length === 0) {
            // Nada para atualizar, retorna os dados atuais ou um erro/null
            return this.findById(id); // Retorna o usuário existente
        }

        query += fields.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = $' + (fields.length + 1) + ' RETURNING id, username, email, bio, profile_photo_url, role, is_box_approved';
        values.push(id);
        
        const { rows } = await db.query(query, values);
        return rows[0];
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