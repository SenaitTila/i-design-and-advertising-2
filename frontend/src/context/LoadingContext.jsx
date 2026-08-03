import React, { createContext, useContext, useState, useCallback } from 'react';
import Spinner from '../components/common/Spinner';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  // ✅ Wrapped in useCallback to stop re-render loops in App.js
  const showLoading = useCallback((message = 'Loading...') => {
    setLoadingMessage(message);
    setActiveRequests((prev) => prev + 1);
  }, []);

  // ✅ Wrapped in useCallback to prevent continuous reference mutations
  const hideLoading = useCallback(() => {
    setActiveRequests((prev) => Math.max(0, prev - 1));
  }, []);

  const isLoading = activeRequests > 0;

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading }}>
      {children}
      {isLoading && <Spinner message={loadingMessage} />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};