# 🚀 Quick Setup Guide

Follow these steps to get your AI Visibility Tracker running in 30 minutes!

## ✅ Prerequisites Checklist

Before you start, make sure you have:
- [ ] Node.js 18+ installed
- [ ] A Supabase account (free)
- [ ] A Gemini API key (free)
- [ ] (Optional) An OpenAI API key

---

## Step 1: Set Up Supabase (10 minutes)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up or log in
4. Click "New Project"
5. Choose organization and enter:
   - **Name**: `ai-visibility-tracker`
   - **Database Password**: (create a strong password)
   - **Region**: (choose closest to you)
6. Click "Create new project"
7. Wait 2-3 minutes for setup

### 1.2 Run Database Schema
1. In your Supabase project, click "SQL Editor" in the left sidebar
2. Click "New query"
3. Open the file `supabase-schema.sql` in your project
4. Copy ALL the SQL code
5. Paste it into the Supabase SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

### 1.3 Get API Keys
1. Click "Settings" (gear icon) in the left sidebar
2. Click "API" under Project Settings
3. Copy these values (you'll need them later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (different long string)

---

## Step 2: Get Gemini API Key (5 minutes)

### 2.1 Create Gemini API Key
1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key" in the top right
3. Sign in with your Google account
4. Click "Create API Key"
5. Select "Create API key in new project"
6. Copy the API key (starts with `AIza...`)

> ⚠️ **Important**: Keep this key safe! Don't share it publicly.

---

## Step 3: Configure Environment Variables (2 minutes)

### 3.1 Create .env.local File
```bash
cd /Users/mac/.gemini/antigravity/scratch/ai-visibility-tracker
cp .env.local.example .env.local
```

### 3.2 Edit .env.local
Open `.env.local` in your text editor and replace the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-key...
GEMINI_API_KEY=AIza...your-gemini-key...
OPENAI_API_KEY=sk-...optional...
```

**Where to find these:**
- `NEXT_PUBLIC_SUPABASE_URL`: From Supabase Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From Supabase Settings > API > anon public
- `SUPABASE_SERVICE_KEY`: From Supabase Settings > API > service_role (click "Reveal")
- `GEMINI_API_KEY`: From ai.google.dev
- `OPENAI_API_KEY`: Optional, from platform.openai.com

---

## Step 4: Run Locally (2 minutes)

### 4.1 Start Development Server
```bash
cd /Users/mac/.gemini/antigravity/scratch/ai-visibility-tracker
npm run dev
```

### 4.2 Open in Browser
1. Open [http://localhost:3000](http://localhost:3000)
2. You should see the AI Visibility Tracker dashboard!

---

## Step 5: Test the Application (5 minutes)

### 5.1 Add Your First Brand
1. Click "Brands" in the navigation
2. Click "Add Brand"
3. Enter:
   - **Name**: Your product name (e.g., "MyStartup")
   - **Category**: Your category (e.g., "CRM")
   - **Website**: Your website (optional)
4. Click "Add Brand"

### 5.2 Run Your First Scan
1. Click "Scans" in the navigation
2. Under "Run New Scan":
   - **Select Query**: Choose "best CRM for small business" (or relevant to your category)
   - **Select AI Platforms**: Check "Gemini (Free)"
3. Click "Run Scan"
4. Wait 5-10 seconds for results
5. You should see "Scan completed!" message

### 5.3 View Results
1. Click on the scan in "Scan History"
2. You'll see:
   - Which brands were mentioned
   - Position in the recommendation list
   - Context snippets
   - Full AI response

### 5.4 Check Dashboard
1. Click "Dashboard" in the navigation
2. You should see:
   - Visibility score
   - Total mentions
   - Trend chart
   - Platform breakdown

---

## Step 6: Deploy to Vercel (10 minutes)

### 6.1 Push to GitHub
```bash
cd /Users/mac/.gemini/antigravity/scratch/ai-visibility-tracker
git init
git add .
git commit -m "Initial commit: AI Visibility Tracker"

# Create GitHub repo (if you have GitHub CLI)
gh repo create ai-visibility-tracker --public --source=. --push

# Or manually:
# 1. Go to github.com
# 2. Click "New repository"
# 3. Name it "ai-visibility-tracker"
# 4. Copy the commands to push existing repository
```

### 6.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in (use GitHub account)
3. Click "Add New..." > "Project"
4. Import your `ai-visibility-tracker` repository
5. Click "Deploy"

### 6.3 Add Environment Variables
1. After deployment, go to your project dashboard
2. Click "Settings" > "Environment Variables"
3. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY` (optional)
4. For each variable:
   - Enter the name
   - Paste the value
   - Select all environments (Production, Preview, Development)
   - Click "Save"

### 6.4 Redeploy
1. Go to "Deployments" tab
2. Click "..." on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

### 6.5 Visit Your Live App
1. Click "Visit" button
2. Your app is now live at `https://your-app.vercel.app`!

---

## 🎉 You're Done!

Your AI Visibility Tracker is now:
- ✅ Running locally at `http://localhost:3000`
- ✅ Deployed to production at `https://your-app.vercel.app`
- ✅ Connected to Supabase database
- ✅ Integrated with Gemini API
- ✅ Ready to track your AI visibility!

---

## 🔍 Troubleshooting

### "Failed to fetch brands"
- Check that Supabase URL and keys are correct in `.env.local`
- Verify database schema was created successfully

### "Failed to query Gemini API"
- Check that `GEMINI_API_KEY` is correct
- Verify you haven't exceeded rate limits (60 requests/minute)

### Charts not showing
- Run at least one scan first
- Check that scans completed successfully

### Deployment issues
- Make sure all environment variables are set in Vercel
- Check deployment logs for errors
- Redeploy after adding environment variables

---

## 📚 Next Steps

### Learn More
- Read the [README.md](file:///Users/mac/.gemini/antigravity/scratch/ai-visibility-tracker/README.md) for detailed documentation
- Check the [walkthrough.md](file:///Users/mac/.gemini/antigravity/brain/19e03ecb-1379-4c72-8bae-200c196f143e/walkthrough.md) for technical details

### Customize
- Add more query templates in Supabase
- Modify brand detection logic in `lib/brand-detector.ts`
- Customize UI colors in component files

### Share
- Share your live URL with team members
- Track competitors by adding their brands
- Run weekly scans to monitor trends

---

## 💡 Tips

1. **Run scans weekly** to track trends over time
2. **Add competitors** to see how you compare
3. **Use Gemini only** to stay 100% free
4. **Create custom queries** for your specific use case
5. **Check scan details** to understand context of mentions

---

**Need help?** Check the README or open an issue on GitHub.

**Happy tracking! 🚀**
