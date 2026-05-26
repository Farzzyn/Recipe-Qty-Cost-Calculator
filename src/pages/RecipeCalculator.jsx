import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, Receipt, IndianRupee, Download, Printer } from 'lucide-react';
import { mockDb } from '../services/supabase';
import { calculateScaledQuantity, calculateIngredientCost, calculateTotalBatchCost, formatScaledQuantityWithUnit } from '../services/calculator';

export default function RecipeCalculator() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [requiredOutput, setRequiredOutput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    const { data } = await mockDb.getRecipeById(id);
    if (data) {
      setRecipe({
        product_name: data.product_name,
        output_quantity: data.output_quantity,
        output_unit: data.output_unit
      });
      setIngredients(data.ingredients || []);
      setRequiredOutput(data.output_quantity);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-slate-400">Loading calculator...</div>;
  if (!recipe) return <div className="p-8 text-red-400">Recipe not found.</div>;

  // Export Functions
  const handlePrint = () => {
    // Use a simple print of the page; we could open a new window with minimal styles if needed
    window.print();
  };

  const exportToText = () => {
    const lines = [];
    lines.push(`Recipe: ${recipe.product_name}`);
    lines.push(`Master Output: ${recipe.output_quantity} ${recipe.output_unit}`);
    lines.push(`Target Output: ${targetOutput || 0} ${recipe.output_unit}`);
    lines.push('');
    lines.push('Ingredients');
    lines.push('Name\tOriginal Qty\tScaled Qty\tUnit\tEst. Cost (₹)');
    calculatedIngredients.forEach(ing => {
      const cost = ing.calculatedCost > 0 ? ing.calculatedCost.toFixed(2) : '0.00';
      lines.push(`${ing.ingredient_name}\t${formatNumber(ing.quantity)}\t${formatNumber(ing.displayScaledQty)}\t${ing.displayUnit}\t${cost}`);
    });
    lines.push('');
    lines.push(`Total Batch Cost: ₹${totalCost.toFixed(2)}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${recipe.product_name}_scaled_${targetOutput}_${recipe.output_unit}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- UI changes: Export button group ---
  // Insert after the Cost Summary Card (line ~112)
  // We'll modify the JSX to include a new div with three buttons: Print, Export CSV, Export Text
  // Also adjust layout for proper alignment
  const targetOutput = Math.max(0, parseFloat(requiredOutput) || 0);

  const calculatedIngredients = ingredients.map(ing => {
    const scaledQty = calculateScaledQuantity(ing.quantity, recipe.output_quantity, targetOutput);
    const cost = calculateIngredientCost(scaledQty, ing.purchase_quantity, ing.purchase_price, ing.unit, ing.purchase_unit);
    
    const formatted = formatScaledQuantityWithUnit(scaledQty, ing.unit);
    
    return {
      ...ing,
      scaledQty,
      displayScaledQty: formatted.value,
      displayUnit: formatted.unit,
      calculatedCost: cost
    };
  });

  const totalCost = calculateTotalBatchCost(calculatedIngredients);
  
  const exportToCSV = () => {
    const headers = ['Ingredient Name', 'Original Qty', 'Scaled Qty', 'Unit', 'Estimated Cost (INR)'];
    const rows = calculatedIngredients.map(ing => [
      ing.ingredient_name,
      formatNumber(ing.quantity),
      formatNumber(ing.displayScaledQty),
      ing.displayUnit,
      ing.calculatedCost > 0 ? ing.calculatedCost.toFixed(2) : '0.00'
    ]);
    
    // Create CSV content
    const csvContent = "\uFEFF" // UTF-8 BOM for Excel compatibility
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${recipe.product_name}_scaled_${targetOutput}_${recipe.output_unit}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Safe formatting
  const formatNumber = (val) => {
    const num = parseFloat(val);
    if (num === 0) return '0';
    if (isNaN(num)) return '-';
    // Round to 3 decimal places max if necessary
    return Number.isInteger(num) ? num : parseFloat(num.toFixed(3));
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) return '₹0.00';
    return `₹${num.toFixed(2)}`;
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 glass rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Scale Recipe: {recipe.product_name}</h1>
          <p className="text-slate-400">Calculate exact requirements and costs for a specific batch size.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Input Card */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-1 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-white">Target Output</h2>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-slate-400 mb-1">Master Recipe Yield</p>
            <p className="text-lg font-medium text-slate-200">
              {recipe.output_quantity} {recipe.output_unit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-400 mb-2">
              New Required Yield ({recipe.output_unit})
            </label>
            <input 
              type="number" 
              step="any"
              value={requiredOutput}
              onChange={(e) => setRequiredOutput(e.target.value)}
              className="w-full bg-slate-900/80 border border-emerald-500/50 rounded-xl py-4 px-5 text-2xl font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
              placeholder="Enter quantity..."
            />
          </div>
        </div>

        {/* Cost Summary Card */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px]" />
          
          <Receipt className="w-10 h-10 text-emerald-500 mb-4 opacity-80" />
          <h3 className="text-slate-400 font-medium mb-2 uppercase tracking-widest text-sm">Total Batch Cost</h3>
          <div className="text-5xl md:text-6xl font-bold text-white tracking-tight flex items-center justify-center">
            {formatCurrency(totalCost)}
          </div>
          <div className="mt-4 text-emerald-400 font-medium bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 text-sm">
            For {requiredOutput || 0} {recipe.output_unit} of {recipe.product_name}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Scaled Ingredients</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Ingredient</th>
                <th className="py-4 px-4 text-right">Master Qty</th>
                <th className="py-4 px-4 text-right bg-emerald-500/5 text-emerald-400 rounded-tl-lg">Required Qty</th>
                <th className="py-4 px-4 text-right bg-emerald-500/5 rounded-tr-lg">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {calculatedIngredients.map((ing, i) => (
                <tr key={ing.id || i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4 text-slate-200 font-medium">{ing.ingredient_name}</td>
                  <td className="py-4 px-4 text-right text-slate-400">
                    {formatNumber(ing.quantity)} {ing.unit}
                  </td>
                  <td className="py-4 px-4 text-right bg-emerald-500/5 font-bold text-emerald-400 text-lg">
                    {formatNumber(ing.displayScaledQty)} {ing.displayUnit}
                  </td>
                  <td className="py-4 px-4 text-right bg-emerald-500/5 text-slate-300">
                    {ing.calculatedCost > 0 ? formatCurrency(ing.calculatedCost) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-700">
                <td colSpan="3" className="py-4 px-4 text-right text-slate-400 font-medium">
                  Total Production Cost
                </td>
                <td className="py-4 px-4 text-right text-xl font-bold text-white">
                  {formatCurrency(totalCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-4 justify-center mt-6 pt-6 border-t border-slate-800 print:hidden">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={exportToText} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition">
            <Download className="w-4 h-4" /> Export Text
          </button>
        </div>
      </div>
    </div>
  );
}
