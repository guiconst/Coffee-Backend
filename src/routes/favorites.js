const express         = require('express');
const supabase        = require('../supabase');
const { requireAuth } = require('../middleware/auth');
const router          = express.Router();

router.use(requireAuth);

/**
 * GET /api/favorites
 * Lista produtos favoritos do usuário
 */
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      product_id, created_at,
      products ( id, name, slug, price, image_url, is_promotion, promo_price )
    `)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: 'Erro ao buscar favoritos.' });
  res.json({ favorites: data.map(f => ({ ...f.products, saved_at: f.created_at })) });
});

/**
 * POST /api/favorites/:productId
 * Adiciona produto aos favoritos
 */
router.post('/:productId', async (req, res) => {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: req.user.id, product_id: req.params.productId })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Produto já está nos favoritos.' });
    return res.status(500).json({ error: 'Erro ao adicionar favorito.' });
  }

  res.status(201).json({ favorite: data });
});

/**
 * DELETE /api/favorites/:productId
 * Remove produto dos favoritos
 */
router.delete('/:productId', async (req, res) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', req.user.id)
    .eq('product_id', req.params.productId);

  if (error) return res.status(500).json({ error: 'Erro ao remover favorito.' });
  res.json({ message: 'Favorito removido.' });
});

module.exports = router;
