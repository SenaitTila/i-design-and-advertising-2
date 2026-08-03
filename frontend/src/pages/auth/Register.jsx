import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux"; 
import { setUser } from "../../store/authSlice"; // 💡 Added global state sync
import { registerUser } from "../../api/authApi"; // 💡 Abstract API layer handler

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);

    try {
      // 💡 Submits to abstract layer. httpOnly cookie is handled entirely by the browser.
      const response = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "student", // Default role assignment
      });

      if (response.success) {
        const user = response.data?.user || response.data;

        if (!user) {
          setError("User information profile not found after registration.");
          return;
        }

        // 💡 Dispatching profile data cleanly into global memory (Keeping httpOnly cookie approach intact)
        dispatch(setUser(user));

        // 💡 Dynamic redirection based on role logic, mimicking your login system
        const role = user.role;
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else if (role === "instructor") {
          navigate("/instructor/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      }
    } catch (err) {
      console.log("REGISTER ERROR:", err.response?.data);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Something went wrong during registration."
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
            Create.
            <br />
            Design.
            <br />
            Inspire.
          </h1>

          <p className="mt-6 text-lg text-blue-100">
            Join Creative Academy and learn professional Graphic Design and Video Editing skills from practical projects.
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

        {/* REGISTER CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <h2 className="text-3xl font-bold text-[#0B2E59]">Create Account</h2>
          <p className="text-gray-500 mt-2">Start your creative learning journey</p>

          {/* Error Alert Box */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900"
                required
              />
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password (Minimum 6 characters)"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 pr-16 text-gray-900"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-900"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B2E59] text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-900 transition disabled:bg-blue-800/50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?
            <Link to="/login" className="text-blue-700 font-bold ml-2">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;