import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient = null;
if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client initialized with URL:', supabaseUrl);

    // Test the connection immediately
    supabaseClient
      .from('recipes')
      .select('id', { count: 'exact', head: true })
      .then(({ error, count }) => {
        if (error) {
          console.error('❌ Supabase connection test FAILED:', error.message);
          console.error('   Hint: Make sure you have run the SQL schema in your Supabase dashboard.');
          console.error('   Hint: Check that your anon key is the correct JWT format (starts with eyJ...)');
        } else {
          console.log(`✅ Supabase connection verified! Found ${count ?? 0} recipes in database.`);
        }
      });
  } catch (e) {
    console.error('❌ Supabase client initialization failed:', e);
  }
} else {
  console.warn('⚠️ Supabase credentials missing. Using local storage fallback.');
  console.warn('  URL:', supabaseUrl ? 'set' : 'MISSING');
  console.warn('  Key:', supabaseAnonKey ? 'set' : 'MISSING');
}

export const supabase = supabaseClient;

// ─── Local Storage Helpers (fallback only) ────────────────────────────────────
const getLocalRecipes = () => {
  try {
    return JSON.parse(localStorage.getItem('recipes') || '[]');
  } catch (e) {
    console.error('Failed to parse local recipes', e);
    return [];
  }
};

const saveLocalRecipes = (recipes) => {
  try {
    localStorage.setItem('recipes', JSON.stringify(recipes));
  } catch (e) {
    console.error('Failed to save local recipes', e);
  }
};

// ─── Database Operations ──────────────────────────────────────────────────────
export const mockDb = {
  getRecipes: async () => {
    if (supabase) {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase getRecipes error:', error.message);
        // Fall back to local
        return { data: getLocalRecipes(), error: null };
      }

      console.log(`📦 Fetched ${data.length} recipes from Supabase`);
      return { data, error: null };
    }

    return { data: getLocalRecipes(), error: null };
  },

  getRecipeById: async (id) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, ingredients(*)')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Supabase getRecipeById error:', error.message);
        const local = getLocalRecipes();
        const recipe = local.find(r => r.id === id);
        return { data: recipe || null, error: recipe ? null : new Error('Recipe not found') };
      }

      return { data, error: null };
    }

    const local = getLocalRecipes();
    const recipe = local.find(r => r.id === id);
    return { data: recipe || null, error: recipe ? null : new Error('Recipe not found') };
  },

  saveRecipe: async (recipeData, ingredients) => {
    const isUpdate = !!recipeData.id;
    const targetId = recipeData.id || crypto.randomUUID();

    if (supabase) {
      // ── Step 1: Save recipe ──
      let recipeResult;
      if (isUpdate) {
        recipeResult = await supabase
          .from('recipes')
          .update({
            product_name: recipeData.product_name,
            output_quantity: parseFloat(recipeData.output_quantity) || 1,
            output_unit: recipeData.output_unit
          })
          .eq('id', targetId)
          .select();
      } else {
        recipeResult = await supabase
          .from('recipes')
          .insert({
            product_name: recipeData.product_name,
            output_quantity: parseFloat(recipeData.output_quantity) || 1,
            output_unit: recipeData.output_unit
          })
          .select();
      }

      if (recipeResult.error) {
        console.error('❌ Supabase saveRecipe error:', recipeResult.error.message);
        throw new Error(`Failed to save recipe to database: ${recipeResult.error.message}`);
      }

      const savedRecipe = recipeResult.data[0];
      const recipeId = savedRecipe.id;
      console.log('✅ Recipe saved to Supabase:', recipeId);

      // ── Step 2: Delete old ingredients if updating ──
      if (isUpdate) {
        const { error: delError } = await supabase
          .from('ingredients')
          .delete()
          .eq('recipe_id', recipeId);
        if (delError) {
          console.error('❌ Failed to delete old ingredients:', delError.message);
          throw new Error(`Failed to update ingredients: ${delError.message}`);
        }
      }

      // ── Step 3: Insert ingredients ──
      const ingredientsToInsert = ingredients.map(ing => ({
        recipe_id: recipeId,
        ingredient_name: ing.ingredient_name,
        quantity: parseFloat(ing.quantity) || 0,
        unit: ing.unit,
        purchase_quantity: ing.purchase_quantity ? parseFloat(ing.purchase_quantity) : null,
        purchase_unit: ing.purchase_unit || ing.unit,
        purchase_price: ing.purchase_price ? parseFloat(ing.purchase_price) : null
      }));

      const { data: savedIngredients, error: ingError } = await supabase
        .from('ingredients')
        .insert(ingredientsToInsert)
        .select();

      if (ingError) {
        console.error('❌ Supabase insert ingredients error:', ingError.message);
        throw new Error(`Failed to save ingredients: ${ingError.message}`);
      }

      console.log(`✅ ${savedIngredients.length} ingredients saved to Supabase`);
      return {
        data: { ...savedRecipe, ingredients: savedIngredients },
        error: null
      };
    }

    // ── Fallback: localStorage ──
    console.warn('⚠️ Saving to localStorage (no Supabase connection)');
    const local = getLocalRecipes();
    const formattedIngredients = ingredients.map(ing => ({
      id: ing.id || crypto.randomUUID(),
      recipe_id: targetId,
      ingredient_name: ing.ingredient_name,
      quantity: parseFloat(ing.quantity) || 0,
      unit: ing.unit,
      purchase_quantity: ing.purchase_quantity ? parseFloat(ing.purchase_quantity) : null,
      purchase_unit: ing.purchase_unit || ing.unit,
      purchase_price: ing.purchase_price ? parseFloat(ing.purchase_price) : null
    }));

    const newRecipe = {
      id: targetId,
      product_name: recipeData.product_name,
      output_quantity: parseFloat(recipeData.output_quantity) || 1,
      output_unit: recipeData.output_unit,
      ingredients: formattedIngredients,
      created_at: new Date().toISOString()
    };

    if (isUpdate) {
      const idx = local.findIndex(r => r.id === targetId);
      if (idx !== -1) {
        local[idx] = newRecipe;
      } else {
        local.push(newRecipe);
      }
    } else {
      local.push(newRecipe);
    }

    saveLocalRecipes(local);
    return { data: newRecipe, error: null };
  },

  deleteRecipe: async (id) => {
    if (supabase) {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Supabase deleteRecipe error:', error.message);
        throw new Error(`Failed to delete recipe: ${error.message}`);
      }

      console.log('✅ Recipe deleted from Supabase:', id);
      return { error: null };
    }

    const local = getLocalRecipes();
    const filtered = local.filter(r => r.id !== id);
    saveLocalRecipes(filtered);
    return { error: null };
  }
};
