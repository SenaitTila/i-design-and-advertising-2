// C:\creative-academy\src\pages\student\Catalog.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import API from '../../api/authApi';

const Catalog = () => {
  const [categories, setCategories] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set()); // 🎯 Tracks already registered course IDs
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  
  // --- ACCESS TOKEN MODAL STATE COUPLING ---
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedCourseForCode, setSelectedCourseForCode] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [modalError, setModalError] = useState('');

  const navigate = useNavigate();

  // 🎯 Updates the browser tab title when the catalog component mounts
  useEffect(() => {
    document.title = "Catalog | I Design & Advertising";
  }, []);

  // --- PARALLEL ASYNC TRACK DATA LOADING ---
  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        setLoading(true);
        // 🎯 Added the student enrollments request to the parallel array queue
        const [categoryResponse, courseResponse, enrollmentResponse] = await Promise.all([
          API.get('/student/categories', { _skipGlobalLoading: true }),
          API.get('/student/catalog', { _skipGlobalLoading: true }),
          API.get('/student/enrollments', { _skipGlobalLoading: true })
        ]);

        const rawCategories = categoryResponse.data?.data || categoryResponse.data || [];
        const activeCategories = rawCategories.filter(cat => cat.status !== 'Draft');
        setCategories(activeCategories);
        
        const rawCourses = courseResponse.data?.data || courseResponse.data || [];
        setAllCourses(rawCourses);
        setFilteredCourses(rawCourses);

        // 🎯 Extract out the course IDs that the user is actively registered for
        const currentEnrollments = enrollmentResponse.data?.data || enrollmentResponse.data || [];
        const enrolledIds = new Set(
          currentEnrollments
            .filter(enroll => enroll.course !== null)
            .map(enroll => typeof enroll.course === 'object' ? enroll.course._id : enroll.course)
        );
        setEnrolledCourseIds(enrolledIds);

      } catch (err) {
        console.error("Error populating structural catalog metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogData();
  }, []);

  // --- RE-EVALUATE FILTER CRITERIA CASCADE ON TRACK SELECTION CHANGE ---
  useEffect(() => {
    if (selectedCategory) {
      const filtered = allCourses.filter(course => {
        const courseCatId = course.category && typeof course.category === 'object'
          ? course.category._id
          : course.category;
        return courseCatId === selectedCategory;
      });
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(allCourses);
    }
  }, [selectedCategory, allCourses]);

  // Initial Action Click Handler Logic
  const handleCourseActionClick = (course) => {
    // 🎯 SMART REDIRECTION: If already registered, jump right past validation grids to player
    if (enrolledCourseIds.has(course._id)) {
      navigate(`/student/player/${course._id}`);
    } else {
      setSelectedCourseForCode(course);
      setInputCode('');
      setModalError('');
      setShowCodeModal(true); // Open authentication validation gate modal
    }
  };

  // Submits the registration token string directly to the backend enrollment route
  const submitEnrollmentWithCode = async (e) => {
    e.preventDefault();
    if (!selectedCourseForCode) return;

    try {
      setEnrollingId(selectedCourseForCode._id);
      setModalError('');

      const { data } = await API.post('/student/enrollments', { 
        courseId: selectedCourseForCode._id,
        enrollmentCode: inputCode
      });
      
      if (data.success) {
        setShowCodeModal(false);
        // Direct routing redirection to video presentation module interface
        navigate(`/student/player/${selectedCourseForCode._id}`);
      }
    } catch (err) {
      setModalError(err.response?.data?.error || "Invalid registration code token entry.");
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      
      <main className="flex-grow py-8 px-4 max-w-7xl mx-auto w-full space-y-8">
        
        {/* --- TITLE BRANDING LAYER --- */}
        <div className="border-b border-gray-200 pb-5 text-left">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Global Course Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Discover premium training blueprints structured cleanly under specialized content tracks.</p>
        </div>

        {/* --- TRACK SELECTOR WITH AGGREGATED PRICE SUMS --- */}
        {!loading && categories.length > 0 && (
          <div className="space-y-3 text-left">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Available Training Tracks</span>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === ''
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-400'
                }`}
              >
                🌐 All Tracks
              </button>
              
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  title={cat.description || ''}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center space-x-2 ${
                    selectedCategory === cat._id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-400'
                  }`}
                >
                  {cat.thumbnailUrl && (
                    <img src={cat.thumbnailUrl} alt="" className="w-4 h-4 rounded-full object-cover inline-block" />
                  )}
                  <span>{cat.name}</span>
                  <span className={`ml-1 px-1.5 py-0.25 rounded text-[10px] ${
                    selectedCategory === cat._id ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-100 text-gray-500'
                  }`}>
                    ${cat.totalTrackPrice ? cat.totalTrackPrice.toFixed(2) : '0.00'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- CATALOG CORE GRID VIEW SYSTEM --- */}
        {loading ? (
          <div className="text-center py-20 font-medium text-gray-500 animate-pulse">Assembling training catalog matrix...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-xl max-w-md mx-auto shadow-sm">
            <p className="text-gray-500 font-medium text-sm italic">
              No active blueprints found mapped under this track right now. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {filteredCourses.map((course) => {
              const rawCourseCatId = course.category && typeof course.category === 'object' 
                ? course.category._id 
                : course.category;

              const isAlreadyEnrolled = enrolledCourseIds.has(course._id); // 🎯 Check status logic

              return (
                <div key={course._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img 
                      src={course.thumbnailUrl || 'https://via.placeholder.com/300x180'} 
                      alt={course.title} 
                      className="w-full h-48 object-cover border-b"
                    />
                    <div className="absolute top-3 right-3 bg-gray-900/90 text-white text-xs font-black px-2.5 py-1 rounded-md tracking-wide shadow-sm backdrop-blur-xs">
                      {course.price && course.price > 0 ? `$${course.price.toFixed(2)}` : 'FREE'}
                    </div>
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between text-left space-y-4">
                    <div className="space-y-2">
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded">
                        {course.category && typeof course.category === 'object' 
                          ? course.category.name 
                          : (categories.find(c => c._id === rawCourseCatId)?.name || 'Active Course')}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{course.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{course.description}</p>
                    </div>

                    <div className="pt-2">
                      {/* 🎯 Conditional Styling and text updates depending on structural user enrollment state */}
                      <button 
                        onClick={() => handleCourseActionClick(course)}
                        className={`w-full py-2.5 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                          isAlreadyEnrolled 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isAlreadyEnrolled ? (
                          <>
                            <span>📺 Resume Lesson</span>
                          </>
                        ) : (
                          <>
                            <span>🚀 Enroll & Begin Learning</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* --- FLOATING SECURE CODE ACCESS DIALOG INTERFACE MODAL --- */}
      {showCodeModal && selectedCourseForCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4 text-left">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Enter Course Access Code</h3>
              <p className="text-xs text-gray-500 mt-1">
                To unlock registration inside <span className="font-bold text-indigo-600">"{selectedCourseForCode.title}"</span>, please input the unique distribution code token assigned by the administration.
              </p>
            </div>

            <form onSubmit={submitEnrollmentWithCode} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Access Voucher Token</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. CAD-XXXXXX" 
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              {modalError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 font-medium">
                  ⚠️ {modalError}
                </p>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollingId === selectedCourseForCode._id}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
                >
                  {enrollingId === selectedCourseForCode._id ? 'Verifying Authorization...' : 'Verify & Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Catalog;