# Vercel free deployment env (copy/paste)

This project should be deployed as **2 Vercel projects**:

- Frontend project root: `frontend`
- Backend project root: `backend`

Use Supabase Postgres for DB and `inline` task mode (no RabbitMQ / Redis / Celery workers).

## 1) Backend project env vars (Vercel)

Set these in **Backend Vercel Project → Settings → Environment Variables**.

```bash
AC_DB_DSN=postgresql+psycopg://<SUPABASE_USER>:<SUPABASE_PASSWORD>@<SUPABASE_HOST>:5432/postgres?sslmode=require
AC_OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>

# Required for free infra mode
AC_TASK_MODE=inline

# Replace after frontend deploy
AC_FRONTEND_URL=https://<FRONTEND_DOMAIN>.vercel.app
AC_CORS_ORIGINS=https://<FRONTEND_DOMAIN>.vercel.app

# Keep CE routing
AC_LICENSE_TYPE=ce

# Avoid Vertex requirement
AC_SEMI_SMART_PROVIDER=openai
AC_SEMI_SMART_MODEL=gpt-4o-mini
AC_SMART_PROVIDER=openai
AC_SMART_MODEL=gpt-4o-mini
```

Notes:

- Leave `AC_CRON_SECRET` empty if you use built-in Vercel cron from `backend/vercel.json`.
- If you want strict cron auth later, use external cron service and send token/header.

## 2) Frontend project env vars (Vercel)

Set these in **Frontend Vercel Project → Settings → Environment Variables**.

```bash
# Replace after backend deploy
AC_API_BASE_URL=https://<BACKEND_DOMAIN>.vercel.app

# Keep CE alias resolution
AC_LICENSE_TYPE=ce
```

## 3) One-time DB migration (local machine)

Run once against Supabase DB:

```bash
cd backend
export AC_DB_DSN='postgresql+psycopg://<SUPABASE_USER>:<SUPABASE_PASSWORD>@<SUPABASE_HOST>:5432/postgres?sslmode=require'
python3 -m pip install -r requirements.txt
python3 -m alembic upgrade head
```

## 4) Build settings in Vercel

### Backend project

- Root Directory: `backend`
- Framework: Other
- Build Command: leave default
- Output Directory: leave empty

### Frontend project

- Root Directory: `frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## 5) Replace placeholders after first deploy

After both projects are deployed, replace:

- `<FRONTEND_DOMAIN>` with your frontend Vercel domain
- `<BACKEND_DOMAIN>` with your backend Vercel domain

Then redeploy both projects once.
