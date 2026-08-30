const axios = require('axios');
const client = axios.create({ baseURL: '/api/v1' });
console.log(client.getUri({ url: '/auth/login' }));
console.log(client.getUri({ url: 'auth/login' }));
