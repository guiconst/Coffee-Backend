const supabase = require('../supabase');

/**
 * Middleware que valida o Bearer token do Supabase Auth.
 * Injeta req.user com os dados do usuário autenticado.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  req.user = data.user;
  next();
}

module.exports = { requireAuth };
