// SAGA_MVP/routes/inscriptionRoutes.js
const router = require('express').Router();
const Inscription = require('../models/inscriptionModel');
const Competition = require('../models/competitionModel'); // Para verificar datas
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');
const db = require('../config/db');
const notificationService = require('../services/notificationService'); // <<--- IMPORTE O SERVIÇO


// ROTA: Um atleta se inscreve em uma competição
// ACESSO: POST /api/inscriptions/compete/:competitionId
router.post('/compete/:competitionId', ensureAuthenticated, ensureRole(['atleta']), async (req, res) => {
    const { competitionId } = req.params;
    const athlete_id = req.user.id;

    try {
        // 1. Verificar se a competição existe e se as inscrições estão abertas
        const competition = await Competition.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ message: "Competição não encontrada." });
        }
        if (competition.status !== 'publicada' || new Date(competition.inscription_end_date) < new Date()) {
            return res.status(400).json({ message: "As inscrições para esta competição estão encerradas." });
        }

        // 2. Verificar se o atleta já está inscrito
        const existingInscription = await Inscription.findByAthleteAndCompetition(athlete_id, competitionId);
        if (existingInscription) {
            return res.status(400).json({ message: "Você já está inscrito nesta competição." });
        }

        // 3. Criar a nova inscrição
        const newInscription = await Inscription.create({ athlete_id, competition_id: competitionId });
        res.status(201).json({ 
            message: "Pré-inscrição realizada com sucesso! Siga as instruções de pagamento para confirmar sua vaga.",
            inscription: newInscription
        });

        try {
            await notificationService.notifyNewInscription(
                competition.creator_id,
                athlete.username,
                competition.name,
                competition.id
            );
        } catch (notificationError) {
            console.error("Falha ao criar notificação de nova inscrição:", notificationError);
            // Não quebre a requisição principal por causa de uma notificação
        }

        res.status(201).json({ 
            message: "Pré-inscrição realizada com sucesso! Siga as instruções de pagamento para confirmar sua vaga.",
            inscription: newInscription
        });

    } catch (err) {
        console.error("Erro ao criar inscrição:", err);
        // Tratar erro de constraint única (se o usuário clicar duas vezes muito rápido)
        if (err.constraint === 'unique_athlete_competition') {
            return res.status(400).json({ message: "Você já está inscrito nesta competição." });
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

module.exports = router;