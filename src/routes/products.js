const express  = require('express');
const supabase = require('../supabase');
const router   = express.Router();

/**
 * GET /api/products
 * Query params:
 *   category  → slug da categoria  (ex: cafes-especiais)
 *   promotion → "true" filtra só promoções
 *   tag       → filtra por tag     (ex: destaque)
 *   q         → busca no nome/descrição
 */
const PRODUCT_FIELDS = `
  id, name, slug, description, long_description, price, image_url,
  is_available, is_promotion, promo_price, tags, sizes, extras, category_id,
  categories ( id, name, slug )
`;

router.get('/', async (req, res) => {
  try {
    const { category, promotion, tag, q } = req.query;

    let query = supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .eq('is_available', true)
      .order('name');

    if (category) {
      // Join via categories.slug
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();
      if (cat) query = query.eq('category_id', cat.id);
    }

    if (promotion === 'true') {
      query = query.eq('is_promotion', true);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ products: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

/**
 * GET /api/products/categories
 */
router.get('/categories', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, sort_order')
      .order('sort_order');
    if (error) throw error;
    res.json({ categories: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});

/**
 * GET /api/products/id/:id
 * Detalhes de um produto pelo UUID
 */
router.get('/id/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json({ product: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produto.' });
  }
});

/**
 * GET /api/products/:slug
 * Detalhes de um produto pelo slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .eq('slug', req.params.slug)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json({ product: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produto.' });
  }
});

module.exports = router;
