import React, { useState } from 'react';
import { useDispatch } from 'react-redux'; 
import { setUser } from '../../store/authSlice'; 
import { loginUser } from '../../api/authApi';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 💡 Utilizing your abstract API function layout
      const response = await loginUser({ email, password });
      
      if (response.success) {
        const user = response.data?.user || response.data;

        if (!user) {
          setError("User information profile not found.");
          return;
        }

        // 💡 Dispatching profile data cleanly into global memory (No localStorage token!)
        dispatch(setUser(user));

        const role = user.role;
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'instructor') {
          navigate('/instructor/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Something went wrong during login'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06162E] via-[#0B2E59] to-[#123D73] flex items-center justify-center px-6">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">

        {/* LEFT SIDE */}
        <div className="text-white">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            Welcome.
            <br />
            Create.
            <br />
            Inspire.
          </h1>

          <p className="mt-6 text-lg text-blue-100">
            Continue your learning journey with Creative Academy and improve your Graphic Design and Video Editing skills.
          </p>

          <div className="grid grid-cols-2 gap-5 mt-10">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="text-5xl">🎨</div>
              <h3 className="text-xl font-bold mt-4">Graphic Design</h3>
              <p className="text-blue-200 mt-2">
                Photoshop
                <br />
                Illustrator
                <br />
                Canva
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="text-5xl">🎬</div>
              <h3 className="text-xl font-bold mt-4">Video Editing</h3>
              <p className="text-blue-200 mt-2">
                Premiere Pro
                <br />
                After Effects
              </p>
            </div>
          </div>
        </div>

        {/* LOGIN FORM CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <h2 className="text-3xl font-bold text-[#0B2E59]">Sign In</h2>
          <p className="text-gray-500 mt-2">Login to your Creative Academy account</p>

          {/* Error Alert Box */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900"
                required
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B2E59] text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-900 transition disabled:bg-blue-800/50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?
            <Link to="/register" className="text-blue-700 font-bold ml-2">
              Sign Up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;