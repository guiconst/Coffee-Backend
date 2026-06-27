# ☕ Constantino Coffee – API (Back-end)

API REST para o site Constantino Coffee. Construída com **Node.js + Express**, banco de dados **Supabase (PostgreSQL)** e deploy na **Vercel**.

---

## 📦 Estrutura

```
constantino-backend/
├── src/
│   ├── index.js              ← Entry point Express
│   ├── supabase.js           ← Cliente Supabase (service role)
│   ├── middleware/
│   │   └── auth.js           ← Valida JWT do Supabase Auth
│   └── routes/
│       ├── products.js       ← GET /api/products, /categories, /:slug
│       ├── orders.js         ← GET/POST /api/orders  (autenticado)
│       ├── auth.js           ← POST /api/auth/register|login, GET /me
│       ├── contact.js        ← POST /api/contact  (público)
│       └── favorites.js      ← GET/POST/DELETE /api/favorites (autenticado)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ← Todas as tabelas + RLS + seed
├── .env.example
├── vercel.json
└── package.json
```

---

## 🗃️ Tabelas no Supabase

| Tabela              | Descrição                                      |
|---------------------|------------------------------------------------|
| `profiles`          | Perfil público (vinculado ao auth.users)       |
| `categories`        | Categorias do cardápio                         |
| `products`          | Produtos com preço, promoção, tags, imagem     |
| `addresses`         | Endereços de entrega do usuário                |
| `orders`            | Pedidos com status e método de pagamento       |
| `order_items`       | Itens de cada pedido (snapshot de nome/preço)  |
| `favorites`         | Produtos favoritos por usuário                 |
| `contact_messages`  | Formulário de contato                          |

---

## 🚀 Configuração Local

### 1. Clone e instale

```bash
git clone https://github.com/SEU_USUARIO/constantino-coffee-api
cd constantino-coffee-api
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env`:

```env
SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Settings → API → service_role
ALLOWED_ORIGINS=http://localhost:5500,http://localhost:3000
PORT=3001
```

### 3. Aplique o schema no Supabase

No [Supabase Dashboard](https://supabase.com/dashboard):
1. Abra seu projeto → **SQL Editor**
2. Cole o conteúdo de `supabase/migrations/001_initial_schema.sql`
3. Clique em **Run**

O script cria todas as tabelas, ativa Row Level Security e insere dados de exemplo.

### 4. Rode localmente

```bash
npm run dev
```

Acesse: `http://localhost:3001/health`

---

## ☁️ Deploy na Vercel

### 1. Importe o repositório

No [Vercel Dashboard](https://vercel.com):
- **Add New Project** → selecione o repositório `constantino-coffee-api`
- Framework Preset: **Other**

### 2. Variáveis de Ambiente

Em **Settings → Environment Variables**, adicione:

| Nome                       | Valor                                  |
|----------------------------|----------------------------------------|
| `SUPABASE_URL`             | `https://xxx.supabase.co`              |
| `SUPABASE_SERVICE_ROLE_KEY`| `eyJ...` (service_role key)            |
| `ALLOWED_ORIGINS`          | URL do seu front-end na Vercel         |

### 3. Deploy

Clique em **Deploy**. A URL gerada será algo como:
`https://constantino-coffee-api.vercel.app`

---

## 📡 Endpoints

### Público
| Método | Rota                        | Descrição                          |
|--------|-----------------------------|------------------------------------|
| GET    | `/health`                   | Health check                       |
| GET    | `/api/products`             | Lista produtos (filtros: category, promotion, tag, q) |
| GET    | `/api/products/categories`  | Lista categorias                   |
| GET    | `/api/products/:slug`       | Detalhe de produto                 |
| POST   | `/api/auth/register`        | Cadastro de usuário                |
| POST   | `/api/auth/login`           | Login                              |
| POST   | `/api/contact`              | Enviar mensagem de contato         |

### Autenticado (Bearer token)
| Método | Rota                        | Descrição                          |
|--------|-----------------------------|------------------------------------|
| GET    | `/api/auth/me`              | Perfil do usuário                  |
| PATCH  | `/api/auth/me`              | Atualizar perfil                   |
| GET    | `/api/auth/addresses`       | Listar endereços                   |
| POST   | `/api/auth/addresses`       | Adicionar endereço                 |
| DELETE | `/api/auth/addresses/:id`   | Remover endereço                   |
| GET    | `/api/orders`               | Listar pedidos do usuário          |
| GET    | `/api/orders/:id`           | Detalhe de pedido                  |
| POST   | `/api/orders`               | Criar pedido                       |
| PATCH  | `/api/orders/:id/cancel`    | Cancelar pedido                    |
| GET    | `/api/favorites`            | Listar favoritos                   |
| POST   | `/api/favorites/:productId` | Favoritar produto                  |
| DELETE | `/api/favorites/:productId` | Remover favorito                   |

---

## 🔐 Segurança

- Row Level Security ativo em todas as tabelas
- Service Role Key **nunca** exposta ao cliente
- CORS restrito às origens configuradas em `ALLOWED_ORIGINS`
- Rate limit: 200 req / 15 min por IP
- Helmet para headers de segurança HTTP
