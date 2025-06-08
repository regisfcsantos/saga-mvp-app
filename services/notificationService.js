// SAGA_MVP/services/notificationService.js
const Notification = require('../models/notificationModel');

const notificationService = {
    // Notifica o criador sobre uma nova inscrição
    notifyNewInscription: async (creatorId, athleteUsername, competitionName, competitionId) => {
        const message = `"<span class="math-inline">\{athleteUsername\}" se inscreveu na sua competição "</span>{competitionName}".`;
        const link = `/competicoes/${competitionId}/gerenciar-inscricoes`;
        await Notification.create({ user_id: creatorId, message, link });
    },

    // Notifica o atleta que sua inscrição foi confirmada
    notifyInscriptionConfirmed: async (athleteId, competitionName, competitionId) => {
        const message = `Sua inscrição para "${competitionName}" foi confirmada! Boa sorte!`;
        const link = `/competicoes/${competitionId}`;
        await Notification.create({ user_id: athleteId, message, link });
    },

    // Notifica o criador sobre um novo envio de prova
    notifyNewSubmission: async (creatorId, athleteUsername, competitionName, competitionId) => {
        const message = `"<span class="math-inline">\{athleteUsername\}" enviou uma prova para a competição "</span>{competitionName}".`;
        const link = `/competicoes/${competitionId}/analisar-envios`;
        await Notification.create({ user_id: creatorId, message, link });
    },

    notifySubmissionGraded: async (athleteId, competitionName, competitionId) => {
        const message = `Sua prova para "${competitionName}" foi avaliada! Confira sua nota no ranking.`;
        const link = `/competicoes/${competitionId}`;
        await Notification.create({ user_id: athleteId, message, link });
    },

    notifyNewBoxRequest: async (adminId, requesterUsername) => {
        const message = `O usuário "${requesterUsername}" solicitou para se tornar um Box.`;
        const link = `/admin/aprovar-boxes`;
        await Notification.create({ user_id: adminId, message, link });
    },

    notifyBoxRejected: async (userId) => {
        const message = `Sua solicitação para se tornar um Box foi recusada. Entre em contato para mais detalhes.`;
        const link = `/perfil`;
        await Notification.create({ user_id: userId, message, link });
    },

    notifyBoxApproved: async (boxId) => {
        const message = `Parabéns! Sua solicitação para se tornar um Box foi aprovada. Você já pode criar competições.`;
        const link = `/contato`;
        await Notification.create({ user_id: boxId, message, link });
    }
};

module.exports = notificationService;