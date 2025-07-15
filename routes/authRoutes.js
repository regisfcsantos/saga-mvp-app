// routes/authRoutes.js
const router = require('express').Router();
const passport = require('passport');
const db = require('../config/db');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Para carregar CLIENT_URL

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'; // URL do seu frontend

// Rota para iniciar autenticação com Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'] // Escopos que você quer solicitar ao Google
}));

// Rota de callback do Google (para onde o Google redireciona após o usuário permitir/negar)
router.get('/google/callback',
    passport.authenticate('google', {
        // successRedirect: `${CLIENT_URL}/perfil`, // Redireciona para o perfil no frontend em caso de sucesso
        failureRedirect: `${CLIENT_URL}/login?error=google_failed`, // Redireciona para uma página de login com erro
        failureMessage: true // Permite que mensagens de falha sejam passadas
    }),
    (req, res) => {
        // Se chegou aqui, a autenticação foi bem-sucedida.
        // req.user contém o usuário autenticado (do `done(null, user)` no passport-setup.js)
        // Redireciona para a página de perfil no frontend ou para onde você quiser.
        res.redirect(CLIENT_URL); // Ou CLIENT_URL + '/dashboard' etc.
    }
);

// Rota para iniciar autenticação com Facebook
router.get('/facebook', passport.authenticate('facebook', {
    scope: ['public_profile']
}));

// Rota de callback do Facebook
router.get('/facebook/callback',
    passport.authenticate('facebook', {
        // successRedirect: `${CLIENT_URL}/perfil`,
        failureRedirect: `${CLIENT_URL}/login?error=facebook_failed`,
        failureMessage: true
    }),
    (req, res) => {
        res.redirect(CLIENT_URL);
    }
);

// Rota para verificar se o usuário está logado e pegar seus dados
router.get('/current_user', (req, res) => {
    if (req.isAuthenticated()) { // req.isAuthenticated() é adicionado pelo Passport
        // Não envie a senha ou outros dados sensíveis do req.user
        const { id, username, email, bio, profile_photo_url, role, is_box_approved, tipo_esporte, status } = req.user;
        res.status(200).json({
            user: { id, username, email, bio, profile_photo_url, role, is_box_approved, tipo_esporte, status }
        });
    } else {
        res.status(200).json({ user: null }); // Ou res.status(401).json({ message: 'Não autenticado' });
    }
});

// Rota de Logout
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            if (err) {
                console.error("Erro ao destruir a sessão durante o logout:", err);
            }
            res.clearCookie('connect.sid'); // 'connect.sid' é o nome padrão do cookie de sessão do Express Session
            res.status(200).json({ message: 'Logout bem-sucedido', redirectTo: CLIENT_URL });
        });
    });
});

// ACESSO: POST /api/auth/validate-invite
router.post('/validate-invite', ensureAuthenticated, async (req, res) => {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode) {
        return res.status(400).json({ message: 'O código do convite é obrigatório.' });
    }

    try {
        // 1. Encontrar o convite e verificar se é válido e não foi usado
        const inviteResult = await db.query(
            'SELECT * FROM invitations WHERE UPPER(code) = UPPER($1) AND is_used = FALSE',
            [inviteCode]
        );

        if (inviteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Código de convite inválido ou já utilizado.' });
        }

        const invitation = inviteResult.rows[0];

        // 2. Atualizar o status do usuário para 'active'
        await db.query(
            "UPDATE users SET status = 'active' WHERE id = $1",
            [userId]
        );

        // 3. Marcar o convite como usado
        await db.query(
            'UPDATE invitations SET is_used = TRUE, used_by = $1, used_at = CURRENT_TIMESTAMP WHERE id = $2',
            [userId, invitation.id]
        );

        // 4. Retornar uma mensagem de sucesso
        res.status(200).json({ message: 'Convite validado com sucesso! Bem-vindo(a)!' });

    } catch (error) {
        console.error("Erro ao validar convite:", error);
        res.status(500).json({ message: 'Ocorreu um erro no servidor ao validar o convite.' });
    }
});

module.exports = router;