import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockDb } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const sessionUser = localStorage.getItem('currentUser');
    if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data, error } = await mockDb.loginUser(username, password);
    if (error) throw error;
    setUser(data);
    localStorage.setItem('currentUser', JSON.stringify(data));
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const canDeleteRecipe = () => {
    if (!user) return false;
    return !!user.can_delete_recipe;
  };

  const isAdmin = () => {
    return user?.role === 'Admin';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, canDeleteRecipe, isAdmin, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
