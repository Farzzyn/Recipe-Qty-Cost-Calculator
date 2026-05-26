-- Run this script in the Supabase SQL Editor to set up your tables!

-- Create Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    output_quantity NUMERIC NOT NULL,
    output_unit TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Ingredients Table
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    purchase_quantity NUMERIC,
    purchase_unit TEXT,
    purchase_price NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) optionally
-- If you want anyone to access/read/write without auth for simplicity:
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON recipes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON recipes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON recipes FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON ingredients FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON ingredients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON ingredients FOR DELETE USING (true);
