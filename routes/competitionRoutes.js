// SAGA_MVP/routes/competitionRoutes.js
const router = require('express').Router();
const Competition = require('../models/competitionModel');
const Inscription = require('../models/inscriptionModel');
const Submission = require('../models/submissionModel');
const { ensureAuthenticated, ensureRole, ensureBoxApproved } = require('../middleware/authMiddleware'); // Vamos usar os middlewares

// ROTA: Criar uma nova competição
// ACESSO: POST /api/competitions
// Protegida: Apenas para usuários 'box' aprovados ou 'admin'
router.post('/', ensureAuthenticated, ensureRole(['box', 'admin']), async (req, res) => {
    if (req.user.role === 'box' && !req.user.is_box_approved) {
        return res.status(403).json({ message: 'Seu perfil de Box precisa ser aprovado para criar competições.' });
    }

    const competitionData = { 
        ...req.body, 
        type: req.body.type || 'competition',
        creator_id: req.user.id 
    };

    // Validação básica (pode ser expandida)
    if (!competitionData.name || !competitionData.description || !competitionData.rules) {
        return res.status(400).json({ message: 'Nome, descrição e regras são obrigatórios.' });
    }
    // Adicionar mais validações para datas, preço, etc.

    if (competitionData.type === 'challenge') {
        competitionData.inscription_start_date = null;
        competitionData.inscription_end_date = null;
        competitionData.submission_start_date = null;
        competitionData.submission_end_date = null;
        competitionData.results_date = null;
        competitionData.price = 0; // Desafios podem ser sempre gratuitos
        competitionData.awards_info = null;
        competitionData.category = null;
        // Limpar campos de pagamento também, se aplicável
        competitionData.payment_method_name = null;
        competitionData.payment_details = null;
        competitionData.proof_of_payment_recipient = null;
        competitionData.proof_of_payment_contact = null;
        competitionData.payment_instructions_detailed = null;
    }

    try {
        const newCompetition = await Competition.create(competitionData);
        res.status(201).json(newCompetition);
    } catch (err) {
        console.error("Erro ao criar evento:", err);
        res.status(500).json({ message: "Erro interno ao criar o evento." });
    }
});

// ROTA: Listar todas as competições (público)
// ACESSO: GET /api/competitions
router.get('/', async (req, res) => {
    try {
        // req.query contém os parâmetros da URL, ex: { name: 'Desafio', creator: 'Crossfit181' }
        const filters = req.query; 
        const competitions = await Competition.findAll(filters);
        res.json(competitions);
    } catch (err) {
        console.error("Erro ao buscar todas as competições:", err);
        res.status(500).json({ message: "Erro interno ao buscar competições." });
    }
});

// ROTA: Buscar detalhes de uma competição específica pelo ID (público)
// ACESSO: GET /api/competitions/:id
router.get('/:id', async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id); // Já inclui dados do criador
        if (!competition) {
            return res.status(404).json({ message: 'Competição não encontrada.' });
        }
        res.json(competition);
    } catch (err) {
        console.error("Erro ao buscar competição por ID:", err);
        res.status(500).json({ message: "Erro interno ao buscar a competição." });
    }
});

// ROTA: Listar competições criadas pelo usuário logado (Box)
// ACESSO: GET /api/competitions/my-creations
// Protegida: Apenas para usuários 'box' ou 'admin'
router.get('/my-creations/list', ensureAuthenticated, ensureRole(['box', 'admin']), async (req, res) => {
    try {
        const competitions = await Competition.findByCreatorId(req.user.id);
        res.json(competitions);
    } catch (err) {
        console.error("Erro ao buscar competições criadas pelo usuário:", err);
        res.status(500).json({ message: "Erro interno ao buscar suas competições." });
    }
});


// ROTA: Atualizar uma competição existente
// ACESSO: PUT /api/competitions/:id
// Protegida: Apenas o criador (Box aprovado) ou admin pode atualizar
router.put('/:id', ensureAuthenticated, ensureRole(['box', 'admin']), async (req, res) => {
    const { id } = req.params;
    const competitionData = req.body;

    try {
        const competition = await Competition.findById(id);
        if (!competition) {
            return res.status(404).json({ message: 'Competição não encontrada.' });
        }

        // Verifica se o usuário logado é o criador da competição ou um admin
        if (competition.creator_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Você não tem permissão para editar esta competição.' });
        }
         // Se for um 'box' editando, garantir que ele está aprovado
        if (req.user.role === 'box' && !req.user.is_box_approved) {
            return res.status(403).json({ message: 'Seu perfil de Box precisa ser aprovado para editar competições.' });
        }

        if (competitionData.type === 'challenge') {
            competitionData.inscription_start_date = null;
            competitionData.inscription_end_date = null;
            competitionData.submission_start_date = null;
            competitionData.submission_end_date = null;
            competitionData.results_date = null;
            competitionData.price = 0; 
            competitionData.awards_info = null;
        }

        const updatedCompetition = await Competition.update(id, competitionData);
        if (!updatedCompetition) { // Se o model.update retornar null por não ter campos válidos
             return res.status(400).json({ message: 'Nenhum dado válido fornecido para atualização ou competição não encontrada.' });
        }
        res.json(updatedCompetition);
    } catch (err) {
        console.error("Erro ao atualizar competição:", err);
        res.status(500).json({ message: "Erro interno ao atualizar a competição." });
    }
});

// ROTA: Deletar uma competição
// ACESSO: DELETE /api/competitions/:id
// Protegida: Apenas o criador (Box aprovado) ou admin pode deletar
router.delete('/:id', ensureAuthenticated, ensureRole(['box', 'admin']), async (req, res) => {
    const { id } = req.params;

    try {
        const competition = await Competition.findById(id);
        if (!competition) {
            return res.status(404).json({ message: 'Competição não encontrada.' });
        }

        if (competition.creator_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Você não tem permissão para deletar esta competição.' });
        }
        // Se for um 'box' deletando, garantir que ele está aprovado
        if (req.user.role === 'box' && !req.user.is_box_approved) {
             return res.status(403).json({ message: 'Seu perfil de Box precisa ser aprovado para deletar competições.' });
        }

        // Adicionar lógica para verificar se há inscrições antes de deletar (importante para um app real)
        // Por agora, um delete direto:
        const deletedCompetition = await Competition.delete(id);
        res.json({ message: 'Competição deletada com sucesso.', competition: deletedCompetition });
    } catch (err) {
        console.error("Erro ao deletar competição:", err);
        res.status(500).json({ message: "Erro interno ao deletar a competição." });
    }
});

// <<--- NOVA ROTA PARA LISTAR INSCRIÇÕES DE UMA COMPETIÇÃO ---<<<
// ACESSO: GET /api/competitions/:id/inscriptions
// Protegida: Apenas o criador ou admin pode ver as inscrições
router.get('/:id/inscriptions', ensureAuthenticated, ensureRole(['box', 'admin']), async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar se a competição existe e se o usuário tem permissão
        const competition = await Competition.findById(id);
        if (!competition) {
            return res.status(404).json({ message: "Competição não encontrada." });
        }
        if (req.user.id !== competition.creator_id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Você não tem permissão para ver as inscrições desta competição." });
        }

        const inscriptions = await Inscription.findByCompetitionId(id);
        res.json(inscriptions);
    } catch (err) {
        console.error("Erro ao buscar inscrições da competição:", err);
        res.status(500).json({ message: "Erro interno ao buscar inscrições." });
    }
});

// ACESSO: GET /api/competitions/:id/submissions
// Protegida: Apenas o criador ou admin pode ver as submissões
router.get('/:id/submissions', ensureAuthenticated, ensureRole(['box', 'admin']), async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar se a competição existe e se o usuário tem permissão
        const competition = await Competition.findById(id);
        if (!competition) {
            return res.status(404).json({ message: "Competição não encontrada." });
        }
        if (req.user.id !== competition.creator_id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Você não tem permissão para ver as submissões desta competição." });
        }

        // Usar a função que criamos no submissionModel
        const submissions = await Submission.findAllByCompetitionId(id);
        res.json(submissions);
    } catch (err) {
        console.error("Erro ao buscar submissões da competição:", err);
        res.status(500).json({ message: "Erro interno ao buscar submissões." });
    }
});

// ACESSO: GET /api/competitions/:id/ranking
// Rota pública, não precisa de autenticação
router.get('/:id/ranking', async (req, res) => {
    const { id } = req.params;
    try {
        // Usa a função que já criamos no submissionModel
        const ranking = await Submission.getRankingByCompetitionId(id);
        res.json(ranking);
    } catch (err) {
        console.error("Erro ao buscar ranking da competição:", err);
        res.status(500).json({ message: "Erro interno ao buscar o ranking." });
    }
});

const Category = require('../models/categoryModel');
router.get('/utils/categories', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (err) {
        console.error("Erro ao buscar categorias:", err);
        res.status(500).json({ message: "Erro interno ao buscar categorias." });
    }
});

module.exports = router;