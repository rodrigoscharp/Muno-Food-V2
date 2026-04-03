# Deploy — MUNO V2

## Pré-requisitos
- Repositório no GitHub
- Conta no Vercel (vercel.com)
- Projeto Supabase configurado

## Variáveis de ambiente no Vercel

No painel do Vercel → **Settings → Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.ID:SENHA@aws-X.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | `postgresql://postgres.ID:SENHA@aws-X.pooler.supabase.com:5432/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ID.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `NEXTAUTH_SECRET` | resultado de `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://SEU-DOMINIO.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://SEU-DOMINIO.vercel.app` |
| `MERCADOPAGO_ACCESS_TOKEN` | `APP_USR-...` |
| `RESEND_API_KEY` | `re_...` |

## Supabase — habilitar Realtime

No painel do Supabase → **Database → Replication → Tables**:
- Habilite a tabela `Order` para receber eventos em tempo real

## Passos do deploy

```bash
# 1. Push para o GitHub
git push origin main

# 2. Importe no Vercel
# vercel.com → New Project → Import Git Repository

# 3. Configure as variáveis de ambiente acima

# 4. Deploy automático no push
```

## Após o primeiro deploy

Rode o seed em produção uma vez:
```bash
# Via Vercel CLI
npx vercel env pull .env.production.local
DATABASE_URL="..." npm run db:seed
```

Ou via **Supabase SQL Editor**:
- Crie manualmente o usuário admin com senha hasheada

## Webhook do Mercado Pago

Configure a URL do webhook no painel do MP:
```
https://SEU-DOMINIO.vercel.app/api/payments/webhook
```
