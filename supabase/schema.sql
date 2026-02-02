-- DYMNDS OS Database Schema
-- Supabase SQL for Admin Backend

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  price NUMERIC(10, 2) NOT NULL,
  stock JSONB DEFAULT '{"XS": 0, "S": 0, "M": 0, "L": 0, "XL": 0, "XXL": 0}',
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  category TEXT DEFAULT 'Men',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- APP WAITLIST TABLE
-- ============================================
CREATE TABLE app_waitlist (
  email TEXT PRIMARY KEY,
  signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  items JSONB NOT NULL,
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMPUTED COLUMN: impact_generated
-- ============================================
-- Note: Supabase doesn't support true computed columns like Postgres
-- We'll use a view or function instead, or calculate in app
-- For now, we'll calculate on the fly in queries

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_app_waitlist_signed_up ON app_waitlist(signed_up_at);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active products
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true);

-- Only authenticated admins can manage products
CREATE POLICY "Admins can manage products" ON products
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users));

-- Only authenticated admins can view/manage orders
CREATE POLICY "Admins can view orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users));

CREATE POLICY "Admins can manage orders" ON orders
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users));

-- Public can add to waitlist
CREATE POLICY "Public can add to waitlist" ON app_waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view waitlist
CREATE POLICY "Admins can view waitlist" ON app_waitlist
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users));

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO products (slug, title, subtitle, price, stock, images, category) VALUES
('heavy-hoodie', 'Heavy Hoodie', 'Warmth without weight. Your post-workout recovery layer.', 149.00, '{"XS": 0, "S": 5, "M": 10, "L": 8, "XL": 3, "XXL": 0}', ARRAY['hoodie-1.jpg', 'hoodie-2.jpg'], 'Men'),
('compression-tee', 'Compression Tee', 'Your base layer for every battle. Sweat-wicking, 4-way stretch.', 89.00, '{"XS": 10, "S": 15, "M": 20, "L": 15, "XL": 10, "XXL": 5}', ARRAY['tee-1.jpg', 'tee-2.jpg'], 'Men'),
('neural-joggers', 'Neural Joggers', 'Tapered fit, maximum comfort. From gym to street.', 119.00, '{"XS": 5, "S": 8, "M": 0, "L": 12, "XL": 6, "XXL": 2}', ARRAY['joggers-1.jpg', 'joggers-2.jpg'], 'Men'),
('performance-shorts', 'Performance Shorts', 'Built for leg day. Freedom of motion when it matters most.', 75.00, '{"XS": 3, "S": 5, "M": 8, "L": 10, "XL": 7, "XXL": 4}', ARRAY['shorts-1.jpg', 'shorts-2.jpg'], 'Men');

-- Seed sample orders
INSERT INTO orders (customer_email, customer_name, total_amount, status, items) VALUES
('john@example.com', 'John Smith', 238.00, 'pending', '[{"product_id": "heavy-hoodie", "name": "Heavy Hoodie", "price": 149, "quantity": 1, "size": "L"}, {"product_id": "compression-tee", "name": "Compression Tee", "price": 89, "quantity": 1, "size": "M"}]'::jsonb),
('sarah@example.com', 'Sarah Johnson', 119.00, 'shipped', '[{"product_id": "neural-joggers", "name": "Neural Joggers", "price": 119, "quantity": 1, "size": "S"}]'::jsonb),
('mike@example.com', 'Mike Davis', 357.00, 'delivered', '[{"product_id": "heavy-hoodie", "name": "Heavy Hoodie", "price": 149, "quantity": 2, "size": "XL"}, {"product_id": "performance-shorts", "name": "Performance Shorts", "price": 75, "quantity": 1, "size": "M"}]'::jsonb);

-- Seed sample waitlist
INSERT INTO app_waitlist (email, signed_up_at) VALUES
('user1@example.com', NOW() - INTERVAL '2 days'),
('user2@example.com', NOW() - INTERVAL '1 day'),
('user3@example.com', NOW() - INTERVAL '5 hours'),
('user4@example.com', NOW() - INTERVAL '30 minutes');

-- ============================================
-- FUNCTION TO UPDATE TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
