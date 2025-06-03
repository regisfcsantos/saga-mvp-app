// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('API SAGA MVP está funcionando!');
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});