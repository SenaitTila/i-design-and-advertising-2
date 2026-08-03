// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, clearUser } from './store/authSlice';
import { getMe, injectLoadingMethods } from './api/authApi';

// Global Loading State Management
import { LoadingProvider, useLoading } from './context/LoadingContext';
import Spinner from './components/common/Spinner'; // 🚀 Imported your visual design Spinner component

// Layout Wrappers Imports
import AdminLayout from './components/layouts/AdminLayout'; 
import StudentLayout from './components/layouts/StudentLayout'; 

// Pages Layout Imports
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminDashboard from './pages/admin/Dashboard';
import InstructorDashboard from './pages/instructor/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Sub-Management Panels
import AdminCourses from './pages/admin/Courses';
import AdminQuizzes from './pages/admin/Quizzes';
import AdminEnrollments from './pages/admin/Enrollments';
import AdminUsers from './pages/admin/Users';
import AdminCategories from './pages/admin/Categories';
import AdminAccessCodes from './pages/admin/AccessCodes';
import Videos from './pages/admin/Videos';
import AdminInboxPage from './pages/admin/AdminInboxPage'; 

// Student Layouts
import MyCourses from './pages/student/MyCourses';
import CoursePlayer from './pages/student/CoursePlayer';
import Profile from './pages/student/Profile';
import Catalog from './pages/student/Catalog';
import Quizzes from './pages/student/Quizzes';
import Certificate from './pages/student/Certificate';
import MyCertificates from './pages/student/MyCertificates';
import StudentChatPage from './pages/student/StudentChatPage'; 

import Home from './components/common/Home';

const LoadingInitializer = () => {
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    injectLoadingMethods(showLoading, hideLoading);
  }, [showLoading, hideLoading]);

  return null;
};

const ProtectedRoute = ({ allowedRole }) => {
  const user = useSelector((state) => state.auth.user);
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) return <Navigate to={`/${user.role}/dashboard`} replace />;
  
  return <Outlet />; 
};

function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await getMe();
        if (response.success) {
          dispatch(setUser(response.data));
        } else {
          dispatch(clearUser());
        }
      } catch (err) {
        dispatch(clearUser());
      }
    };
    restoreSession();
  }, [dispatch]);

  // 🚀 FIX: Swapped out raw text headers with your component Spinner to normalize design elements
  if (loading) {
    return <Spinner message="Authenticating session..." />;
  }

  // Normalize user metadata payload cleanly for chat component properties injection
  const chatUserPayload = user ? { id: user._id, name: user.name, role: user.role } : null;

  return (
    <LoadingProvider>
      <LoadingInitializer />
      
      <Router>
        <div className="app-container">
          <Routes>
            {/* Guest Authentication Routes */}
            <Route 
              path="/login" 
              element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Register />} 
            />

            
            <Route path="/" element={<Home />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:resettoken" element={<ResetPassword />} />
            
            <Route path="/verify/certificate/:certId" element={<Certificate />} />

            {/* ==========================================
                🛡️ ADMIN PROTECTED WITH PERSISTENT SIDEBAR
               ========================================== */}
            <Route path="/admin" element={<ProtectedRoute allowedRole="admin" />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="categories" element={<AdminCategories />} /> 
                <Route path="courses" element={<AdminCourses />} />
                <Route path="quizzes" element={<AdminQuizzes />} />
                <Route path="videos" element={<Videos />} />
                
                {/* Admin Chat Inbox Route */}
                <Route path="inbox" element={<AdminInboxPage currentUser={chatUserPayload} />} />
                
                <Route path="access-codes" element={<AdminAccessCodes />} /> 
                <Route path="enrollments" element={<AdminEnrollments />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
            </Route>

            {/* ==========================================
                🎓 INSTRUCTOR PROTECTED PATHWAY BLOCK
               ========================================== */}
            <Route path="/instructor" element={<ProtectedRoute allowedRole="instructor" />}>
              <Route index element={<InstructorDashboard />} />
              <Route path="dashboard" element={<InstructorDashboard />} />
            </Route>
            
            {/* ==========================================
                👥 STUDENT PROTECTED WITH PERSISTENT SIDEBAR
               ========================================== */}
            <Route path="/student" element={<ProtectedRoute allowedRole="student" />}>
              <Route element={<StudentLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="my-courses" element={<MyCourses />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="mycertificates" element={<MyCertificates />} />
                
                {/* Student Hub Chat/Forum Route */}
                <Route path="messages" element={<StudentChatPage currentUser={chatUserPayload} />} />

                <Route path="profile" element={<Profile />} />
              </Route>
              
              {/* Course Player & Quizzes open out-of-layout for immersive viewing */}
              <Route path="player/:courseId" element={<CoursePlayer />} />
              <Route path="quizzes/course/:courseId" element={<Quizzes />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </LoadingProvider>
  );
}

export default App;