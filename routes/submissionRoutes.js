// SAGA_MVP/routes/submissionRoutes.js
const router = require('express').Router();
const Submission = require('../models/submissionModel');
const Inscription = require('../models/inscriptionModel'); // Para verificar o dono da inscrição
const Competition = require('../models/competitionModel'); // Para verificar datas e o criador
const notificationService = require('../services/notificationService');
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');

// ROTA: Um atleta envia seu vídeo de prova
// ACESSO: POST /api/submissions/
router.post('/', ensureAuthenticated, ensureRole(['atleta']), async (req, res) => {
    const { inscription_id, video_url, athlete_comments } = req.body;
    const athlete_id = req.user.id;

    try {
        // 1. Verificar se a inscrição existe e pertence ao atleta logado
        const inscriptionResult = await db.query('SELECT * FROM inscriptions WHERE id = $1', [inscription_id]);
        if (inscriptionResult.rows.length === 0) {
            return res.status(404).json({ message: "Inscrição não encontrada." });
        }
        const inscription = inscriptionResult.rows[0];

        if (inscription.athlete_id !== athlete_id) {
            return res.status(403).json({ message: "Você não tem permissão para enviar uma prova para esta inscrição." });
        }
        if (inscription.status !== 'confirmada') {
             return res.status(400).json({ message: "Sua inscrição precisa estar confirmada para enviar uma prova." });
        }

        // 2. Verificar se a competição está no período de submissão
        const competition = await Competition.findById(inscription.competition_id);
        const now = new Date();
        if (now < new Date(competition.submission_start_date) || now > new Date(competition.submission_end_date)) {
            return res.status(400).json({ message: "O período para envio de provas para esta competição não está ativo." });
        }

        // 3. Criar a submissão (a constraint UNIQUE no DB já previne duplicatas, mas uma verificação aqui seria boa em um sistema mais complexo)
        const newSubmission = await Submission.create({ inscription_id, video_url, athlete_comments });
        try {
            await notificationService.notifyNewSubmission(
                competition.creator_id,
                athlete.username,
                competition.name,
                competition.id
            );
        } catch (notificationError) {
            console.error("Falha ao criar notificação de nova submissão:", notificationError);
        }
        
        res.status(201).json({ message: "Prova enviada com sucesso!", submission: newSubmission });

    } catch (err) {
        console.error("Erro ao criar submissão:", err);
        // Tratar erro de constraint única se o usuário tentar enviar duas vezes
        if (err.constraint === 'submissions_inscription_id_key') {
            return res.status(400).json({ message: "Você já enviou uma prova para esta inscrição." });
        }
        res.status(500).json({ message: "Erro interno ao processar sua submissão." });
    }
});

// <<--- NOVA ROTA PARA O ATLETA EDITAR SEU ENVIO ---<<<
// ACESSO: PUT /api/submissions/:submissionId
router.put('/:submissionId', ensureAuthenticated, ensureRole(['atleta']), async (req, res) => {
    const { submissionId } = req.params;
    const { video_url, athlete_comments } = req.body;
    const athlete_id = req.user.id;

    try {
        // A lógica de verificação de permissão e datas deve ser adicionada aqui, similar à de criação.
        // Por simplicidade, o model já tem uma verificação de dono, mas poderíamos adicionar verificação de data aqui também.

        const updatedSubmission = await Submission.updateByUser(submissionId, athlete_id, { video_url, athlete_comments });

        if (!updatedSubmission) {
            return res.status(404).json({ message: "Submissão não encontrada ou você não tem permissão para editá-la." });
        }

        res.json({ message: "Sua prova foi atualizada com sucesso!", submission: updatedSubmission });
    } catch (err) {
        console.error("Erro ao atualizar submissão:", err);
        res.status(500).json({ message: "Erro interno ao atualizar sua prova." });
    }
});

// ROTA: Um Box/Admin avalia (dá nota) para uma submissão
// ACESSO: PUT /api/submissions/:submissionId/grade
router.put('/:submissionId/grade', ensureAuthenticated, ensureRole(['box', 'admin']), async (req, res) => {
    const { submissionId } = req.params;
    const { score, creator_feedback } = req.body;
    const evaluator_id = req.user.id;

    try {
        // 1. Buscar a submissão para encontrar a competição e o criador
        const submissionResult = await db.query(
            `SELECT s.*, i.competition_id, c.creator_id 
             FROM submissions s
             JOIN inscriptions i ON s.inscription_id = i.id
             JOIN competitions c ON i.competition_id = c.id
             WHERE s.id = $1`, [submissionId]
        );

        if (submissionResult.rows.length === 0) {
            return res.status(404).json({ message: "Submissão não encontrada." });
        }
        const submission = submissionResult.rows[0];

        // 2. Verificar se o avaliador é o criador da competição ou um admin
        if (evaluator_id !== submission.creator_id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Você não tem permissão para avaliar esta submissão." });
        }

        // 3. Validar a nota
        if (score === undefined || score === null || score < 0) { // Pode adicionar score > 100 se houver um máximo
            return res.status(400).json({ message: "A nota fornecida é inválida." });
        }

        const inscriptionResult = await db.query('SELECT * FROM inscriptions WHERE id = $1', [submission.inscription_id]);
        const athlete_id = inscriptionResult.rows[0].athlete_id;
        const competition_id = inscriptionResult.rows[0].competition_id;
        const competition = await Competition.findById(competition_id);

        // 4. Atualizar a submissão com a nota e feedback
        const gradedSubmission = await Submission.grade(submissionId, { score, creator_feedback });

        try {
            await notificationService.notifySubmissionGraded(
                athlete_id,
                competition.name,
                competition.id
            );
        } catch (notificationError) {
            console.error("Falha ao criar notificação de prova avaliada:", notificationError);
        }

        // TODO: Notificar o atleta sobre a avaliação (funcionalidade futura)
        res.json({ message: "Submissão avaliada com sucesso!", submission: gradedSubmission });

    } catch (err) {
        console.error("Erro ao avaliar submissão:", err);
        res.status(500).json({ message: "Erro interno ao avaliar a submissão." });
    }
});


// Adicionar a importação do 'db' no topo do arquivo para a query direta
const db = require('../config/db');

module.exports = router;