// SAGA_MVP/routes/submissionRoutes.js

const db = require('../config/db');
const scoreService = require('../services/scoreService');
const UserModel = require('../models/userModel');
const Selo = require('../models/seloModel'); // <<--- 1. NOVA IMPORTAÇÃO

const router = require('express').Router();
const Submission = require('../models/submissionModel');
const Inscription = require('../models/inscriptionModel');
const Competition = require('../models/competitionModel');
const notificationService = require('../services/notificationService');
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');

// ROTA: Um atleta envia seu vídeo de prova (NENHUMA MUDANÇA AQUI)
router.post('/', ensureAuthenticated, ensureRole(['atleta']), async (req, res) => {
    // ... seu código original, sem alterações ...
    const { inscription_id, video_url, athlete_comments } = req.body;
    const athlete_id = req.user.id;

    try {
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

        const competition = await Competition.findById(inscription.competition_id);
        
        // Para desafios (sem data), esta verificação precisa ser pulada
        if (competition.type === 'competition') {
            const now = new Date();
            if (now < new Date(competition.submission_start_date) || now > new Date(competition.submission_end_date)) {
                return res.status(400).json({ message: "O período para envio de provas para esta competição não está ativo." });
            }
        }

        const newSubmission = await Submission.create({ inscription_id, video_url, athlete_comments });
        try {
            await notificationService.notifyNewSubmission(
                competition.creator_id,
                req.user.username, // Usando o username do usuário logado
                competition.name,
                competition.id
            );
        } catch (notificationError) {
            console.error("Falha ao criar notificação de nova submissão:", notificationError);
        }
        
        res.status(201).json({ message: "Prova enviada com sucesso!", submission: newSubmission });

    } catch (err) {
        console.error("Erro ao criar submissão:", err);
        if (err.constraint === 'submissions_inscription_id_key') {
            return res.status(400).json({ message: "Você já enviou uma prova para esta inscrição." });
        }
        res.status(500).json({ message: "Erro interno ao processar sua submissão." });
    }
});

// ROTA PARA O ATLETA EDITAR SEU ENVIO (NENHUMA MUDANÇA AQUI)
router.put('/:submissionId', ensureAuthenticated, ensureRole(['atleta']), async (req, res) => {
    // ... seu código original, sem alterações ...
});

// ROTA: Um Box/Admin avalia (dá nota) para uma submissão
router.put('/:submissionId/grade', ensureAuthenticated, ensureRole(['box', 'admin']), async (req, res) => {
    const { submissionId } = req.params;
    const { score, creator_feedback, validation_status } = req.body;
    const evaluator_id = req.user.id;

    try {
        // ... sua lógica de busca e verificação de permissão (passos 1, 2, 3) ...
        const submissionResult = await db.query(
            // <<--- MUDANÇA: Adicionamos c.type ao SELECT para saber se é desafio ---<<<
            `SELECT s.*, i.competition_id, i.athlete_id, c.creator_id, c.type 
             FROM submissions s
             JOIN inscriptions i ON s.inscription_id = i.id
             JOIN competitions c ON i.competition_id = c.id
             WHERE s.id = $1`, [submissionId]
        );

        if (submissionResult.rows.length === 0) {
            return res.status(404).json({ message: "Submissão não encontrada." });
        }
        const submission = submissionResult.rows[0];

        if (evaluator_id !== submission.creator_id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Você não tem permissão para avaliar esta submissão." });
        }

        if (submission.type === 'challenge' && !['aprovado', 'reprovado'].includes(validation_status)) {
            return res.status(400).json({ message: "Para um desafio, você deve selecionar 'Aprovado' ou 'Reprovado'." });
        }

        // Para competições, o status pode ser nulo, mas a nota é essencial.
        const finalScore = score !== undefined && score !== null ? score : 0;
        
        // Passamos todos os dados para a função de avaliação
        const gradedSubmission = await Submission.grade(submissionId, { 
            score: finalScore, 
            creator_feedback, 
            validation_status: validation_status || 'avaliado' // Um status padrão para competições
        });

        const athlete_id = submission.athlete_id;
        const competition_id = submission.competition_id;

        // 5. Dispara o recálculo do Score do Atleta (bloco original mantido)
        scoreService.calculateScoresAndLevels(submission.athlete_id)
            .then(({ scores, levels }) => {
                console.log(`[submissionRoutes] Dados recebidos do scoreService para salvar:`, { scores, levels });
                UserModel.updateScoresAndLevels(submission.athlete_id, { scores, levels });
            })
            .catch(error => console.error(`FALHA NO RECÁLCULO DE SCORE para o atleta ${submission.athlete_id}:`, error));
        
        if (submission.type === 'challenge' && validation_status === 'aprovado') {
            Selo.create(submission.athlete_id, submission.competition_id)
                .then(newSelo => {
                    if (newSelo) {
                        console.log(`Selo ${newSelo.challenge_id} concedido ao usuário ${newSelo.user_id}`);
                        // Aqui você também poderia criar uma notificação para o usuário sobre o novo selo
                    }
                })
                .catch(error => {
                    console.error(`FALHA AO CONCEDER SELO para o atleta ${submission.athlete_id}:`, error);
                });
        }

        try {
            const competition = await Competition.findById(submission.competition_id);
            await notificationService.notifySubmissionGraded(
                athlete_id,
                competition.name,
                competition.id
            );
        } catch (notificationError) {
            console.error("Falha ao criar notificação de prova avaliada:", notificationError);
        }
        
        res.json({ message: "Submissão avaliada com sucesso!", submission: gradedSubmission });

    } catch (err) {
        console.error("Erro ao avaliar submissão:", err);
        res.status(500).json({ message: "Erro interno ao avaliar a submissão." });
    }
});

module.exports = router;