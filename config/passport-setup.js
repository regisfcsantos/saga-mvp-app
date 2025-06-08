// config/passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('./db'); // Sua conexão com o banco de dados (config/db.js)
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Para carregar variáveis de ambiente

// SERIALIZAÇÃO E DESSERIALIZAÇÃO DO USUÁRIO PARA SESSÕES
// Define como o usuário será armazenado na sessão (geralmente pelo ID)
passport.serializeUser((user, done) => {
    console.log('--- SerializeUser ---');
    console.log('Usuário para serializar:', user); // LOG 1
    if (!user || typeof user.id === 'undefined') {
        console.error('SerializeUser: Tentativa de serializar usuário inválido ou sem ID.');
        return done(new Error('Usuário inválido para serialização'));
    }
    done(null, user.id);
});

// Define como o usuário será recuperado da sessão usando o ID armazenado
passport.deserializeUser(async (id, done) => {
    console.log('--- DeserializeUser ---');
    console.log('ID para desserializar:', id); // LOG 2
    try {
        const result = await db.query('SELECT id, username, email, bio, profile_photo_url, role, is_box_approved FROM users WHERE id = $1', [id]); // Selecionando campos específicos
        if (result.rows.length > 0) {
            console.log('Usuário desserializado encontrado no DB:', result.rows[0]); // LOG 3
            done(null, result.rows[0]);
        } else {
            console.error('DeserializeUser: Usuário NÃO encontrado no DB para o ID:', id); // LOG 4
            done(null, false); // Ou done(new Error('Usuário não encontrado'));
        }
    } catch (err) {
        console.error('DeserializeUser: Erro durante a consulta ao DB:', err); // LOG 5
        done(err, null);
    }
});

// ESTRATÉGIA DE AUTENTICAÇÃO COM GOOGLE
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback', // Esta URL deve ser EXATAMENTE a mesma configurada no Google Cloud Console
    proxy: true // Adicione se seu app estiver atrás de um proxy (ex: Heroku, Nginx) para https funcionar corretamente no callback
},
async (accessToken, refreshToken, profile, done) => {
    // 'profile' contém as informações do usuário retornadas pelo Google
    const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    const googleId = profile.id;
    const displayName = profile.displayName;
    const photoUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

    if (!email) {
        return done(new Error('Não foi possível obter o e-mail da conta Google.'), null);
    }

    try {
        // 1. Tenta encontrar o usuário pelo googleId
        let userResult = await db.query('SELECT * FROM users WHERE social_id = $1 AND social_provider = $2', [googleId, 'google']);

        if (userResult.rows.length > 0) {
            // Usuário encontrado com este googleId
            return done(null, userResult.rows[0]);
        } else {
            // 2. Se não encontrou pelo googleId, tenta encontrar pelo email (caso já exista cadastro com email de outra forma)
            userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userResult.rows.length > 0) {
                // Usuário encontrado com este email.
                // MVP: Considerar este um login válido e talvez atualizar o social_id e provider se estiverem vazios.
                // Ou retornar um erro se o email já estiver associado a outro provedor social.
                // Por simplicidade no MVP, se o email existe mas o social_id não bate, podemos considerar um conflito.
                // Se o social_id e provider estiverem nulos, podemos linkar a conta:
                const existingUser = userResult.rows[0];
                if (!existingUser.social_id && !existingUser.social_provider) {
                    const updatedUser = await db.query(
                        'UPDATE users SET social_id = $1, social_provider = $2, profile_photo_url = COALESCE($3, profile_photo_url), updated_at = CURRENT_TIMESTAMP WHERE email = $4 RETURNING *',
                        [googleId, 'google', photoUrl, email]
                    );
                    return done(null, updatedUser.rows[0]);
                }
                // Se o email existe com outro social_id/provider, é um conflito.
                return done(new Error('Este e-mail já está registrado com outro método de login.'), null);
            } else {
                // 3. Usuário não encontrado, criar um novo
                const defaultUsername = displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 10000);
                const newUserResult = await db.query(
                    'INSERT INTO users (username, email, profile_photo_url, social_provider, social_id, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [defaultUsername, email, photoUrl, 'google', googleId, 'atleta'] // Novos usuários são 'atleta' por padrão
                );
                return done(null, newUserResult.rows[0]);
            }
        }
    } catch (err) {
        return done(err, false);
    }
}));

// ESTRATÉGIA DE AUTENTICAÇÃO COM FACEBOOK
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/api/auth/facebook/callback', // Esta URL deve ser EXATAMENTE a mesma configurada no Facebook Developers
    profileFields: ['id', 'displayName', 'photos'], // Campos que queremos do Facebook
    proxy: true
},
async (accessToken, refreshToken, profile, done) => {
    // const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    const facebookId = profile.id;
    const displayName = profile.displayName;
    const photoUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

    // Facebook pode não retornar email. Decida como lidar com isso.
    // Para este MVP, se não vier email, não poderemos criar ou vincular por email.
    // Poderíamos criar um usuário sem email, mas a constraint UNIQUE NOT NULL no email da tabela 'users' impediria.
    // Uma solução seria ter uma etapa para o usuário fornecer o email.
    // Por agora, se o email não vier, o processo pode falhar ou criar um email placeholder se a tabela permitir.
    // A tabela users atual EXIGE email.

    // DEFINIÇÃO DO EMAIL PLACEHOLDER (CRUCIAL)
    // Se profile.id (facebookId) existir, este email NUNCA será null.
    const email = `fb_${facebookId}@placeholder.saga.com`; 

    /* comentado para teste sem email
    if (!email) { // Ajuste esta lógica se você permitir usuários sem email inicialmente
        console.warn("Facebook não forneceu email para o usuário:", displayName);
        // Para este exemplo, vamos retornar um erro se o email não vier.
        // Você pode mudar isso para, por exemplo, usar o facebookId como parte de um email placeholder se a tabela permitir email nulo ou se você tiver um campo 'username' obrigatório.
        return done(new Error('Não foi possível obter o e-mail da conta Facebook. Por favor, autorize o acesso ao e-mail no Facebook ou tente outro método.'), null);
    }
    */

    try {
        // 1. Tenta encontrar o usuário pelo facebookId
        let userResult = await db.query('SELECT * FROM users WHERE social_id = $1 AND social_provider = $2', [facebookId, 'facebook']);

        if (userResult.rows.length > 0) {
            return done(null, userResult.rows[0]);
        } else {
            // 2. Tenta encontrar pelo email
            userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userResult.rows.length > 0) {
                 const existingUser = userResult.rows[0];
                if (!existingUser.social_id && !existingUser.social_provider) {
                    const updatedUser = await db.query(
                        'UPDATE users SET social_id = $1, social_provider = $2, profile_photo_url = COALESCE($3, profile_photo_url), updated_at = CURRENT_TIMESTAMP WHERE email = $4 RETURNING *',
                        [facebookId, 'facebook', photoUrl, email]
                    );
                    return done(null, updatedUser.rows[0]);
                }
                return done(new Error('Este e-mail já está registrado com outro método de login.'), null);
            } else {
                // 3. Criar novo usuário
                const defaultUsername = displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 10000);
                const newUserResult = await db.query(
                    'INSERT INTO users (username, email, profile_photo_url, social_provider, social_id, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [defaultUsername, email, photoUrl, 'facebook', facebookId, 'atleta']
                );
                return done(null, newUserResult.rows[0]);
            }
        }
    } catch (err) {
        return done(err, false);
    }
}));

// Não é necessário exportar nada explicitamente, pois o passport.use() configura globalmente.
// Apenas certifique-se de que este arquivo é 'required' no seu server.js.