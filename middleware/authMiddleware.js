// SAGA_MVP/middleware/authMiddleware.js
module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if (req.isAuthenticated()) { // passport adiciona este método ao req
            return next();
        }
        res.status(401).json({ message: 'Autenticação necessária. Por favor, faça login para continuar.' });
    },

    // Você pode adicionar outros middlewares de role aqui no futuro, como:
    ensureRole: (roles) => { 
        return (req, res, next) => {
            if (req.isAuthenticated() && roles.includes(req.user.role)) {
                return next();
            }
            if (!req.isAuthenticated()) {
                return res.status(401).json({ message: 'Autenticação necessária.' });
            }
            res.status(403).json({ message: 'Acesso negado. Você não tem permissão para este recurso.' });
        };
    },
    
    ensureBoxApproved: (req, res, next) => {
        if (req.isAuthenticated() && req.user.role === 'box' && req.user.is_box_approved) {
            return next();
        }
        if (req.isAuthenticated() && req.user.role === 'box' && !req.user.is_box_approved) {
            return res.status(403).json({ message: 'Seu perfil de Box ainda não foi aprovado.' });
        }
        if (req.user.role === 'admin') { // Admin sempre tem acesso
            return next();
        }
        if (!req.isAuthenticated()) {
             return res.status(401).json({ message: 'Autenticação necessária.' });
        }
        res.status(403).json({ message: 'Acesso negado.' });
    },

    ensureAccountActive: (req, res, next) => {
        if (req.user && req.user.status === 'active') {
            return next();
        }
        
        res.status(403).json({ message: 'Sua conta precisa ser ativada com um código de convite para realizar esta ação.' });
    }
};