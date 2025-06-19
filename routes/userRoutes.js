// SAGA_MVP/routes/userRoutes.js
const router = require('express').Router();
const User = require('../models/userModel'); // Importa o modelo de usuário que acabamos de preencher
const Inscription = require('../models/inscriptionModel');
const Competition = require('../models/competitionModel');
const notificationService = require('../services/notificationService');
const { ensureAuthenticated } = require('../middleware/authMiddleware'); // Importa o middleware para proteger rotas

// ROTA: Pegar perfil do usuário logado (privado)
// ACESSO: GET /api/users/me
router.get('/me', ensureAuthenticated, async (req, res) => {
    // req.user é populado pelo Passport após o login e contém os dados do usuário da sessão.
    // Vamos retornar os campos relevantes.
    try {
        // Buscamos o usuário novamente do banco para garantir dados atualizados,
        // ou podemos confiar no req.user se ele for atualizado corretamente após cada modificação.
        // Para garantir, buscar do banco é mais seguro.
        const userFromDb = await User.findById(req.user.id);
        if (!userFromDb) {
            return res.status(404).json({ message: 'Usuário não encontrado no banco de dados.' });
        }
        const { id, username, email, bio, profile_photo_url, role, is_box_approved } = userFromDb;
        res.json({ id, username, email, bio, profile_photo_url, role, is_box_approved });
    } catch (err) {
        console.error("Erro ao buscar perfil /me:", err);
        res.status(500).json({ message: 'Erro ao buscar dados do perfil.' });
    }
});

// ROTA: Atualizar perfil do usuário logado (privado)
// ACESSO: PUT /api/users/me
router.put('/me', ensureAuthenticated, async (req, res) => {
    const { bio /*, username, profile_photo_url */ } = req.body; // Campos que podem ser atualizados
                                                              // Username e profile_photo_url podem ser mais complexos de atualizar diretamente

    // Validação básica
    if (bio !== undefined && bio.length > 280) { // Seu limite definido na tabela é 280
        return res.status(400).json({ message: 'Biografia excede o limite de 280 caracteres.' });
    }

    // Crie um objeto apenas com os campos que foram enviados para atualização
    const fieldsToUpdate = {};
    if (bio !== undefined) fieldsToUpdate.bio = bio;
    // if (username !== undefined) fieldsToUpdate.username = username; // Adicionar lógica de unicidade se habilitar
    // if (profile_photo_url !== undefined) fieldsToUpdate.profile_photo_url = profile_photo_url;

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' });
    }

    try {
        const updatedUser = await User.updateProfile(req.user.id, fieldsToUpdate);
        if (!updatedUser) { // Se o updateProfile retornar null por algum motivo (ex: usuário não encontrado)
            return res.status(404).json({ message: 'Usuário não encontrado para atualização.' });
        }
        // Retorna o usuário atualizado, sem campos sensíveis se houver
        const { id, username, email, bio: updatedBio, profile_photo_url: updatedPhoto, role, is_box_approved } = updatedUser;
        res.json({ id, username, email, bio: updatedBio, profile_photo_url: updatedPhoto, role, is_box_approved });
    } catch (err) {
        console.error("Erro ao atualizar perfil /me:", err);
        // Se você tiver constraints de unicidade (ex: para username) no DB, trate o erro aqui
        // if (err.constraint === 'users_username_key') {
        //     return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
        // }
        res.status(500).json({ message: 'Erro interno ao atualizar o perfil.' });
    }
});

// ROTA: Para um atleta solicitar tornar-se um "Box" (privado)
// ACESSO: POST /api/users/me/request-box-role
router.post('/me/request-box-role', ensureAuthenticated, async (req, res) => {
    if (req.user.role !== 'atleta') {
        return res.status(400).json({ message: 'Apenas atletas podem solicitar para se tornarem Box.' });
    }
    if (req.user.is_box_approved === true && req.user.role === 'box') { // Já é um box aprovado
        return res.status(400).json({ message: 'Você já é um Box aprovado.' });
    }
    if (req.user.role === 'box' && req.user.is_box_approved === false) { // Já solicitou e está pendente
        return res.status(400).json({ message: 'Sua solicitação para se tornar Box já foi enviada e está pendente de aprovação.' });
    }

    try {
        const updatedUser = await User.requestBoxRole(req.user.id);
        if (!updatedUser) {
            // Isso pode acontecer se o usuário não for encontrado ou não for mais 'atleta' no momento da query
            return res.status(404).json({ message: "Não foi possível processar a solicitação. Verifique seu status de usuário." });
        }
        // Retorna o usuário atualizado com o novo role e status de aprovação
        const { id, username, email, bio, profile_photo_url, role, is_box_approved } = updatedUser;
        res.json({ 
            message: 'Solicitação para se tornar Box enviada com sucesso! Aguarde aprovação do administrador.', 
            user: { id, username, email, bio, profile_photo_url, role, is_box_approved }
        });
    } catch (err) {
        console.error("Erro ao solicitar perfil de Box:", err);
        res.status(500).json({ message: 'Erro interno ao processar sua solicitação.' });
    }
});

router.put('/me/request-box-role', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.requestBoxRole(req.user.id);
        if (!user) { /* ... */ }

        // <<--- GERAR NOTIFICAÇÃO PARA TODOS OS ADMINS ---<<<
        try {
            const admins = await User.findAllAdmins();
            for (const admin of admins) {
                await notificationService.notifyNewBoxRequest(admin.id, req.user.username);
            }
        } catch (notificationError) {
            console.error("Falha ao criar notificação de solicitação de Box:", notificationError);
        }

        res.json({ message: "Solicitação enviada com sucesso! Aguarde a aprovação.", user });
    } catch (err) { /* ... */ }
});

// ACESSO: GET /api/users/search?q=nome_do_usuario
router.get('/search', async (req, res) => {
    const searchTerm = req.query.q; // 'q' é um parâmetro de query comum para busca

    if (!searchTerm || searchTerm.trim().length < 2) {
        // Não busca se o termo for muito curto ou vazio, retorna um array vazio.
        return res.json([]);
    }

    try {
        const users = await User.searchByUsername(searchTerm);
        res.json(users);
    } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        res.status(500).json({ message: "Erro interno ao buscar usuários." });
    }
});

// ROTA: Pegar perfil público de um usuário pelo username (público)
// ACESSO: GET /api/users/profile/:username  (Mudei a rota para ser mais explícita)
router.get('/profile/:username', async (req, res) => {
    try {
        const user = await User.findByUsername(req.params.username);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Prepara o objeto de resposta com os dados públicos do usuário
        const publicProfile = {
            id: user.id,
            username: user.username,
            bio: user.bio,
            profile_photo_url: user.profile_photo_url,
            role: user.role,
            is_box_approved: (user.role === 'box' ? user.is_box_approved : undefined),
            created_at: user.created_at,
            created_competitions: [],
            inscriptions: []
        };

        // Se o usuário for um Box aprovado, busca as competições que ele criou
        if (user.role === 'box' && user.is_box_approved) {
            publicProfile.created_competitions = await Competition.findByCreatorId(user.id);
        }

        // Busca as competições em que o usuário se inscreveu
        publicProfile.inscriptions = await Inscription.findCompetitionsByAthleteId(user.id);

        res.json(publicProfile);
    } catch (err) {
        console.error("Erro ao buscar perfil público:", err);
        res.status(500).json({ message: 'Erro ao buscar perfil do usuário.' });
    }
});


module.exports = router;