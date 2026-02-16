# AiCMO - open-source AI SEO tool (GEO/AIO)

AiCMO is an open-source AI SEO (search optimization) platform that helps companies monitor and optimize their brand visibility in AI tools like ChatGPT, Gemini/Google, Perplexity, Claude, etc. 
Track how often your brand appears in AI responses, analyze competitor performance, and get actionable recommendations to improve your presence in conversational AI search results.

## ✨ Core Features

- **Real-time Brand Monitoring**: Track brand mentions and citations across major AI platforms
- **Competitive Intelligence**: Analyze share of voice and benchmark against competitors
- **Authority Tracking**: Identify which sources AI models cite most frequently in your domain
- **Actionable Insights**: Get AI-powered recommendations to improve brand visibility
- **Multi-Model Support**: Monitor performance across ChatGPT, Gemini, and other AI platforms
- **Self-Hosted Option**: Deploy on your infrastructure with full data control

## 📊 Screenshots

### Dashboard Overview
Monitor your AI visibility score and website citation rate at a glance. Track share of voice metrics to see how your brand compares to competitors across AI-generated responses.

![aicmo-geo-dashboard.png](docs/images/aicmo-geo-dashboard.png)

### Prompt Monitoring
Configure and track custom prompts relevant to your industry. Monitor which AI models (OpenAI, Gemini) mention your brand and track visibility percentages across different query types.

![aicmo-geo-prompts.png](docs/images/aicmo-geo-prompts.png)

### Detailed Analytics
Dive deep into individual prompt performance. See exactly when and where your brand was mentioned, which websites were cited, and track the most authoritative sources in AI responses over time.

![aicmo-geo-prompt-details.png](docs/images/aicmo-geo-prompt-details.png)


## 📦 Deployment

## 🧱 Architecture (important)

- Frontend: Vue 3 + Vite (`frontend/`)
- Backend: FastAPI (Python) (`backend/`)
- Background jobs: Celery tasks
- Database: SQLModel with SQLite (local default) or Postgres (recommended for deploy)

This repository is **not** a Next.js backend.

### AI CMO Cloud

Managed deployment by the AI CMO team, generous free-tier, no credit card required.

[AI CMO Cloud](https://getaicmo.com/)

### Self-hosting

Run AiCMO on your own infrastructure. You will need a Vertex AI credentials (Service Account) file and an OpenAI API key.

1. Clone the repository
   ```bash
   # Clone the repository
   git clone https://github.com/AICMO/ai-cmo.git

   # Navigate to the backend directory
   cd ai-cmo/backend
   ```

2. Copy your Vertex AI credentials (Service Account) file to the root of the backend directory and name it `vertex_credentials.json`.
Backend will not start without this file


3. Create .env.local file in the backend directory and add the following variables:
   ```bash
   echo AC_OPENAI_API_KEY=your_openai_api_key >> .env.local
   ```

4. Run the following command to start the AiCMO:
   ```bash
   docker compose up -d
   ```

5. Open http://localhost:8081 in your browser to access the AiCMO frontend.

## 💸 Free deployment plan (Vercel + Supabase)

If you want to deploy without paying for infra:

- Use **Supabase Postgres** as database (`AC_DB_DSN`)
- Deploy **frontend** as one Vercel project (root: `frontend`)
- Deploy **backend** as another Vercel project (root: `backend`)
- Use backend `inline` task mode (no RabbitMQ/Redis/worker service)

> Note: AI provider usage (OpenAI/Gemini) can still create API costs depending on your own account usage.

### 1) Backend settings for free mode

Set these environment variables in the backend Vercel project:

```bash
AC_DB_DSN=postgresql+psycopg://USER:PASSWORD@HOST:5432/postgres?sslmode=require
AC_OPENAI_API_KEY=your_openai_key
AC_TASK_MODE=inline
AC_FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN.vercel.app
AC_CORS_ORIGINS=https://YOUR_FRONTEND_DOMAIN.vercel.app

# Use OpenAI for generation/crawl prompts (no Vertex credentials required)
AC_SEMI_SMART_PROVIDER=openai
AC_SEMI_SMART_MODEL=gpt-4o-mini
AC_SMART_PROVIDER=openai
AC_SMART_MODEL=gpt-4o
```

Optional cron protection:

```bash
AC_CRON_SECRET=some-long-random-string
CRON_SECRET=some-long-random-string
```

### 2) Database migrations (one-time)

Run once against Supabase DB from your machine:

```bash
cd backend
uv run alembic upgrade head
```

### 3) Frontend settings for deployed backend

Set this env var in the frontend Vercel project:

```bash
AC_API_BASE_URL=https://YOUR_BACKEND_DOMAIN.vercel.app
```

### 4) Prompt monitoring schedule

`backend/vercel.json` already defines a cron job that calls:

- `GET /api/v1/prompts/scheduled/trigger`

If `AC_CRON_SECRET` is set, the endpoint accepts one of:

- `Authorization: Bearer <secret>`
- `X-CRON-SECRET: <secret>`
- `?token=<secret>`

