import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
