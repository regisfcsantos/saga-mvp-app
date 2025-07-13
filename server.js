// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./config/db');

const session = require('express-session'); // Para gerenciar sessões
const cookieParser = require('cookie-parser'); // Para parsear cookies (necessário para sessões)
const passport = require('passport'); // Framework de autenticação
require('./config/passport-setup'); // Executa o arquivo de configuração do Passport que acabamos de criar

const app = express();
const PORT = process.env.PORT || 5001;

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Agora a variável CLIENT_URL existe e pode ser usada no cors.
app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middlewares para Sessão e Passport.js
app.use(cookieParser()); // Deve vir antes do session
app.use(session({
    secret: process.env.SESSION_SECRET, // Segredo para assinar o cookie da sessão (do seu .env)
    resave: false,                      // Não salva a sessão se não houver modificações
    saveUninitialized: false,           // Não cria sessão até que algo seja armazenado
    // cookie: { 
    //   secure: process.env.NODE_ENV === 'production', // Use cookies seguros em produção (HTTPS)
    //   httpOnly: true, // Ajuda a prevenir ataques XSS
    //   maxAge: 24 * 60 * 60 * 1000 // Opcional: tempo de vida do cookie (ex: 1 dia)
    // }
}));

app.use(passport.initialize()); // Inicializa o Passport
app.use(passport.session());    // Permite que o Passport use sessões do Express

// Rotas de Autenticação
const authRoutes = require('./routes/authRoutes'); // Importa as rotas de autenticação
const userRoutes = require('./routes/userRoutes'); // <-- ADICIONE ESTA LINHA
const adminRoutes = require('./routes/adminRoutes'); // <-- ADICIONE ESTA LINHA
const competitionRoutes = require('./routes/competitionRoutes'); // <-- ADICIONE ESTA LINHA
const inscriptionRoutes = require('./routes/inscriptionRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/auth', authRoutes); // Monta as rotas de autenticação sob o prefixo /api/auth
app.use('/api/users', userRoutes); // <-- ADICIONE ESTA LINHA (monta as rotas de usuário sob /api/users)
app.use('/api/admin', adminRoutes); // <-- ADICIONE ESTA LINHA (monta as rotas de admin sob /api/admin)
app.use('/api/competitions', competitionRoutes); // <-- ADICIONE ESTA LINHA
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/notifications', notificationRoutes);

// Suas rotas de teste (podem vir antes ou depois, mas as rotas de auth devem estar configuradas)
app.get('/', (req, res) => {
    res.send('API SAGA MVP está funcionando!');
});
app.get('/test-api', (req, res) => {
  res.json({ message: 'Olá do Backend Express para o React! Conexão OK!' });
});

// Futuramente: Importar e usar outras rotas (userRoutes, competitionRoutes, etc.)
// Ex: const userRoutes = require('./routes/userRoutes');
// app.use('/api/users', userRoutes);

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('API SAGA MVP está funcionando!');
});

// Adicione esta rota que usamos para o teste do frontend, se ainda não tiver
app.get('/test-api', (req, res) => {
  res.json({ message: 'Olá do Backend Express para o React!' });
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});