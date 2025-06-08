// config/db.js
const { Pool } = require('pg');
// Ajuste o path se o seu .env não estiver um nível acima e na raiz do backend
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// const isProduction = process.env.NODE_ENV === 'production'; // Você pode usar isso mais tarde
// Para Neon, SSL é geralmente necessário sempre.
const useSSL = process.env.DB_SSL === 'true';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    ssl: useSSL ? { rejectUnauthorized: false } : false, // rejectUnauthorized: false pode ser necessário com alguns CAs autoassinados ou configurações do Neon. Para produção mais robusta, você pode precisar do CA do Neon.
});

// Teste de conexão
pool.connect((err, client, release) => {
    if (err) {
        console.error('---------------------------------------------------------');
        console.error('ERRO AO ADQUIRIR CLIENTE DO POOL DE CONEXÃO COM NEON:');
        console.error('Verifique se as variáveis DB_* no arquivo .env estão corretas e se o Neon está acessível.');
        console.error('Detalhes do erro:', err.stack);
        console.error('---------------------------------------------------------');
        return;
    }
    client.query('SELECT NOW() AS neon_time', (err, result) => { // Adicionei um alias para clareza
        release();
        if (err) {
            console.error('---------------------------------------------------------');
            console.error('ERRO AO EXECUTAR QUERY DE TESTE DE CONEXÃO COM NEON:');
            console.error('Detalhes do erro:', err.stack);
            console.error('---------------------------------------------------------');
            return;
        }
        console.log('---------------------------------------------------------');
        console.log('CONEXÃO COM O PostgreSQL (NEON.TECH) BEM-SUCEDIDA!');
        console.log('Hora atual do banco Neon:', result.rows[0].neon_time);
        console.log('---------------------------------------------------------');
    });
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};