import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileType, Image as ImageIcon, AlertCircle, 
  Check, Loader2, Sparkles, Plus, Trash2, ArrowLeft, Save, ClipboardList
} from 'lucide-react';
import { read, utils } from 'xlsx';
import { mockDb } from '../services/supabase';

export default function UploadRecipe() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('document'); // 'document' | 'image' | 'text'
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Parsed Result State
  const [recipeName, setRecipeName] = useState('');
  const [outputQty, setOutputQty] = useState('1');
  const [outputUnit, setOutputUnit] = useState('kg');
  const [ingredients, setIngredients] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Image Helper Mode State
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);

  // ─── 1. EXCEL/CSV IMPORT PARSING ───────────────────────────────────────────
  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = utils.sheet_to_json(ws, { header: 1 });

        if (rows.length === 0) {
          throw new Error("The selected document appears to be empty.");
        }

        parseExcelData(rows, file.name);
      } catch (err) {
        console.error(err);
        setErrorMsg(`Failed to parse file: ${err.message}`);
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const parseExcelData = (rows, filename) => {
    try {
      let parsedName = filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      let parsedOutputQty = '1';
      let parsedOutputUnit = 'kg';
      let ingredientStartIndex = 0;

      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        const rowStr = row.join(' ').toLowerCase();
        if (rowStr.includes('recipe name') || rowStr.includes('product name')) {
          const val = row[1] || row[2];
          if (val) parsedName = val.toString().trim();
        }
        if (rowStr.includes('yield') || rowStr.includes('output quantity') || rowStr.includes('master yield')) {
          const val = parseFloat(row[1] || row[2]);
          if (!isNaN(val)) parsedOutputQty = val.toString();
        }
        if (rowStr.includes('unit') || rowStr.includes('output unit')) {
          const val = row[1] || row[2];
          if (val) parsedOutputUnit = val.toString().trim();
        }
        
        if (rowStr.includes('ingredient') || rowStr.includes('item name')) {
          ingredientStartIndex = i;
          break;
        }
      }

      const headerRow = rows[ingredientStartIndex] || [];
      const dataRows = rows.slice(ingredientStartIndex + 1);

      let nameCol = 0;
      let qtyCol = 1;
      let unitCol = 2;
      let purQtyCol = -1;
      let purUnitCol = -1;
      let purPriceCol = -1;

      headerRow.forEach((col, idx) => {
        if (!col) return;
        const colStr = col.toString().toLowerCase();
        if (colStr.includes('name') || colStr.includes('ingredient')) nameCol = idx;
        else if (colStr.includes('qty') || colStr.includes('quantity') || colStr.includes('amount')) qtyCol = idx;
        else if (colStr.includes('unit')) unitCol = idx;
        else if (colStr.includes('purchase qty') || colStr.includes('purchase quantity') || colStr.includes('purchase size')) purQtyCol = idx;
        else if (colStr.includes('purchase unit')) purUnitCol = idx;
        else if (colStr.includes('price') || colStr.includes('cost')) purPriceCol = idx;
      });

      const parsedIngredients = [];
      dataRows.forEach(row => {
        if (!row || !row[nameCol]) return;
        
        const name = row[nameCol].toString().trim();
        const qty = parseFloat(row[qtyCol]) || 0;
        const unit = row[unitCol] ? row[unitCol].toString().trim() : 'kg';
        const pQty = purQtyCol !== -1 ? parseFloat(row[purQtyCol]) : '';
        const pUnit = purUnitCol !== -1 ? row[purUnitCol]?.toString().trim() : '';
        const pPrice = purPriceCol !== -1 ? parseFloat(row[purPriceCol]) : '';

        if (name) {
          parsedIngredients.push({
            ingredient_name: name,
            quantity: qty,
            unit: unit,
            purchase_quantity: isNaN(pQty) ? '' : pQty,
            purchase_unit: pUnit || unit,
            purchase_price: isNaN(pPrice) ? '' : pPrice
          });
        }
      });

      if (parsedIngredients.length === 0) {
        throw new Error("No ingredients could be parsed from the file.");
      }

      setRecipeName(parsedName);
      setOutputQty(parsedOutputQty);
      setOutputUnit(parsedOutputUnit);
      setIngredients(parsedIngredients);
      setUploadedImageSrc(null); // No image needed in sheet import
      setShowPreview(true);
      setSuccessMsg(`Successfully parsed ${parsedIngredients.length} ingredients!`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── 2. IMAGE UPLOAD HELPER ────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      setUploadedImageSrc(evt.target.result);
      
      // Initialize with clean fields and one empty ingredient so the user can easily start keying in details
      setRecipeName('');
      setOutputQty('1');
      setOutputUnit('kg');
      setIngredients([
        {
          ingredient_name: '',
          quantity: 1,
          unit: 'kg',
          purchase_quantity: '',
          purchase_unit: 'kg',
          purchase_price: ''
        }
      ]);
      
      setShowPreview(true);
      setSuccessMsg("Image uploaded successfully! Use the helper view on the left to manually input your recipe.");
    };
    reader.readAsDataURL(file);
  };

  // ─── 3. TEXT IMPORT PARSING ────────────────────────────────────────────────
  const handleTextParse = () => {
    if (!inputText.trim()) {
      setErrorMsg("Please paste or type some recipe text first.");
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const lines = inputText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const parsedIngredients = [];
      let guessedRecipeName = 'New Parsed Recipe';
      
      // Guess Recipe Name
      if (lines.length > 0) {
        const firstLine = lines[0];
        if (firstLine.toLowerCase().includes('recipe') || firstLine.toLowerCase().includes('name')) {
          guessedRecipeName = firstLine.split(/[:\-]/)[1]?.trim() || firstLine;
        } else {
          guessedRecipeName = firstLine;
        }
      }

      // Regex matching for ingredients: e.g. "5 kg Rice Powder", "250g Salt", "Mulak Podi - 250 g"
      const ingRegex = /(?:([\d\.]+)\s*(kg|g|ml|l|tsp|tbsp|pcs|pc|cups|cup)?\s+(.+))|(?:(.+)\s+([\d\.]+)\s*(kg|g|ml|l|tsp|tbsp|pcs|pc|cups|cup)?)/i;

      lines.forEach(line => {
        if (line.toLowerCase().includes('yield') || line.toLowerCase().includes('total') || line.toLowerCase().includes('cost')) return;

        const match = line.match(ingRegex);
        if (match) {
          if (match[1]) {
            const qty = parseFloat(match[1]);
            const unit = match[2] || 'pcs';
            const name = match[3].replace(/^[-:\s]+|[-:\s]+$/g, '').trim();
            if (name && !isNaN(qty)) {
              parsedIngredients.push({
                ingredient_name: name,
                quantity: qty,
                unit: unit,
                purchase_quantity: '',
                purchase_unit: unit,
                purchase_price: ''
              });
            }
          } 
          else if (match[4]) {
            const name = match[4].replace(/^[-:\s]+|[-:\s]+$/g, '').trim();
            const qty = parseFloat(match[5]);
            const unit = match[6] || 'pcs';
            if (name && !isNaN(qty)) {
              parsedIngredients.push({
                ingredient_name: name,
                quantity: qty,
                unit: unit,
                purchase_quantity: '',
                purchase_unit: unit,
                purchase_price: ''
              });
            }
          }
        }
      });

      if (parsedIngredients.length === 0) {
        // Fallback: load line items directly as items
        lines.forEach(line => {
          if (line.length > 2) {
            parsedIngredients.push({
              ingredient_name: line,
              quantity: 1,
              unit: 'pcs',
              purchase_quantity: '',
              purchase_unit: 'pcs',
              purchase_price: ''
            });
          }
        });
      }

      setRecipeName(guessedRecipeName);
      setIngredients(parsedIngredients);
      setUploadedImageSrc(null); // No image needed in text paste
      setShowPreview(true);
      setSuccessMsg(`Successfully parsed ${parsedIngredients.length} ingredients from your pasted text!`);
    } catch (err) {
      setErrorMsg(`Parsing failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ─── 4. HANDLERS FOR THE PREVIEW EDITOR ────────────────────────────────────
  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        ingredient_name: '',
        quantity: 1,
        unit: 'kg',
        purchase_quantity: '',
        purchase_unit: 'kg',
        purchase_price: ''
      }
    ]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const saveRecipeToDatabase = async () => {
    if (!recipeName.trim()) {
      setErrorMsg("Recipe Name cannot be empty.");
      return;
    }
    if (ingredients.length === 0) {
      setErrorMsg("Please add at least one ingredient.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const recipeData = {
        product_name: recipeName,
        output_quantity: parseFloat(outputQty) || 1,
        output_unit: outputUnit
      };

      const { data, error } = await mockDb.saveRecipe(recipeData, ingredients);
      if (error) throw error;

      navigate('/');
    } catch (err) {
      setErrorMsg(`Failed to save recipe: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Import Recipe</h1>
          <p className="text-slate-400">Import recipe files from spreadsheets, raw text lists, or reference images.</p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 mb-8 overflow-x-auto gap-2">
        <button
          onClick={() => { setActiveTab('document'); setShowPreview(false); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium whitespace-nowrap transition-all ${
            activeTab === 'document' 
              ? 'border-emerald-500 text-emerald-400 font-semibold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileType className="w-4 h-4" /> Import Excel / CSV
        </button>
        <button
          onClick={() => { setActiveTab('image'); setShowPreview(false); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium whitespace-nowrap transition-all ${
            activeTab === 'image' 
              ? 'border-emerald-500 text-emerald-400 font-semibold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Upload Reference Image
        </button>
        <button
          onClick={() => { setActiveTab('text'); setShowPreview(false); setErrorMsg(''); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium whitespace-nowrap transition-all ${
            activeTab === 'text' 
              ? 'border-emerald-500 text-emerald-400 font-semibold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Paste Recipe Text
        </button>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-emerald-400 text-sm">{successMsg}</p>
        </div>
      )}

      {/* Tab Screen Contents */}
      {!showPreview && (
        <div className="grid grid-cols-1 gap-6">
          {/* Tab 1: Document Upload */}
          {activeTab === 'document' && (
            <div className="glass-card rounded-2xl p-12 text-center border-dashed border-slate-700/60 hover:border-emerald-500/40 transition">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
                  <p className="text-slate-300 font-medium">Parsing columns...</p>
                </div>
              ) : (
                <>
                  <FileType className="w-16 h-16 text-emerald-400/80 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Upload Excel or CSV File</h3>
                  <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                    SCALECRAFT automatically maps column names for ingredients, units, quantities, purchase unit size, and prices.
                  </p>
                  <label className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-xl font-semibold cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.2)] transition inline-block">
                    Browse Files
                    <input 
                      type="file" 
                      accept=".csv, .xlsx, .xls" 
                      onChange={handleDocumentUpload} 
                      className="hidden" 
                    />
                  </label>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Reference Image Upload */}
          {activeTab === 'image' && (
            <div className="glass-card rounded-2xl p-12 text-center border-dashed border-slate-700/60 hover:border-emerald-500/40 transition">
              <ImageIcon className="w-16 h-16 text-emerald-400/80 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Upload Recipe Photo / Image</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                Upload any screenshot or photo of your recipe. SCALECRAFT displays the image directly inside the creator screen to help you key in details with 100% accuracy.
              </p>
              <label className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-xl font-semibold cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.2)] transition inline-block">
                Browse Images
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          )}

          {/* Tab 3: Paste Recipe Text */}
          {activeTab === 'text' && (
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <ClipboardList className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-semibold text-white">Paste Raw Recipe Text</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Paste raw lists (e.g. from WhatsApp, emails, or Notes) below. SCALECRAFT smart parses quantities and ingredients line-by-line.
              </p>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g.&#10;Ribbon Pakkavada&#10;5 kg Rice Powder&#10;1 kg Poola Podi&#10;3 kg Kadala Podi&#10;250 g Salt"
                rows="10"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-sm mb-6 placeholder-slate-600 focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleTextParse}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-75"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Parse & Review Recipe
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Preview Editor */}
      {showPreview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Left panel: Uploaded Image Reference Helper */}
          {uploadedImageSrc && (
            <div className="lg:col-span-4 glass-card rounded-2xl p-4 flex flex-col h-[650px]">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Image Helper
                </span>
                <label className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-lg cursor-pointer transition">
                  Change Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div className="flex-1 overflow-auto rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 p-2">
                <img 
                  src={uploadedImageSrc} 
                  alt="Recipe reference uploader" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
              <div className="mt-3 text-xs text-slate-500 text-center">
                Scroll / zoom in/out inside this panel to inspect ingredients while writing.
              </div>
            </div>
          )}

          {/* Right panel: Editor Grid */}
          <div className={`${uploadedImageSrc ? 'lg:col-span-8' : 'lg:col-span-12'} glass-card rounded-2xl p-6 md:p-8 flex flex-col h-[650px]`}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">Review & Edit Recipe</h2>
              </div>
              <button 
                onClick={addIngredient}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Ingredient
              </button>
            </div>

            {/* Scrollable Fields wrapper to keep the save bar locked to bottom */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
              
              {/* Recipe Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Recipe / Product Name</label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Ribbon Pakkavada"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Yield Yield Quantity</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      value={outputQty}
                      onChange={(e) => setOutputQty(e.target.value)}
                      className="w-2/3 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      value={outputUnit}
                      onChange={(e) => setOutputUnit(e.target.value)}
                      className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="kg"
                    />
                  </div>
                </div>
              </div>

              {/* Ingredient list */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Ingredients</h3>
                <div className="space-y-3">
                  {ingredients.map((ing, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2.5 p-3.5 bg-slate-900/40 border border-slate-850/60 rounded-xl items-center hover:border-slate-800/80 transition-colors">
                      <div className="md:col-span-4">
                        <input
                          type="text"
                          value={ing.ingredient_name}
                          onChange={(e) => handleIngredientChange(index, 'ingredient_name', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                          placeholder="Ingredient Name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          step="any"
                          value={ing.quantity}
                          onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                          placeholder="Qty"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <input
                          type="text"
                          value={ing.unit}
                          onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                          placeholder="Unit"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          step="any"
                          value={ing.purchase_price}
                          onChange={(e) => handleIngredientChange(index, 'purchase_price', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                          placeholder="Cost (₹)"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          step="any"
                          value={ing.purchase_quantity}
                          onChange={(e) => handleIngredientChange(index, 'purchase_quantity', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                          placeholder="Size"
                        />
                      </div>
                      <div className="md:col-span-1 text-right">
                        <button 
                          onClick={() => removeIngredient(index)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Action Bar */}
            <div className="flex gap-4 justify-end border-t border-slate-800 pt-5 mt-4 shrink-0">
              <button 
                onClick={() => setShowPreview(false)}
                className="px-6 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Back to Upload
              </button>
              <button 
                onClick={saveRecipeToDatabase}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Recipe to DB
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
