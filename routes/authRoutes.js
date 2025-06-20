// routes/authRoutes.js
const router = require('express').Router();
const passport = require('passport');
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
        res.redirect(`${CLIENT_URL}/perfil`); // Ou CLIENT_URL + '/dashboard' etc.
    }
);

// Rota para iniciar autenticação com Facebook
router.get('/facebook', passport.authenticate('facebook', {
    scope: ['public_profile', 'email']
}));

// Rota de callback do Facebook
router.get('/facebook/callback',
    passport.authenticate('facebook', {
        // successRedirect: `${CLIENT_URL}/perfil`,
        failureRedirect: `${CLIENT_URL}/login?error=facebook_failed`,
        failureMessage: true
    }),
    (req, res) => {
        res.redirect(`${CLIENT_URL}/perfil`);
    }
);

// Rota para verificar se o usuário está logado e pegar seus dados
router.get('/current_user', (req, res) => {
    console.log('--- Rota /api/auth/current_user ---');
    console.log('req.isAuthenticated():', req.isAuthenticated()); // LOG 6
    console.log('req.user (da sessão):', req.user); // LOG 7
    if (req.isAuthenticated()) { // req.isAuthenticated() é adicionado pelo Passport
        // Não envie a senha ou outros dados sensíveis do req.user
        const { id, username, email, bio, profile_photo_url, role, is_box_approved, tipo_esporte } = req.user;
        res.status(200).json({
            user: { id, username, email, bio, profile_photo_url, role, is_box_approved, tipo_esporte }
        });
    } else {
        res.status(200).json({ user: null }); // Ou res.status(401).json({ message: 'Não autenticado' });
    }
});

// Rota de Logout
router.get('/logout', (req, res, next) => {
    req.logout(function(err) { // req.logout() agora requer um callback
        if (err) { return next(err); }
        // Opcional: destruir a sessão completamente do lado do servidor
        req.session.destroy((err) => {
            if (err) {
                console.error("Erro ao destruir a sessão durante o logout:", err);
                // Mesmo com erro na destruição da sessão, o logout do passport ocorreu.
                // Podemos tentar limpar o cookie e redirecionar.
            }
            res.clearCookie('connect.sid'); // 'connect.sid' é o nome padrão do cookie de sessão do Express Session
            // Redireciona para a página inicial do frontend após o logout
            res.status(200).json({ message: 'Logout bem-sucedido', redirectTo: CLIENT_URL });
        });
    });
});

module.exports = router;