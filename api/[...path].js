// Vercel maps this catch-all to every /api/* request. Matching on the
// filesystem rather than a rewrite means the original URL (/api/donors,
// /api/health) reaches Express untouched, so its router works normally.
module.exports = require('../server.js');
