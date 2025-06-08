// SAGA_MVP/models/notificationModel.js
const db = require('../config/db');

const Notification = {
    // Cria uma nova notificação para um usuário
    create: async ({ user_id, message, link }) => {
        const query = `
            INSERT INTO notifications (user_id, message, link)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const params = [user_id, message, link];
        const { rows } = await db.query(query, params);
        return rows[0];
    },

    // Busca todas as notificações de um usuário, das mais novas para as mais antigas
    findByUserId: async (userId) => {
        const query = `
            SELECT * FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC;
        `;
        const { rows } = await db.query(query, [userId]);
        return rows;
    },

    // Marca uma notificação específica como lida
    markAsRead: async (notificationId, userId) => {
        // A condição user_id garante que um usuário só possa marcar suas próprias notificações como lidas
        const query = `
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = $1 AND user_id = $2
            RETURNING *;
        `;
        const { rows } = await db.query(query, [notificationId, userId]);
        return rows[0];
    },

    // Marca todas as notificações de um usuário como lidas
    markAllAsRead: async (userId) => {
        const query = `
            UPDATE notifications
            SET is_read = TRUE
            WHERE user_id = $1 AND is_read = FALSE
            RETURNING *;
        `;
        const { rows } = await db.query(query, [userId]);
        return rows;
    }
};

module.exports = Notification;