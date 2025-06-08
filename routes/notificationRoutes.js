// SAGA_MVP/routes/notificationRoutes.js
const router = require('express').Router();
const Notification = require('../models/notificationModel');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// ROTA: Buscar todas as notificações do usuário logado
// ACESSO: GET /api/notifications/
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.findByUserId(userId);
        res.json(notifications);
    } catch (err) {
        console.error("Erro ao buscar notificações do usuário:", err);
        res.status(500).json({ message: "Erro interno ao buscar notificações." });
    }
});

// ROTA: Marcar uma notificação específica como lida
// ACESSO: PUT /api/notifications/:notificationId/read
router.put('/:notificationId/read', ensureAuthenticated, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        // O model já tem a lógica de segurança para garantir que o userId corresponda ao dono da notificação
        const updatedNotification = await Notification.markAsRead(notificationId, userId);

        if (!updatedNotification) {
            return res.status(404).json({ message: "Notificação não encontrada ou você não tem permissão para modificá-la." });
        }
        res.json(updatedNotification);
    } catch (err) {
        console.error("Erro ao marcar notificação como lida:", err);
        res.status(500).json({ message: "Erro interno ao marcar notificação como lida." });
    }
});

// ROTA: Marcar todas as notificações do usuário como lidas
// ACESSO: PUT /api/notifications/read-all
router.put('/read-all', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedNotifications = await Notification.markAllAsRead(userId);
        res.json({ message: "Todas as notificações foram marcadas como lidas.", count: updatedNotifications.length });
    } catch (err) {
        console.error("Erro ao marcar todas as notificações como lidas:", err);
        res.status(500).json({ message: "Erro interno ao marcar todas as notificações como lidas." });
    }
});


module.exports = router;