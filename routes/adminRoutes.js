// SAGA_MVP/routes/adminRoutes.js
const router = require('express').Router();
const crypto = require('crypto');
const db = require('../config/db');
const User = require('../models/userModel');
const notificationService = require('../services/notificationService');
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');

// Middleware para garantir que o usuário é admin para todas as rotas neste arquivo
router.use(ensureAuthenticated, ensureRole(['admin'])); 

// ROTA: Listar todas as solicitações pendentes de Box
// ACESSO: GET /api/admin/pending-boxes
router.get('/pending-boxes', async (req, res) => {
    try {
        const pendingUsers = await User.getPendingBoxRequests();
        res.json(pendingUsers);
    } catch (err) {
        console.error("Erro ao buscar solicitações pendentes de Box:", err);
        res.status(500).json({ message: "Erro ao buscar solicitações pendentes." });
    }
});

// ROTA: Aprovar uma solicitação de Box
// ACESSO: PUT /api/admin/approve-box/:userId
router.put('/approve-box/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const approvedUser = await User.approveBox(userId);
        if (!approvedUser) {
            return res.status(404).json({ message: "Usuário não encontrado ou não é um Box pendente." });
        }
        // TODO: Notificar o usuário que ele foi aprovado (funcionalidade futura)

        try {
            await notificationService.notifyBoxApproved(userId);
        } catch (notificationError) {
            console.error("Falha ao criar notificação de aprovação de Box:", notificationError);
        }

        res.json({ message: "Usuário aprovado como Box com sucesso!", user: approvedUser });
    } catch (err) {
        console.error("Erro ao aprovar Box:", err);
        res.status(500).json({ message: "Erro ao aprovar Box." });
    }
});

// ROTA: Rejeitar uma solicitação de Box
// ACESSO: PUT /api/admin/reject-box/:userId
router.put('/reject-box/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const rejectedUser = await User.rejectBoxRequest(userId); // Usando a nova função
        if (!rejectedUser) {
            return res.status(404).json({ message: "Usuário não encontrado ou não é um Box pendente para rejeição." });
        }
        try {
            await notificationService.notifyBoxRejected(userId);
        } catch (notificationError) {
            console.error("Falha ao criar notificação de recusa de Box:", notificationError);
        }

        res.json({ message: "Solicitação de Box rejeitada. Usuário revertido para atleta.", user: rejectedUser });
    } catch (err) {
        console.error("Erro ao rejeitar solicitação de Box:", err);
        res.status(500).json({ message: "Erro ao rejeitar solicitação de Box." });
    }
});

router.post('/invites/generate', async (req, res) => {
    const adminId = req.user.id;
    // Gera um código único e mais curto. Ex: "SAGA-a3f9b1"
    const newCode = `SAGA-${crypto.randomBytes(3).toString('hex')}`.toUpperCase();
    
    try {
        const result = await db.query(
            'INSERT INTO invitations (code, created_by) VALUES ($1, $2) RETURNING code',
            [newCode, adminId]
        );
        res.status(201).json({ 
            message: 'Código de convite gerado com sucesso!', 
            inviteCode: result.rows[0].code 
        });
    } catch (error) {
        // Trata o caso raro de colisão de código
        if (error.code === '23505') { // Código de erro do PostgreSQL para violação de unique constraint
             return res.status(500).json({ message: 'Ocorreu um erro raro ao gerar o código. Por favor, tente novamente.' });
        }
        console.error("Erro ao gerar código de convite:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;