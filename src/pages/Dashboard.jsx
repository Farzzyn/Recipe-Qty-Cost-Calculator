import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calculator, Edit, Trash2, Search, Package } from 'lucide-react';
import { mockDb } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { canDeleteRecipe } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    const { data } = await mockDb.getRecipes();
    setRecipes(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await mockDb.deleteRecipe(id);
        fetchRecipes();
      } catch (err) {
        alert(`Failed to delete recipe: ${err.message}`);
      }
    }
  };

  const filteredRecipes = recipes.filter(r => 
    r.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Recipes</h1>
          <p className="text-slate-400">Manage and scale your production formulas</p>
        </div>
        <Link 
          to="/recipe/new" 
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)]"
        >
          <Plus className="w-5 h-5" />
          Add Recipe
        </Link>
      </div>

      <div className="glass-card rounded-2xl p-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search recipes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border-dashed border-slate-700">
          <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">No recipes found</h3>
          <p className="text-slate-500 mb-6">Get started by creating your first master recipe.</p>
          <Link 
            to="/recipe/new" 
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-lg transition-colors border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            Create Recipe
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="glass-card rounded-2xl p-6 group hover:border-purple-500/30 transition-all duration-300 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-100 group-hover:text-purple-400 transition-colors">
                  {recipe.product_name}
                </h3>
                <span className="bg-slate-800 text-purple-400 text-xs font-bold px-2.5 py-1 rounded-md border border-purple-500/20">
                  {recipe.output_quantity} {recipe.output_unit}
                </span>
              </div>
              
              <div className="flex-1">
                <p className="text-slate-400 text-sm mb-6 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Master Recipe
                </p>
              </div>

              <div className="flex gap-2 border-t border-slate-800 pt-4 mt-auto">
                <Link 
                  to={`/recipe/calc/${recipe.id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 py-2 rounded-lg transition-colors font-medium text-sm border border-purple-500/20"
                >
                  <Calculator className="w-4 h-4" />
                  Scale
                </Link>
                <Link 
                  to={`/recipe/edit/${recipe.id}`}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                {canDeleteRecipe() && (
                  <button 
                    onClick={() => handleDelete(recipe.id)}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

