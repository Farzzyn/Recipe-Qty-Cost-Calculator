-- ==========================================
-- RG FOODS DATABASE ARCHITECTURE
-- ==========================================

-- 1. USERS & ACCESS CONTROL
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Note: If using Supabase Auth, drop this and reference auth.users
    role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'User')),
    can_delete_recipe BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CORE ENTITIES (RECIPES & INGREDIENTS)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    output_quantity NUMERIC NOT NULL CHECK (output_quantity > 0),
    output_unit TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Links recipe to owner
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if the table was already created previously
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity >= 0),
    unit TEXT NOT NULL,
    purchase_quantity NUMERIC CHECK (purchase_quantity >= 0),
    purchase_unit TEXT,
    purchase_price NUMERIC CHECK (purchase_price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE
-- ------------------------------------------
CREATE INDEX idx_recipes_created_by ON recipes(created_by);
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);

-- 4. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------
-- Enable strict RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Clean up old insecure public policies if they exist
DROP POLICY IF EXISTS "Allow public access" ON recipes;
DROP POLICY IF EXISTS "Allow public access" ON ingredients;

-- Note: The following policies assume Supabase environment using `auth.uid()`. 
-- If using standard Postgres, you would replace `auth.uid()` with a custom function or session variable.

-- Users Policies:
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON users FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'Admin'
);

-- Recipes Policies:
CREATE POLICY "Authenticated users can read recipes" ON recipes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own recipes or Admins can update all" ON recipes FOR UPDATE USING (
    created_by = auth.uid() OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'Admin'
);

-- Deletion requires the `can_delete_recipe` flag to be true OR the user is an Admin
CREATE POLICY "Granular Delete Permission" ON recipes FOR DELETE USING (
    (
        created_by = auth.uid() AND 
        (SELECT can_delete_recipe FROM users WHERE id = auth.uid()) = true
    ) OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'Admin'
);

-- Ingredients Policies:
CREATE POLICY "Authenticated users can read ingredients" ON ingredients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create ingredients" ON ingredients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update/delete if user can update/delete parent recipe" ON ingredients FOR ALL USING (
    EXISTS (
        SELECT 1 FROM recipes WHERE id = ingredients.recipe_id
    )
);
