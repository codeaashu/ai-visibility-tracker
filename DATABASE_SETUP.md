# 🚀 Final Setup Step: Configure Your Database

## ✅ API Keys Configured!

All your API keys have been successfully added to `.env.local`:
- ✅ Supabase URL
- ✅ Supabase Anon Key
- ✅ Supabase Service Role Key
- ✅ Gemini API Key
- ✅ OpenAI API Key

## 📊 Next Step: Set Up Database Tables

You need to run the SQL schema in your Supabase project to create the database tables.

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/efbdhvrniayvmrxljugc/sql/new
   - Or navigate to your project → SQL Editor → New Query

2. **Copy the SQL Schema**
   - Open the file: `supabase-schema.sql` in your project
   - Select ALL the SQL code (Cmd+A)
   - Copy it (Cmd+C)

3. **Run the Schema**
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" button (or press Cmd+Enter)
   - You should see: "Success. No rows returned"

4. **Verify Tables Created**
   - Go to Table Editor in Supabase
   - You should see 4 tables:
     - `brands`
     - `queries` (with 11 sample queries)
     - `scans`
     - `mentions`

### Option 2: Quick Copy-Paste

Here's the complete SQL to copy:

\`\`\`sql
-- Brands table
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Queries table
CREATE TABLE queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category VARCHAR(100),
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scans table
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES queries(id),
  ai_platform VARCHAR(50) NOT NULL,
  raw_response TEXT,
  executed_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'completed'
);

-- Mentions table
CREATE TABLE mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id),
  brand_id UUID REFERENCES brands(id),
  position INTEGER,
  context TEXT,
  detected_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scans_query_id ON scans(query_id);
CREATE INDEX idx_scans_executed_at ON scans(executed_at);
CREATE INDEX idx_mentions_brand_id ON mentions(brand_id);
CREATE INDEX idx_mentions_scan_id ON mentions(scan_id);

-- Insert sample query templates
INSERT INTO queries (text, category, is_template) VALUES
  ('best CRM for small business', 'CRM', true),
  ('CRM for startups under 10 employees', 'CRM', true),
  ('Salesforce alternatives', 'CRM', true),
  ('project management tools for startups', 'Project Management', true),
  ('Asana alternatives', 'Project Management', true),
  ('email marketing platforms for SaaS', 'Email Marketing', true),
  ('Mailchimp alternatives', 'Email Marketing', true),
  ('Shopify alternatives', 'E-commerce', true),
  ('best e-commerce platforms for small business', 'E-commerce', true),
  ('AI writing tools', 'AI Writing', true),
  ('Grammarly alternatives', 'AI Writing', true);
\`\`\`

---

## 🎉 After Database Setup

Once you've run the SQL schema, your app will be **fully functional**!

### Test Your App

1. **Refresh your browser** at http://localhost:3000

2. **Add a brand:**
   - Click "Brands" in navigation
   - Click "Add Brand"
   - Enter your brand name (e.g., "MyStartup")
   - Add category and website (optional)
   - Click "Add Brand"

3. **Run your first scan:**
   - Click "Scans" in navigation
   - Select a query (e.g., "best CRM for small business")
   - Choose "Gemini (Free)"
   - Click "Run Scan"
   - Wait 5-10 seconds

4. **View results:**
   - Check the Dashboard for visibility metrics
   - Click on a scan to see detailed results
   - See which brands were mentioned!

---

## 🔧 Troubleshooting

### If you see "Failed to fetch brands"
- Make sure you ran the SQL schema in Supabase
- Check that all environment variables are correct
- Restart the dev server: Stop (Ctrl+C) and run `npm run dev` again

### If scans fail
- Verify your Gemini API key is correct
- Check you haven't exceeded rate limits (60 requests/min)
- Look at the browser console for error messages

---

## 📚 What's Next?

- **Track competitors**: Add competitor brands to compare
- **Run weekly scans**: Monitor trends over time
- **Try ChatGPT**: Use your OpenAI key to compare results
- **Export data**: Download scan results for analysis
- **Deploy to Vercel**: Make it live for your team

---

**Need help?** Check the README.md or SETUP.md files in your project!
