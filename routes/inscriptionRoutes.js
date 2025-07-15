// SAGA_MVP/routes/inscriptionRoutes.js
const router = require('express').Router();
const Inscription = require('../models/inscriptionModel');
const Competition = require('../models/competitionModel'); // Para verificar datas
const { ensureAuthenticated, ensureRole, ensureAccountActive } = require('../middleware/authMiddleware');
const db = require('../config/db');
const notificationService = require('../services/notificationService'); // <<--- IMPORTE O SERVIÇO


// ROTA: Um atleta se inscreve em uma competição
// ACESSO: POST /api/inscriptions/compete/:competitionId
router.post('/compete/:competitionId', ensureAuthenticated, ensureAccountActive, ensureRole(['atleta']), async (req, res) => {
    const { competitionId } = req.params;
    const athlete_id = req.user.id; // ID do usuário logado
    const athlete_username = req.user.username; // Username do usuário logado

    try {
        // 1. Verificar se a competição existe e se as inscrições estão abertas
        const competition = await Competition.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ message: "Evento não encontrado." });
        }

        let initialStatus = '';
        let successMessage = '';

        if (competition.type === 'competition') {
            if (competition.status !== 'publicada' || new Date(competition.inscription_end_date) < new Date()) {
                return res.status(400).json({ message: "As inscrições para esta competição estão encerradas." });
            }
            initialStatus = 'pendente_pagamento';
            successMessage = "Pré-inscrição realizada com sucesso! Siga as instruções de pagamento para confirmar sua vaga.";
        } else if (competition.type === 'challenge') {
            // Nova lógica para desafios
            if (competition.status !== 'publicada') {
                 return res.status(400).json({ message: "Este desafio não está disponível para inscrição." });
            }
            initialStatus = 'pendente_aprovacao';
            successMessage = "Inscrição no desafio realizada! Aguarde a aprovação do criador para enviar sua prova.";
        } else {
             return res.status(400).json({ message: "Tipo de evento inválido." });
        }

        const existingInscription = await Inscription.findByAthleteAndCompetition(athlete_id, competitionId);
        if (existingInscription) {
            return res.status(400).json({ message: "Você já está inscrito neste evento." });
        }

        // 3. Criar a nova inscrição
        const newInscription = await Inscription.create({ 
            athlete_id, 
            competition_id: competitionId,
            status: initialStatus // Passando o status correto
        });

        // 4. Enviar a notificação para o criador da competição
        try {
            await notificationService.notifyNewInscription(
                competition.creator_id,
                athlete_username,
                competition.name,
                competition.id
            );
        } catch (notificationError) {
            console.error("Falha ao criar notificação de nova inscrição:", notificationError);
        }

        // 5. Enviar UMA ÚNICA resposta de sucesso para o frontend
        res.status(201).json({ 
            message: successMessage,
            inscription: newInscription
        });

    } catch (err) {
        console.error("Erro ao criar inscrição:", err);
        if (err.constraint === 'unique_athlete_competition') {
            return res.status(400).json({ message: "Você já está inscrito neste evento." });
        }
        res.status(500).json({ message: "Erro interno ao processar sua inscrição." });
    }
});

// <<--- NOVA ROTA PARA VERIFICAR O STATUS DA INSCRIÇÃO DO USUÁRIO ATUAL ---<<<
// ACESSO: GET /api/inscriptions/status/:competitionId
router.get('/status/:competitionId', ensureAuthenticated, async (req, res) => {
    const { competitionId } = req.params;
    const athlete_id = req.user.id;

    try {
        // <<--- QUERY ATUALIZADA COM LEFT JOIN ---<<<
        const query = `
            SELECT 
                i.*, 
                s.id AS submission_id,
                s.video_url,
                s.athlete_comments
            FROM inscriptions i
            LEFT JOIN submissions s ON i.id = s.inscription_id
            WHERE i.athlete_id = $1 AND i.competition_id = $2;
        `;
        const { rows } = await db.query(query, [athlete_id, competitionId]);
        const inscriptionWithSubmission = rows[0];

        if (!inscriptionWithSubmission) {
            return res.json({ status: null });
        }
        res.json(inscriptionWithSubmission);
    } catch (err) {
        console.error("Erro ao verificar status da inscrição:", err);
        res.status(500).json({ message: "Erro ao verificar sua inscrição." });
    }
});

// <<--- NOVA ROTA PARA CONFIRMAR UMA INSCRIÇÃO (APROVAR PAGAMENTO) ---<<<
// ACESSO: PUT /api/inscriptions/:inscriptionId/confirm
// Protegida: Apenas o criador da competição ou admin pode confirmar
router.put('/:inscriptionId/confirm', ensureAuthenticated, ensureRole(['box', 'admin']), async (req, res) => {
    const { inscriptionId } = req.params;
    try {
        // Passo 1: Buscar a inscrição para encontrar a competição e verificar permissão
        const inscriptionResult = await db.query('SELECT * FROM inscriptions WHERE id = $1', [inscriptionId]); // Usando db.query diretamente para pegar competition_id
        if (inscriptionResult.rows.length === 0) {
            return res.status(404).json({ message: "Inscrição não encontrada." });
        }
        const competitionId = inscriptionResult.rows[0].competition_id;

        const competition = await Competition.findById(competitionId);
        if (!competition) {
             return res.status(404).json({ message: "Competição associada não encontrada." });
        }

        // Passo 2: Verificar se o usuário logado é o criador ou admin
        if (req.user.id !== competition.creator_id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Você não tem permissão para gerenciar esta inscrição." });
        }

        // Passo 3: Atualizar o status da inscrição para 'confirmada'
        const confirmedInscription = await Inscription.updateStatus(inscriptionId, 'confirmada');
        try {
            await notificationService.notifyInscriptionConfirmed(
                inscription.athlete_id,
                competition.name,
                competition.id
            );
        } catch (notificationError) {
            console.error("Falha ao criar notificação de inscrição confirmada:", notificationError);
        }

        res.json({ message: "Inscrição confirmada com sucesso!", inscription: confirmedInscription });

    } catch (err) {
        console.error("Erro ao confirmar inscrição:", err);
        res.status(500).json({ message: "Erro interno ao confirmar a inscrição." });
    }
});

// ACESSO: GET /api/inscriptions/my-inscriptions
router.get('/my-inscriptions', ensureAuthenticated, async (req, res) => {
    try {
        const athlete_id = req.user.id;
        const inscriptions = await Inscription.findCompetitionsByAthleteId(athlete_id);
        res.json(inscriptions);
    } catch (err) {
        console.error("Erro ao buscar as inscrições do usuário:", err);
        res.status(500).json({ message: "Erro interno ao buscar suas inscrições." });
    }
});

// <<--- NOVA ROTA PARA CANCELAR UMA INSCRIÇÃO (CRIADOR/ADMIN) ---<<<
// ACESSO: DELETE /api/inscriptions/:inscriptionId
router.delete('/:inscriptionId', ensureAuthenticated, ensureRole(['box', 'admin']), async (req, res) => {
    const { inscriptionId } = req.params;
    
    try {
        // Passo 1: Buscar a inscrição para verificar a permissão e pegar dados para notificação
        const inscriptionResult = await db.query('SELECT * FROM inscriptions WHERE id = $1', [inscriptionId]);
        if (inscriptionResult.rows.length === 0) {
            return res.status(404).json({ message: "Inscrição não encontrada." });
        }
        const inscription = inscriptionResult.rows[0];
        
        const competition = await Competition.findById(inscription.competition_id);
        if (!competition) {
            return res.status(404).json({ message: "Competição associada não encontrada." });
        }

        // Passo 2: Verificar se o usuário logado é o criador ou admin
        if (req.user.id !== competition.creator_id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Você não tem permissão para gerenciar esta inscrição." });
        }

        // Passo 3: Deletar a inscrição
        const deletedInscription = await Inscription.deleteById(inscriptionId);
        if (!deletedInscription) {
             return res.status(404).json({ message: "Não foi possível cancelar a inscrição." });
        }
        
        // Passo 4: Notificar o atleta que sua inscrição foi cancelada
        try {
            // Você precisará criar esta nova função de notificação no seu notificationService
            await notificationService.notifyInscriptionCancelled(
                inscription.athlete_id,
                competition.name
            );
        } catch (notificationError) {
            console.error("Falha ao criar notificação de cancelamento de inscrição:", notificationError);
        }
        
        res.json({ message: "Inscrição cancelada com sucesso!" });

    } catch (err) {
        console.error("Erro ao cancelar inscrição:", err);
        res.status(500).json({ message: "Erro interno ao cancelar a inscrição." });
    }
});

router.post('/:inscriptionId/reset-challenge', ensureAuthenticated, ensureAccountActive, ensureRole(['atleta']), async (req, res) => {
    const { inscriptionId } = req.params;
    const athlete_id = req.user.id;

    try {
        // 1. Buscar a inscrição e garantir que pertence ao atleta e é de um desafio
        const inscriptionResult = await db.query(
            `SELECT i.*, c.type 
             FROM inscriptions i
             JOIN competitions c ON i.competition_id = c.id
             WHERE i.id = $1`, [inscriptionId]
        );

        if (inscriptionResult.rows.length === 0) {
            return res.status(404).json({ message: "Inscrição não encontrada." });
        }
        const inscription = inscriptionResult.rows[0];

        if (inscription.athlete_id !== athlete_id) {
            return res.status(403).json({ message: "Você não tem permissão para modificar esta inscrição." });
        }
        if (inscription.type !== 'challenge') {
            return res.status(400).json({ message: "Esta funcionalidade está disponível apenas para desafios." });
        }

        // 2. Encontrar e deletar a submissão associada a esta inscrição
        // Usamos um 'DELETE ... WHERE ... RETURNING id' para saber se algo foi deletado
        const deleteSubResult = await db.query(
            'DELETE FROM submissions WHERE inscription_id = $1 RETURNING id', 
            [inscriptionId]
        );

        if (deleteSubResult.rowCount === 0) {
            // Isso pode acontecer se o atleta tentar resetar sem nunca ter enviado uma prova, o que é ok.
            console.log(`Atleta ${athlete_id} tentou resetar a inscrição ${inscriptionId} sem uma submissão existente. Permitindo...`);
        }
        
        // 3. (Opcional, mas bom) Se o status da inscrição não for 'confirmada', atualize-o.
        if (inscription.status !== 'confirmada') {
            await Inscription.updateStatus(inscriptionId, 'confirmada');
        }

        res.json({ message: "Tudo pronto! Você já pode enviar sua nova prova." });

    } catch (err) {
        console.error("Erro ao resetar participação no desafio:", err);
        res.status(500).json({ message: "Erro interno ao tentar resetar sua participação." });
    }
});

module.exports = router;