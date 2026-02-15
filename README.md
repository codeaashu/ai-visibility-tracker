# AI Visibility Tracker

Track how your SaaS product appears in AI recommendations from ChatGPT, Gemini, and other AI assistants.

![AI Visibility Tracker](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)

## 🎯 What is This?

73% of SaaS brands are invisible in AI recommendations. This tool helps you:

- **Track AI Visibility**: See if your product appears when users ask AI tools for recommendations
- **Monitor Trends**: Track visibility over time across multiple AI platforms
- **Compare Competitors**: Understand how you stack up against competitors
- **Identify Opportunities**: Discover which queries mention your brand and which don't

## ✨ Features

### MVP Features
- ✅ Track multiple brands
- ✅ Query Gemini API (free) and ChatGPT
- ✅ Automatic brand mention detection
- ✅ Visibility score calculation
- ✅ Trend analysis and charts
- ✅ Platform breakdown (Gemini, ChatGPT)
- ✅ Scan history
- ✅ Beautiful, modern UI

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **AI APIs**: Google Gemini (free), OpenAI (optional)
- **Charts**: Recharts
- **Deployment**: Vercel (free tier)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account (free)
- Gemini API key (free)
- OpenAI API key (optional)

### 1. Clone and Install

```bash
cd ai-visibility-tracker
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Copy your project URL and API keys from Settings > API

### 3. Get API Keys

**Gemini API (Free)**
1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key"
3. Create a new API key

**OpenAI API (Optional)**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Or let users provide their own keys

### 4. Configure Environment Variables

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=optional_your_openai_api_key
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### Step 1: Add Your Brand

1. Navigate to **Brands** page
2. Click **Add Brand**
3. Enter your brand name (e.g., "MyStartup")
4. Optionally add category and website
5. Click **Add Brand**

### Step 2: Run a Scan

1. Navigate to **Scans** page
2. Select a query from the dropdown (e.g., "best CRM for small business")
3. Choose AI platforms (Gemini is free, ChatGPT requires API key)
4. Click **Run Scan**
5. Wait for results (usually 5-10 seconds)

### Step 3: View Results

1. Check the **Dashboard** for overall visibility metrics
2. View **Scan History** to see individual scan results
3. Click on a scan to see detailed mentions and AI responses

## 🎨 Screenshots

### Dashboard
- Visibility score and metrics
- Trend charts
- Platform breakdown
- Quick actions

### Brands Management
- Add/delete brands
- View brand details
- Category organization

### Scans
- Run new scans
- Select queries and platforms
- View scan history
- Detailed scan results

## 🚢 Deployment

### Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

Your app will be live at `https://your-app.vercel.app`

### Environment Variables in Vercel

Add these in Vercel dashboard under Settings > Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY` (optional)

## 💰 Cost Breakdown

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| **Vercel** | 100GB bandwidth/month | $0 |
| **Supabase** | 500MB database | $0 |
| **Gemini API** | 60 requests/min | $0 |
| **OpenAI API** | Pay-per-use | $0 (user-provided keys) |
| **Total** | | **$0/month** |

## 🔧 Configuration

### Adding Custom Queries

You can add custom queries via the UI or directly in the database:

```sql
INSERT INTO queries (text, category, is_template) VALUES
  ('your custom query here', 'Your Category', true);
```

### Modifying Brand Detection

Edit `lib/brand-detector.ts` to customize how brands are detected in AI responses.

## 📊 API Endpoints

### Brands
- `GET /api/brands` - List all brands
- `POST /api/brands` - Create a brand
- `DELETE /api/brands/:id` - Delete a brand

### Queries
- `GET /api/queries` - List all queries
- `POST /api/queries` - Create custom query

### Scans
- `POST /api/scans/run` - Run a new scan
- `GET /api/scans` - Get scan history
- `GET /api/scans/:id` - Get scan details

### Analytics
- `GET /api/analytics?brand_id=xxx&days=30` - Get analytics data

## 🛠 Development

### Project Structure

```
ai-visibility-tracker/
├── app/
│   ├── api/              # API routes
│   ├── brands/           # Brands page
│   ├── scans/            # Scans pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard
├── lib/
│   ├── ai-clients/       # AI API wrappers
│   ├── supabase.ts       # Database client
│   ├── types.ts          # TypeScript types
│   └── brand-detector.ts # Brand detection logic
├── supabase-schema.sql   # Database schema
└── .env.local.example    # Environment template
```

### Running Tests

```bash
npm run build
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this for your own projects!

## 🙋 FAQ

### Q: Can I use this for free?
**A:** Yes! Using Vercel, Supabase, and Gemini API, you can run this completely free.

### Q: Do I need an OpenAI API key?
**A:** No, Gemini API is free and works great. OpenAI is optional for ChatGPT comparisons.

### Q: How accurate is brand detection?
**A:** The current implementation uses regex and fuzzy matching (~90% accurate). You can improve it with NLP libraries.

### Q: Can I track competitors?
**A:** Yes! Add competitor brands and they'll be tracked in the same scans.

### Q: How often should I run scans?
**A:** Weekly or monthly is usually sufficient to track trends.

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Supabase, and AI APIs
