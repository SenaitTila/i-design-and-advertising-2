import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check localStorage or state for the user/token
  // Note: Since you are using HTTP-only cookies, you might fetch 'me' or check an auth state here.
  // For now, checking a token or user item in localStorage is standard practice.
  const isAuthenticated = localStorage.getItem('userInfo') || true; // Adjust based on your actual auth state management

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;