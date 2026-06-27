const express  = require('express');
const supabase = require('../supabase');
const router   = express.Router();

/**
 * POST /api/contact
 * Body: { name, email, subject, message }
 * Rota pública – não exige login
 */
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nome, email e mensagem são obrigatórios.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido.' });
  }

  const { data, error } = await supabase
    .from('contact_messages')
    .insert({ name, email, subject: subject || null, message })
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }

  res.status(201).json({ message: 'Mensagem recebida com sucesso!', id: data.id });
});

module.exports = router;
