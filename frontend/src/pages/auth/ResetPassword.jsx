import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/authApi'; 
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Captures the :resettoken portion straight from the address bar URL
  const { resettoken } = useParams(); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation check
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    try {
      // Makes a PUT request to your API instance matching backend routes
      const response = await API.put(`/auth/resetpassword/${resettoken}`, { password });
      
      // Handles standard data returns or wrapper schemas cleanly
      if (response.data?.success || response.success) {
        setSuccess('Password updated successfully! Redirecting to login page...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Token is invalid or has expired.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 border border-gray-200 rounded-xl shadow-md">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
              Create New Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please enter your new security credentials down below.
            </p>
          </div>

          {/* Success Notification Banner */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md transition-all">
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}

          {/* Error Notification Banner */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md transition-all">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mt-1 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mt-1 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm font-semibold"
              >
                Reset Password
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;