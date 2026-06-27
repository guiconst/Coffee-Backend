const express         = require('express');
const supabase        = require('../supabase');
const { requireAuth } = require('../middleware/auth');
const router          = express.Router();

// Todas as rotas de pedido exigem autenticação
router.use(requireAuth);

/**
 * GET /api/orders
 * Lista os pedidos do usuário autenticado (mais recentes primeiro)
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, status, payment_method, subtotal, delivery_fee, total,
        notes, created_at,
        order_items ( id, name, price, quantity, subtotal ),
        addresses ( street, number, complement, neighborhood, city, state )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ orders: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar pedidos.' });
  }
});

/**
 * GET /api/orders/:id
 * Detalhe de um pedido do usuário
 */
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, status, payment_method, subtotal, delivery_fee, total,
        notes, created_at, updated_at,
        order_items ( id, name, price, quantity, subtotal ),
        addresses ( street, number, complement, neighborhood, city, state, zip_code )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Pedido não encontrado.' });
    res.json({ order: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar pedido.' });
  }
});

/**
 * POST /api/orders
 * Cria um novo pedido
 * Body: { address_id, payment_method, notes, items: [{ product_id, name, price, quantity }] }
 */
router.post('/', async (req, res) => {
  const { address_id, payment_method = 'credit_card', notes, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Pedido sem itens.' });
  }

  // Calcula subtotal a partir dos itens enviados
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery_fee = 0; // grátis por enquanto
  const total = subtotal + delivery_fee;

  try {
    // Cria o pedido
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: req.user.id,
        address_id: address_id || null,
        payment_method,
        notes: notes || null,
        subtotal,
        delivery_fee,
        total,
        status: 'pending',
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insere os itens
    const orderItems = items.map(i => ({
      order_id:   order.id,
      product_id: i.product_id || null,
      name:       i.name,
      price:      i.price,
      quantity:   i.quantity,
      subtotal:   i.price * i.quantity,
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsErr) throw itemsErr;

    res.status(201).json({ order: { ...order, order_items: orderItems } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar pedido.' });
  }
});

/**
 * PATCH /api/orders/:id/cancel
 * Cancela um pedido (apenas se estiver "pending")
 */
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, user_id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Apenas pedidos pendentes podem ser cancelados.' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ order: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cancelar pedido.' });
  }
});

module.exports = router;
