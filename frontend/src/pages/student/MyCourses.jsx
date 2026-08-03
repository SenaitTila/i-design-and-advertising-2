// src/pages/student/MyCourses.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/authApi';

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔍 Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const navigate = useNavigate();

  // Updates the browser tab title
  useEffect(() => {
    document.title = "My Learning | I Design & Advertising";
  }, []);

  // Fetch data safely with an active mount flag to prevent memory leaks
  useEffect(() => {
    let isMounted = true;

    const fetchMyCoursesAndCategories = async () => {
      try {
        setLoading(true);
        const [enrollmentResponse, categoryResponse] = await Promise.all([
          API.get('/student/enrollments', { _skipGlobalLoading: true }),
          API.get('/student/categories', { _skipGlobalLoading: true })
        ]);

        if (isMounted) {
          setEnrollments(enrollmentResponse.data?.data || enrollmentResponse.data || []);
          setCategories(categoryResponse.data?.data || categoryResponse.data || []);
        }
      } catch (err) {
        console.error("Error loading student data matrix:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMyCoursesAndCategories();

    return () => {
      isMounted = false; // Cleanup flag
    };
  }, []);

  // Reset page to 1 safely on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Helper utility to resolve category strings safely
  const getCategoryName = (course) => {
    if (!course?.category) return 'Active Course';
    if (typeof course.category === 'object') return course.category.name || 'Active Course';
    
    const matchedCat = categories.find((c) => c._id === course.category);
    return matchedCat ? matchedCat.name : 'Active Course';
  };

  // ⚡ Optimizing filtering pipeline via useMemo to avoid recalculations on simple clicks
  const filteredEnrollments = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().trim();
    if (!normalizedQuery) return enrollments;

    return enrollments.filter((record) => {
      const course = record?.course;
      if (!course) return false;

      const titleMatch = course.title?.toLowerCase().includes(normalizedQuery) || false;
      const descMatch = course.description?.toLowerCase().includes(normalizedQuery) || false;
      const catMatch = getCategoryName(course).toLowerCase().includes(normalizedQuery);

      return titleMatch || descMatch || catMatch;
    });
  }, [enrollments, searchQuery, categories]);

  // Pagination Math
  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);
  
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredEnrollments.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredEnrollments, currentPage, itemsPerPage]);

  return (
    <div className="space-y-8 w-full text-left">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            My Learning Library
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pick up right where you left off with your video training modules.
          </p>
        </div>

        {/* SEARCH INPUT */}
        {!loading && enrollments.length > 0 && (
          <div className="w-full sm:w-80 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <span className="text-xs">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search by title, topic, or track..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 font-mono text-sm text-gray-500 animate-pulse">
          Syncing your playlist catalog...
        </div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl max-w-md mx-auto shadow-sm">
          <p className="text-gray-500 font-medium mb-4">You aren't enrolled in any courses yet.</p>
          <button 
            onClick={() => navigate('/student/catalog')} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Browse Course Catalog
          </button>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl max-w-md mx-auto shadow-xs">
          <p className="text-gray-400 text-sm italic">
            No matching courses found for your current search filter context.
          </p>
        </div>
      ) : (
        <>
          {/* COURSE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map((record) => {
              const course = record?.course;
              if (!course) return null; // Avoid empty records breaking rendering
              
              // Using database IDs ensures completely unique, non-crashing React keys
              const cleanUIKey = record._id || course._id || `course-${course.title}`;
              const displayedCategory = getCategoryName(course);

              return (
                <div 
                  key={cleanUIKey} 
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col hover:shadow-md transition-shadow duration-200"
                >
                  <img 
                    src={course.thumbnailUrl || 'https://via.placeholder.com/300x180'} 
                    alt={course.title || 'Course thumbnail'} 
                    className="w-full h-48 object-cover border-b border-gray-100"
                  />
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded">
                        {displayedCategory}
                      </span>
                      
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                        {course.title || 'Untitled Course'}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {course.description || "No module summary details provided for this active training track."}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const courseId = course._id || course.id;
                        // Pro Tip: It's cleaner to pass the course ID in the URL structure 
                        // so users can refresh or bookmark their video lesson directly!
                        navigate(`/student/player/${courseId}`, { state: { courseId } });
                      }} 
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>▶ Resume Lesson</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION PANEL */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-100">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, pageIdx) => {
                  const targetPageNum = pageIdx + 1;
                  return (
                    <button
                      key={`page-btn-${targetPageNum}`}
                      onClick={() => setCurrentPage(targetPageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === targetPageNum
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      } cursor-pointer`}
                    >
                      {targetPageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyCourses;