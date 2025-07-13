// client/src/api/axiosConfig.js

import axios from 'axios';

// A URL base do seu backend.
// Se você usa o "proxy" no package.json do React, pode deixar a baseURL comentada em desenvolvimento.
// Em produção, você precisará definir a URL completa do seu servidor.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001'; // Ajuste a porta se necessário

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // <<--- ESSA É A LINHA MÁGICA!
});

// Removemos todo o 'interceptor' de token, pois não vamos mais usá-lo.

export default api;