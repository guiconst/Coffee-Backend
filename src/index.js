require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');

const productsRouter  = require('./routes/products');
const ordersRouter    = require('./routes/orders');
const authRouter      = require('./routes/auth');
const contactRouter   = require('./routes/contact');
const favoritesRouter = require('./routes/favorites');

const app = express();

// ── Trust proxy (necessário na Vercel) ───────────────────
app.set('trust proxy', 1);

// ── Segurança básica ──────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));

// ── CORS ─────────────────────────────────────────────────
// Se ALLOWED_ORIGINS não estiver definido, libera qualquer origem *.vercel.app
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Sem origin = Postman / curl / SSR → ok
    if (!origin) return cb(null, true);
    // Origem explicitamente autorizada → ok
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Fallback: qualquer subdomínio vercel.app em desenvolvimento → ok
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} não autorizada`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Rate limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Rotas ─────────────────────────────────────────────────
app.use('/api/products',  productsRouter);
app.use('/api/orders',    ordersRouter);
app.use('/api/auth',      authRouter);
app.use('/api/contact',   contactRouter);
app.use('/api/favorites', favoritesRouter);

// ── 404 ───────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// ── Error handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Constantino API rodando na porta ${PORT}`));
