
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RecipeForm from './pages/RecipeForm';
import RecipeCalculator from './pages/RecipeCalculator';
import UploadRecipe from './pages/UploadRecipe';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="recipe/new" element={<RecipeForm />} />
          <Route path="recipe/edit/:id" element={<RecipeForm />} />
          <Route path="recipe/calc/:id" element={<RecipeCalculator />} />
          <Route path="upload" element={<UploadRecipe />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
              <h2 className="text-4xl font-bold text-white mb-4">404</h2>
              <p className="text-slate-400 text-lg mb-6">Oops! The page you're looking for doesn't exist.</p>
              <Link to="/" className="px-6 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold rounded-lg transition-colors">
                Return Home
              </Link>
            </div>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
