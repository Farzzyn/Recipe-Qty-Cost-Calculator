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
  },

  // ─── Auth & User Management ──────────────────────────────────────────────────
  loginUser: async (username, password) => {
    // Mock implementation using local storage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Master fallback: always allow admin/admin and bootstrap if missing
    if (username === 'admin' && password === 'admin') {
      let adminUser = users.find(u => u.username === 'admin');
      if (!adminUser) {
        adminUser = {
          id: crypto.randomUUID(),
          username: 'admin',
          password: 'admin',
          role: 'Admin',
          can_delete_recipe: true
        };
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
      } else if (adminUser.password === 'admin') {
        // Ensure role is correct if it exists
        adminUser.role = 'Admin';
        localStorage.setItem('users', JSON.stringify(users));
      }
      return { data: adminUser, error: null };
    }
    
    const user = users.find(u => u.username === username && u.password === password); 
    if (user) {
      return { data: user, error: null };
    }
    return { data: null, error: new Error('Invalid username or password') };
  },

  createUser: async (username, password, role, canDeleteRecipe, currentUserId) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const hasAdmins = users.some(u => u.role === 'Admin');
    
    if (hasAdmins) {
      const currentUser = users.find(u => u.id === currentUserId);
      if (!currentUser || currentUser.role !== 'Admin') {
        return { error: new Error('Unauthorized: Only an Admin can create new users.') };
      }
    }

    if (users.find(u => u.username === username)) {
      return { error: new Error('Username already exists') };
    }

    const newUser = {
      id: crypto.randomUUID(),
      username: username,
      password: password, 
      role: role || 'User',
      can_delete_recipe: !!canDeleteRecipe
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return { data: newUser, error: null };
  },

  checkPermission: async (userId, permissionKey) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    
    if (permissionKey === 'CAN_DELETE_RECIPE') {
      return !!user.can_delete_recipe;
    }
    return false;
  },

  getUsers: async (currentUserId) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(u => u.id === currentUserId);
    if (!currentUser || currentUser.role !== 'Admin') {
      return { error: new Error('Unauthorized') };
    }
    const safeUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      can_delete_recipe: u.can_delete_recipe
    }));
    return { data: safeUsers, error: null };
  },

  updateUser: async (targetId, updates, currentUserId) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(u => u.id === currentUserId);
    if (!currentUser || currentUser.role !== 'Admin') {
      return { error: new Error('Unauthorized') };
    }

    const targetIndex = users.findIndex(u => u.id === targetId);
    if (targetIndex === -1) return { error: new Error('User not found') };

    if (targetId === currentUserId && updates.role && updates.role !== currentUser.role) {
      return { error: new Error('Cannot change your own role') };
    }

    users[targetIndex] = { ...users[targetIndex], ...updates };
    localStorage.setItem('users', JSON.stringify(users));
    return { data: users[targetIndex], error: null };
  },

  deleteUser: async (targetId, currentUserId) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(u => u.id === currentUserId);
    if (!currentUser || currentUser.role !== 'Admin') {
      return { error: new Error('Unauthorized') };
    }

    if (targetId === currentUserId) {
      return { error: new Error('Cannot delete your own account') };
    }

    const filtered = users.filter(u => u.id !== targetId);
    localStorage.setItem('users', JSON.stringify(filtered));
    return { error: null };
  }
};
