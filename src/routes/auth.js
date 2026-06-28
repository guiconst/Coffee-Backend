const express         = require('express');
const supabase        = require('../supabase');
const { requireAuth } = require('../middleware/auth');
const router          = express.Router();

// ── Helpers ───────────────────────────────────────────────

function translateSupabaseError(message = '') {
  if (!message) return 'Erro ao processar a requisição.';
  const m = message.toLowerCase();
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'Este e-mail já está cadastrado. Tente fazer login.';
  }
  if (m.includes('invalid email')) return 'E-mail inválido.';
  if (m.includes('password') && m.includes('characters')) return 'A senha deve ter no mínimo 6 caracteres.';
  if (m.includes('email not confirmed')) return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email rate limit')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (m.includes('signup is disabled')) return 'Cadastro temporariamente desabilitado.';
  return message;
}

/**
 * POST /api/auth/register
 * Body: { email, password, full_name }
 */
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: full_name || '' } },
  });

  if (error) {
    console.error('[register] Supabase error:', error);
    // Traduz mensagens comuns do Supabase para português
    const msg = translateSupabaseError(error.message);
    return res.status(400).json({ error: msg });
  }

  // Supabase retorna identities[] vazio quando o e-mail já está cadastrado
  // mas "confirm email" está ativo — o usuário existe mas não confirmou
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado. Tente fazer login.' });
  }

  // session é null quando e-mail de confirmação foi enviado
  res.status(201).json({
    user: data.user,
    session: data.session,
    emailConfirmationRequired: !data.session,
  });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('[login] Supabase error:', error);
    return res.status(401).json({ error: translateSupabaseError(error.message) });
  }

  res.json({ user: data.user, session: data.session });
});

/**
 * GET /api/auth/me
 * Retorna o perfil do usuário autenticado
 */
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, created_at')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Perfil não encontrado.' });
  res.json({ profile: data });
});

/**
 * PATCH /api/auth/me
 * Atualiza nome e telefone do perfil
 */
router.patch('/me', requireAuth, async (req, res) => {
  const { full_name, phone } = req.body;

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  res.json({ profile: data });
});

// ── Endereços ─────────────────────────────────────────────

/**
 * GET /api/auth/addresses
 */
router.get('/addresses', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', req.user.id)
    .order('is_default', { ascending: false });

  if (error) return res.status(500).json({ error: 'Erro ao buscar endereços.' });
  res.json({ addresses: data });
});

/**
 * POST /api/auth/addresses
 * Body: { label, zip_code, street, number, complement, neighborhood, city, state, is_default }
 */
router.post('/addresses', requireAuth, async (req, res) => {
  const { label, zip_code, street, number, complement, neighborhood, city, state, is_default } = req.body;

  if (!zip_code || !street || !number || !city) {
    return res.status(400).json({ error: 'CEP, rua, número e cidade são obrigatórios.' });
  }

  // Se for default, remove default dos outros
  if (is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', req.user.id);
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({ user_id: req.user.id, label, zip_code, street, number, complement, neighborhood, city, state, is_default: !!is_default })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Erro ao salvar endereço.' });
  res.status(201).json({ address: data });
});

/**
 * DELETE /api/auth/addresses/:id
 */
router.delete('/addresses/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: 'Erro ao remover endereço.' });
  res.json({ message: 'Endereço removido.' });
});

module.exports = router;
