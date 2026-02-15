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
