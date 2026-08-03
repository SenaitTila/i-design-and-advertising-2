// C:\creative-academy\src\pages\student\Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, RefreshCw, ArrowRight, Award, FolderHeart, MessageSquare, Sparkles } from 'lucide-react';
import API from '../../api/authApi';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Advanced State Management Hub
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({ totalCourses: 0, completedCourses: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Update Page Title on Mount
  useEffect(() => {
    document.title = "Student Dashboard | Creative Academy";
  }, []);

  const fetchDashboardSnapshot = async () => {
    try {
      setLoading(true);
      setError(false);
      const { data } = await API.get('/student/enrollments');
      
      const list = data.data || data || [];
      const enrollmentArray = Array.isArray(list) ? list : [];
      
      setEnrollments(enrollmentArray);
      
      const completed = enrollmentArray.filter(e => e.progress === 100 || e.isCompleted).length;
      
      setStats({
        totalCourses: enrollmentArray.length,
        completedCourses: completed
      });
    } catch (err) {
      console.error("Error generating student dashboard analytics index:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardSnapshot();
  }, []);

  return (
    <div className="space-y-8 w-full text-left relative">

      {/* 💻 MAIN APP HEADER SECTION */}
      <div>
        <h1 className="text-3xl font-black text-blue-900 tracking-tight">
  Welcome Back, Student 👋
</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review your tracking metrics, manage active lessons, browse your catalog, or access support options.
        </p>
      </div>

      {loading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 bg-gray-100 rounded-xl border border-gray-200"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-100 rounded-xl border border-gray-200 lg:col-span-2"></div>
            <div className="h-64 bg-gray-100 rounded-xl border border-gray-200"></div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white border border-gray-200 p-8 rounded-xl text-center shadow-xs max-w-md mx-auto my-12">
          <div className="text-red-500 text-3xl mb-2">⚠️</div>
          <h4 className="text-sm font-bold text-gray-900">Failed to Load Console</h4>
          <p className="text-xs text-gray-500 mt-1 mb-4">Could not sync live database registrations.</p>
          <button
            onClick={fetchDashboardSnapshot}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Synchronize</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Analytical Blocks Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Clickable Card: Total Enrolled */}
            <div 
              onClick={() => navigate('/student/my-courses')}
              className="bg-white p-5 border border-gray-200 rounded-xl shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Enrolled Courses</div>
                <div className="text-3xl font-black text-blue-600 font-mono mt-0.5">{stats.totalCourses}</div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <BookOpen className="w-5 h-5 textblue-600" />
              </div>
            </div>

            {/* Clickable Card: Completed Tracks */}
            <div 
              onClick={() => navigate('/student/mycertificates')}
              className="bg-white p-5 border border-gray-200 rounded-xl shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Completed Tracks</div>
                <div className="text-3xl font-black text-blue-600 font-mono mt-0.5">{stats.completedCourses}</div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            {/* Clickable Card: Course Catalog */}
            <div 
              onClick={() => navigate('/student/catalog')}
              className="bg-white p-5 border border-gray-200 rounded-xl shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group sm:col-span-2 lg:col-span-1"
            >
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Course Catalog</div>
                <div className="text-sm font-bold text-blue-600 font-sans mt-2 flex items-center space-x-1.5">
                  <span>Explore Available Tracks</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <FolderHeart className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Central Workspace Operations Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Box: Progress tracking feeds */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Active Course Progress</h3>
                <span onClick={() => navigate('/student/my-courses')} className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer inline-flex items-center gap-1">
                  View all ({enrollments.length}) <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              {enrollments.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <div className="text-2xl">🎓</div>
                  <p className="text-xs italic font-medium">You aren't active in any training tracks yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[340px] overflow-y-auto pr-1">
                  {enrollments.slice(0, 3).map((item) => {
                    const id = item._id || item.id;
                    const courseData = item.course || {};
                    const progressVal = Math.min(Math.max(Number(item.progress) || 0, 0), 100);

                    return (
                      <div key={id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <h4 className="text-sm font-bold text-gray-900 truncate max-w-sm" title={courseData.title || "Standard Syllabus Blueprint Node"}>
                            {courseData.title || "Untitled Active Module"}
                          </h4>
                          <div className="flex items-center space-x-3 w-full max-w-xs">
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                               className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressVal}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-mono text-gray-500 font-bold min-w-[28px] text-right">{progressVal}%</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/student/player/${courseData._id || courseData.id}`)}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 rounded-lg text-xs font-bold border transition-all self-start sm:self-center"
                        >
                          {progressVal === 100 ? "Review Material" : progressVal > 0 ? "Resume Lesson" : "Start Course"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Side Column Hub */}
            <div className="lg:col-span-1">
              
              {/* Interactive Forums & Private Support Help Desk Card */}
              <div 
                onClick={() => navigate('/student/messages')}
               className="bg-white border border-blue-100 rounded-2xl p-5 shadow-md space-y-3 cursor-pointer hover:shadow-xl hover:border-blue-300 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                 <Sparkles className="w-24 h-24 text-blue-100" />
                </div>
                
                <div className="flex items-center space-x-3">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Workspace Telemetry</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                    Forums & Support Help Desk <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    Collaborate inside student community discussion forums or start a secure private chat line directly with academy administrators.
                  </p>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default Dashboard;