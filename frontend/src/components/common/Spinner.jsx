import React from 'react';

const Spinner = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center space-y-4 max-w-xs w-full mx-4">
        {/* Animated Spinner Ring */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        {/* Loading Message */}
        <p className="text-gray-700 font-medium text-sm animate-pulse tracking-wide">
          {message}
        </p>
      </div>
    </div>
  );
};

export default Spinner;