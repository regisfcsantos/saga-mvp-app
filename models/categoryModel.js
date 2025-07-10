// models/categoryModel.js
const db = require('../config/db');

const Category = {
    // Encontra todas as categorias disponíveis para usar nos formulários
    findAll: async () => {
        const query = 'SELECT * FROM categories ORDER BY name ASC;';
        const { rows } = await db.query(query);
        return rows;
    },

    // Cria uma nova categoria (para uso futuro do admin)
    create: async ({ name, base_category, gender, description }) => {
        const query = `
            INSERT INTO categories (name, base_category, gender, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const params = [name, base_category, gender, description];
        const { rows } = await db.query(query, params);
        return rows[0];
    }

    // Futuramente podemos adicionar findById, update, delete, etc.
};

module.exports = Category;