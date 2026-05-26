import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient = null;
if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn('Supabase client initialization failed. Falling back to local storage.', e);
  }
}

export const supabase = supabaseClient;

// Local Storage Helpers
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

export const mockDb = {
  getRecipes: async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return { data, error: null };
        }
        console.warn('Supabase getRecipes failed, falling back to local storage:', error);
      } catch (e) {
        console.warn('Supabase getRecipes exception, falling back to local storage:', e);
      }
    }
    const local = getLocalRecipes();
    return { data: local, error: null };
  },

  getRecipeById: async (id) => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*, ingredients(*)')
          .eq('id', id)
          .single();
        if (!error && data) {
          return { data, error: null };
        }
        console.warn('Supabase getRecipeById failed, falling back to local storage:', error);
      } catch (e) {
        console.warn('Supabase getRecipeById exception, falling back to local storage:', e);
      }
    }
    const local = getLocalRecipes();
    const recipe = local.find(r => r.id === id);
    return { data: recipe || null, error: recipe ? null : new Error('Recipe not found') };
  },

  saveRecipe: async (recipeData, ingredients) => {
    const isUpdate = !!recipeData.id;
    const targetId = recipeData.id || crypto.randomUUID();

    if (supabase) {
      try {
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
          throw recipeResult.error;
        }

        const savedRecipe = recipeResult.data[0];
        const recipeId = savedRecipe.id;

        if (isUpdate) {
          const { error: delError } = await supabase
            .from('ingredients')
            .delete()
            .eq('recipe_id', recipeId);
          if (delError) throw delError;
        }

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

        if (ingError) throw ingError;

        return { 
          data: { ...savedRecipe, ingredients: savedIngredients }, 
          error: null 
        };
      } catch (e) {
        console.warn('Supabase saveRecipe failed, falling back to local storage:', e);
      }
    }

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
      try {
        const { error } = await supabase
          .from('recipes')
          .delete()
          .eq('id', id);
        if (!error) {
          return { error: null };
        }
        console.warn('Supabase deleteRecipe failed, falling back to local storage:', error);
      } catch (e) {
        console.warn('Supabase deleteRecipe exception, falling back to local storage:', e);
      }
    }
    const local = getLocalRecipes();
    const filtered = local.filter(r => r.id !== id);
    saveLocalRecipes(filtered);
    return { error: null };
  }
};

