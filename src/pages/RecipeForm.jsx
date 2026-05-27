import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { mockDb } from '../services/supabase';

const UNITS = ['kg', 'g', 'L', 'ml', 'tsp', 'tbsp', 'cup', 'pcs'];

export default function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  
  const [recipe, setRecipe] = useState({
    product_name: '',
    output_quantity: '',
    output_unit: 'kg'
  });

  const [ingredients, setIngredients] = useState([
    { id: crypto.randomUUID(), ingredient_name: '', quantity: '', unit: 'kg', purchase_quantity: '', purchase_unit: 'kg', purchase_price: '' }
  ]);

  useEffect(() => {
    if (isEditing) {
      loadRecipe();
    }
  }, [id]);

  const loadRecipe = async () => {
    const { data } = await mockDb.getRecipeById(id);
    if (data) {
      setRecipe({
        product_name: data.product_name,
        output_quantity: data.output_quantity,
        output_unit: data.output_unit
      });
      if (data.ingredients && data.ingredients.length > 0) {
        setIngredients(data.ingredients);
      }
    }
    setFetching(false);
  };

  const handleRecipeChange = (e) => {
    setRecipe({ ...recipe, [e.target.name]: e.target.value });
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: crypto.randomUUID(), ingredient_name: '', quantity: '', unit: 'kg', purchase_quantity: '', purchase_unit: 'kg', purchase_price: '' }
    ]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      const newIngredients = [...ingredients];
      newIngredients.splice(index, 1);
      setIngredients(newIngredients);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // basic validation
    if (!recipe.product_name || !recipe.output_quantity) {
      alert("Please fill in the product name and output quantity.");
      setLoading(false);
      return;
    }

    const recipeData = {
      ...recipe,
      ...(isEditing ? { id } : {})
    };

    try {
      await mockDb.saveRecipe(recipeData, ingredients);
      navigate('/');
    } catch (err) {
      alert(`Failed to save recipe: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-slate-400">Loading recipe...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-36">
      <form onSubmit={handleSubmit}>
        <div className="animate-fade-in space-y-8">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 glass rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {isEditing ? 'Edit Recipe' : 'Create Master Recipe'}
              </h1>
              <p className="text-slate-400">Define your product and exact ingredient formulation.</p>
            </div>
          </div>

          {/* Recipe Details */}
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-semibold text-orange-400 mb-6 flex items-center gap-2">
              <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
              Product Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-400 mb-2">Product Name *</label>
                <input 
                  type="text" 
                  name="product_name"
                  required
                  value={recipe.product_name}
                  onChange={handleRecipeChange}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="e.g. Ribbon Pakkavada"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Master Output Qty *</label>
                <input 
                  type="number" 
                  name="output_quantity"
                  step="any"
                  required
                  value={recipe.output_quantity}
                  onChange={handleRecipeChange}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="e.g. 13.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Unit</label>
                <select 
                  name="output_unit"
                  value={recipe.output_unit}
                  onChange={handleRecipeChange}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                >
                  {UNITS.map(u => <option key={u} value={u} className="bg-slate-900 text-slate-100">{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="glass-card rounded-2xl p-6 md:p-8 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-orange-400 flex items-center gap-2">
                <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                Ingredients Formulation
              </h2>
              <button 
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition-colors border border-orange-500/20"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
            
            <div className="overflow-x-auto -mx-6 md:mx-0">
              <div className="min-w-[800px] px-6 md:px-0">
                <div className="grid grid-cols-12 gap-3 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                  <div className="col-span-3">Ingredient Name</div>
                  <div className="col-span-2">Recipe Qty & Unit</div>
                  <div className="col-span-3">Purchase Qty & Unit</div>
                  <div className="col-span-3">Purchase Price (₹)</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                <div className="space-y-3">
                  {ingredients.map((ing, index) => (
                    <div key={ing.id || index} className="grid grid-cols-12 gap-3 items-center bg-slate-900/30 p-2 rounded-xl border border-slate-800/50">
                      <div className="col-span-3">
                        <input 
                          type="text" 
                          required
                          value={ing.ingredient_name}
                          onChange={(e) => handleIngredientChange(index, 'ingredient_name', e.target.value)}
                          placeholder="Ingredient Name"
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-3 text-slate-100 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                      
                      <div className="col-span-2 flex gap-1">
                        <input 
                          type="number" 
                          step="any"
                          required
                          value={ing.quantity}
                          onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-full min-w-0 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-2 text-slate-100 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <select 
                          value={ing.unit}
                          onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                          className="w-16 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-1 text-slate-100 text-xs focus:outline-none focus:border-orange-500"
                        >
                          {UNITS.map(u => <option key={u} value={u} className="bg-slate-900 text-slate-100">{u}</option>)}
                        </select>
                      </div>

                      <div className="col-span-3 flex gap-1">
                        <input 
                          type="number" 
                          step="any"
                          value={ing.purchase_quantity}
                          onChange={(e) => handleIngredientChange(index, 'purchase_quantity', e.target.value)}
                          placeholder="Quantity"
                          className="w-full min-w-0 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-2 text-slate-100 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <select 
                          value={ing.purchase_unit}
                          onChange={(e) => handleIngredientChange(index, 'purchase_unit', e.target.value)}
                          className="w-16 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-1 text-slate-100 text-xs focus:outline-none focus:border-orange-500"
                        >
                          {UNITS.map(u => <option key={u} value={u} className="bg-slate-900 text-slate-100">{u}</option>)}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input 
                          type="number" 
                          step="any"
                          value={ing.purchase_price}
                          onChange={(e) => handleIngredientChange(index, 'purchase_price', e.target.value)}
                          placeholder="Total Price"
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-3 text-slate-100 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <button 
                          type="button"
                          onClick={() => removeIngredient(index)}
                          disabled={ingredients.length === 1}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl text-sm text-slate-400">
              <span className="text-orange-400 font-medium">Tip:</span> If you don't need cost tracking for an ingredient, leave the purchase quantity and price fields blank.
            </div>
          </div>
        </div>

        {/* Action Bar (Outside animate-fade-in to prevent fixed positioning contained block issue) */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 flex justify-end z-20">
          <div className="flex gap-4 max-w-5xl w-full mx-auto justify-end">
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-semibold text-slate-950 bg-orange-500 hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(230,81,0,0.3)] disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Recipe
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
