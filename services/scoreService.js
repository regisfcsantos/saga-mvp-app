// Em SAGA_MVP/services/scoreService.js
// SUBSTITUA TODO O CONTEÚDO DO ARQUIVO

const submissionModel = require('../models/submissionModel');

const getLevelForScore = (score) => {
    if (score >= 900) return 'Elite';
    if (score >= 750) return 'Avançado';
    if (score >= 500) return 'Intermediário';
    if (score > 0) return 'Iniciante';
    return 'Não Classificado';
};

const calculateScoresAndLevels = async (userId) => {
    const allSubmissions = await submissionModel.findAllByUser(userId);

    console.log(`[scoreService] Provas encontradas para user ${userId}:`, allSubmissions);

    if (allSubmissions.length === 0) {
        return { scores: {}, levels: {} };
    }

    // Objetos dinâmicos para armazenar os scores e contagens
    const categoryScores = {};
    const categoryCounts = {};

    allSubmissions.forEach(sub => {
        // Se a categoria da prova não for nula
        if (sub.category) {
            // Se for a primeira vez que vemos esta categoria, inicializamos ela nos nossos objetos
            if (!categoryScores[sub.category]) {
                categoryScores[sub.category] = 0;
                categoryCounts[sub.category] = 0;
            }
            // Acumulamos a pontuação e a contagem para a categoria da prova
            categoryScores[sub.category] += sub.score;
            categoryCounts[sub.category]++;
        }
    });

    const finalScores = {};
    const finalLevels = {};

    // Itera sobre as categorias que foram encontradas
    for (const category in categoryScores) {
        if (categoryCounts[category] > 0) {
            const averageScore = Math.round(categoryScores[category] / categoryCounts[category]);
            finalScores[category] = averageScore;
            finalLevels[category] = getLevelForScore(averageScore);
        }
    }

    console.log(`Scores FINAIS calculados para user ${userId}:`, finalScores);
    console.log(`[scoreService] Scores FINAIS calculados para user ${userId}:`, finalScores);
    return { scores: finalScores, levels: finalLevels };
};

module.exports = { calculateScoresAndLevels };