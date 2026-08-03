// C:\creative-academy\src\pages\admin\Lessons.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../api/authApi';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  UploadCloud, 
  Film, 
  FolderOpen, 
  GraduationCap, 
  Clock, 
  Link2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  ListOrdered,
  ChevronDown
} from "lucide-react";

const Videos = () => {
  const [categories, setCategories] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Core selection bindings
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Dropdown UI Search & Visibility States
  const [categorySearch, setCategorySearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);

  // Click Outside Refs
  const categoryRef = useRef(null);
  const courseRef = useRef(null);

  // Search & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  // Operations UI states
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [videoModal, setVideoModal] = useState({ open: false, mode: 'add', videoId: null });
  const [videoForm, setVideoForm] = useState({ title: '', videoUrl: '', duration: '', order: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const triggerAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 4000);
  };

  // --- INITIAL DATA SYNC ---
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catRes, courseRes] = await Promise.all([
        API.get('/admin/categories', { _skipGlobalLoading: true }),
        API.get('/admin/courses', { _skipGlobalLoading: true })
      ]);

      setCategories(catRes.data?.data || catRes.data || []);
      setAllCourses(courseRes.data?.data || courseRes.data || []);
    } catch (err) {
      console.error("Data pipeline sync exception:", err);
      triggerAlert("Failed to load foundational category/course frames.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // --- CLOSE DROPDOWNS ON CLICK OUTSIDE ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
      if (courseRef.current && !courseRef.current.contains(event.target)) {
        setCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- CASCADE FILTERING (CATEGORIES -> COURSES) ---
  useEffect(() => {
    if (selectedCategory) {
      const filtered = allCourses.filter(course => {
        const catId = course.category && typeof course.category === 'object' 
          ? course.category._id 
          : course.category;
        return catId === selectedCategory;
      });
      setFilteredCourses(filtered);
      
      if (!filtered.find(c => c._id === selectedCourse)) {
        setSelectedCourse('');
        setCurrentPlaylist([]);
      }
    } else {
      setFilteredCourses([]);
      setSelectedCourse('');
      setCurrentPlaylist([]);
    }
    setCurrentPage(1);
  }, [selectedCategory, allCourses]);

  // --- PLAYLIST SYNC ---
  useEffect(() => {
    const syncPlaylist = async () => {
      if (!selectedCourse) {
        setCurrentPlaylist([]);
        return;
      }

      try {
        setLoading(true);
        const res = await API.get(`/admin/courses/${selectedCourse}/lessons`, { _skipGlobalLoading: true });
        const lessonsArray = res.data?.data || res.data || [];
        setCurrentPlaylist([...lessonsArray].sort((a, b) => (a.order || 0) - (b.order || 0)));
      } catch (err) {
        console.error("Failed syncing lesson references:", err);
        triggerAlert("Could not sync playlist documents cleanly from backend.", "error");
      } finally {
        setLoading(false);
      }
    };

    syncPlaylist();
    setCurrentPage(1);
    setSearchTerm('');
  }, [selectedCourse]);

  // Re-sync local dataset upon mutations
  const refreshSyllabusData = async () => {
    if (!selectedCourse) return;
    try {
      const res = await API.get(`/admin/courses/${selectedCourse}/lessons`, { _skipGlobalLoading: true });
      const lessonsArray = res.data?.data || res.data || [];
      setCurrentPlaylist([...lessonsArray].sort((a, b) => (a.order || 0) - (b.order || 0)));
      
      const courseRes = await API.get('/admin/courses', { _skipGlobalLoading: true });
      setAllCourses(courseRes.data?.data || courseRes.data || []);
    } catch (err) {
      console.error("Post-mutation pipeline synchronization error:", err);
    }
  };

  // --- CRITICAL BULK DATA SEARCH FILTERING FOR DROPDOWNS ---
  const filteredCategoriesOptions = useMemo(() => {
    return categories.filter(cat => 
      (cat.name || '').toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const filteredCoursesOptions = useMemo(() => {
    return filteredCourses.filter(course => 
      (course.title || '').toLowerCase().includes(courseSearch.toLowerCase())
    );
  }, [filteredCourses, courseSearch]);

  // Find selected names for placeholder synchronization
  const selectedCategoryName = categories.find(c => c._id === selectedCategory)?.name || '-- Choose Category Folder --';
  const selectedCourseTitle = allCourses.find(c => c._id === selectedCourse)?.title || (selectedCategory ? "-- Select Course Container --" : "Select a Category First");

  // --- CLIENT SIDE FILTERING & PAGINATION CALCULATIONS ---
  const filteredPlaylist = useMemo(() => {
    return currentPlaylist.filter(vid => {
      if (!vid || typeof vid !== 'object') return false;
      return (vid.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [currentPlaylist, searchTerm]);

  const totalPages = Math.ceil(filteredPlaylist.length / itemsPerPage);

  const paginatedPlaylist = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPlaylist.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPlaylist, currentPage]);

  // --- VIDEO HANDLERS MODAL BINDING ---
  const openVideoModal = (mode, video = null) => {
    setUploadProgress(0);
    setVideoFile(null);
    
    if (mode === 'edit' && video) {
      setVideoForm({
        title: video.title || '',
        videoUrl: video.videoUrl || '',
        duration: video.duration || '',
        order: video.order !== undefined ? video.order : ''
      });
      setVideoModal({ open: true, mode: 'edit', videoId: video._id });
    } else {
      setVideoForm({ title: '', videoUrl: '', duration: '', order: currentPlaylist.length + 1 });
      setVideoModal({ open: true, mode: 'add', videoId: null });
    }
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return triggerAlert("Please choose a target course container.", "error");

    const { mode, videoId } = videoModal;
    try {
      setUploading(true);
      setUploadProgress(0);

      const dataPayload = new FormData();
      dataPayload.append('title', videoForm.title);
      dataPayload.append('duration', videoForm.duration);
      dataPayload.append('order', Number(videoForm.order) || 0);

      if (videoFile) {
        dataPayload.append('videoFile', videoFile);
      } else {
        dataPayload.append('videoUrl', videoForm.videoUrl);
      }

      const axiosConfig = {
        headers: { 'Content-Type': 'multipart/form-data' },
        _skipGlobalLoading: true,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        }
      };

      if (mode === 'edit') {
        await API.put(`/admin/courses/${selectedCourse}/lessons/${videoId}`, dataPayload, axiosConfig);
        triggerAlert("Lesson parameters modified correctly.");
      } else {
        await API.post(`/admin/courses/${selectedCourse}/lessons`, dataPayload, axiosConfig);
        triggerAlert("New lesson resource uploaded and linked successfully.");
      }

      setVideoModal({ open: false, mode: 'add', videoId: null });
      setVideoFile(null);
      await refreshSyllabusData();
    } catch (err) {
      triggerAlert(err.response?.data?.error || "Failed handling operational file data payload.", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this lesson permanently?")) return;
    try {
      await API.delete(`/admin/courses/${selectedCourse}/lessons/${videoId}`, { _skipGlobalLoading: true });
      triggerAlert("Lesson dropped cleanly from system storage schemas.");
      await refreshSyllabusData();
    } catch (err) {
      triggerAlert("Could not execute structural record deletion.", "error");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50/50 relative font-sans">
      
      {/* Inline styles for moving dots animation */}
      <style>{`
        @keyframes moving-dots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
          100% { content: ''; }
        }
        .animate-dots::after {
          content: '';
          animation: moving-dots 1.5s infinite steps(1);
          display: inline-block;
          width: 12px;
          text-align: left;
        }
      `}</style>

      {/* Dynamic Alerts */}
      {alert.show && (
        <div className="fixed top-6 right-6 z-50 shadow-2xl max-w-sm w-full rounded-2xl border p-4 flex items-start space-x-3 bg-white border-l-4 transform animate-slide-in"
             style={{ borderLeftColor: alert.type === 'success' ? '#10B981' : '#EF4444' }}>
          <div className="p-1 rounded-full bg-slate-50">
            {alert.type === 'success' ? (
              <span className="text-emerald-500 text-lg">✓</span>
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="flex-grow">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">System Notification</h4>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{alert.message}</p>
          </div>
          <button onClick={() => setAlert({ ...alert, show: false })} className="text-gray-400 hover:text-gray-600 font-bold text-xs p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-grow py-8 px-4 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Syllabus & Lesson Assets</h1>
            <p className="text-sm text-gray-500 mt-1">Manage video tutorials and learning objects mapped through your relational database.</p>
          </div>
        </div>

        {/* --- CONTROLS DRILLDOWN SELECTORS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white p-6 border border-gray-100 rounded-2xl shadow-sm relative" style={{ zIndex: 40 }}>
          
          {/* Step 1: Pick Domain Category */}
          <div className="space-y-1.5 relative" ref={categoryRef}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-indigo-500" /> Step 1: Pick Domain Category
            </label>
            
            <div 
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="w-full border border-gray-200 p-3 rounded-xl bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 text-sm font-medium transition-all flex items-center justify-between cursor-pointer select-none shadow-xs"
            >
              <span className={selectedCategory ? "text-gray-800 font-semibold" : "text-gray-400"}>
                {selectedCategoryName}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${categoryDropdownOpen ? 'transform rotate-180' : ''}`} />
            </div>

            {categoryDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto flex flex-col">
                <div className="p-2 border-b border-gray-100 sticky top-0 bg-gray-50 z-10 flex items-center">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4" />
                  <input 
                    type="text"
                    autoFocus
                    value={categorySearch}
                    placeholder="Type to filter categories..."
                    onChange={(e) => setCategorySearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()} 
                    className="w-full pl-8 pr-8 py-2 bg-white text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500 shadow-inner"
                  />
                  {categorySearch && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCategorySearch(''); }} 
                      className="absolute right-4 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <div className="py-1">
                  <div 
                    onClick={() => { setSelectedCategory(''); setCategoryDropdownOpen(false); setCategorySearch(''); }}
                    className="px-4 py-2 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer italic font-medium border-b border-gray-50"
                  >
                    -- Clear Choice Container --
                  </div>
                  {filteredCategoriesOptions.length === 0 ? (
                    <div className="px-4 py-6 text-xs text-gray-400 italic text-center">No categories match your search term</div>
                  ) : (
                    filteredCategoriesOptions.map(cat => (
                      <div 
                        key={cat._id}
                        onClick={() => {
                          setSelectedCategory(cat._id);
                          setCategoryDropdownOpen(false);
                          setCategorySearch('');
                        }}
                        className={`px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors ${selectedCategory === cat._id ? 'bg-indigo-50 font-bold text-indigo-600' : ''}`}
                      >
                        {cat.name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Isolate Target Course Portfolio */}
          <div className="space-y-1.5 relative" ref={courseRef}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-500" /> Step 2: Isolate Target Course Portfolio
            </label>

            <div 
              onClick={() => selectedCategory && setCourseDropdownOpen(!courseDropdownOpen)}
              className={`w-full border border-gray-200 p-3 rounded-xl bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 text-sm font-medium transition-all flex items-center justify-between select-none shadow-xs ${!selectedCategory ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={selectedCourse ? "text-gray-800 font-semibold" : "text-gray-400"}>
                {selectedCourseTitle}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${courseDropdownOpen ? 'transform rotate-180' : ''}`} />
            </div>

            {courseDropdownOpen && selectedCategory && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto flex flex-col">
                <div className="p-2 border-b border-gray-100 sticky top-0 bg-gray-50 z-10 flex items-center">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4" />
                  <input 
                    type="text"
                    autoFocus
                    value={courseSearch}
                    placeholder="Type to filter courses..."
                    onChange={(e) => setCourseSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()} 
                    className="w-full pl-8 pr-8 py-2 bg-white text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500 shadow-inner"
                  />
                  {courseSearch && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCourseSearch(''); }} 
                      className="absolute right-4 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="py-1">
                  <div 
                    onClick={() => { setSelectedCourse(''); setCourseDropdownOpen(false); setCourseSearch(''); }}
                    className="px-4 py-2 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer italic font-medium border-b border-gray-50"
                  >
                    -- Clear Selection Container --
                  </div>
                  {filteredCoursesOptions.length === 0 ? (
                    <div className="px-4 py-6 text-xs text-gray-400 italic text-center">No structural courses match your search term</div>
                  ) : (
                    filteredCoursesOptions.map(course => (
                      <div 
                        key={course._id}
                        onClick={() => {
                          setSelectedCourse(course._id);
                          setCourseDropdownOpen(false);
                          setCourseSearch('');
                        }}
                        className={`px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors ${selectedCourse === course._id ? 'bg-indigo-50 font-bold text-indigo-600' : ''}`}
                      >
                        {course.title}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* --- SYLLABUS INTERFACE PANEL --- */}
        {selectedCourse && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 relative" style={{ zIndex: 10 }}>
            
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/30">
              <div className="text-center sm:text-left">
                <h2 className="text-lg font-bold text-gray-800">Linked Syllabus Playlist</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Found {currentPlaylist.length} verified lessons directly mapped to backend arrays.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    placeholder="Search titles..."
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-indigo-500 w-full sm:w-48 bg-white transition-all"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button 
                  onClick={() => openVideoModal('add')} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Append Lesson
                </button>
              </div>
            </div>

            {filteredPlaylist.length === 0 ? (
              <div className="text-center py-20 px-4 text-sm text-gray-400 font-medium flex flex-col items-center justify-center space-y-3">
                <Film className="w-12 h-12 text-gray-300 stroke-[1.5]" />
                <p className="italic">
                  {searchTerm ? "No syllabus nodes match your current filters." : "This course container layout does not possess active video records."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-left">
                  <thead className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 w-24 text-center">Index</th>
                      <th className="px-6 py-4">Lesson Title</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Resource Target Destination</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                    {paginatedPlaylist.map((vid, index) => {
                      const isValidLesson = vid && typeof vid === 'object' && vid.title !== undefined;
                      return (
                        <tr key={isValidLesson ? vid._id : index} className="hover:bg-gray-50/40 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-indigo-600 bg-indigo-50/10 text-center">
                            {isValidLesson ? vid.order : index + 1}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-800 max-w-xs truncate">
                            {isValidLesson ? vid.title : "Unknown Lesson Fragment Record"}
                          </td>
                          <td className="px-6 py-4 font-mono font-medium text-gray-500">
                            {isValidLesson ? vid.duration : "--:--"}
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <span className="inline-flex items-center gap-1 font-mono truncate max-w-full px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg border border-gray-100">
                              <Link2 className="w-3.5 h-3.5 shrink-0" />
                              {isValidLesson ? vid.videoUrl : "No resource signature generated..."}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap font-medium">
                            <div className="inline-flex gap-2">
                              {isValidLesson && (
                                <button 
                                  onClick={() => openVideoModal('edit', vid)} 
                                  className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteVideo(isValidLesson ? vid._id : vid)} 
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- PAGINATION INTERFACE CONTROLS --- */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <span className="text-xs text-gray-400 font-semibold">
                  Showing Page {currentPage} of {totalPages} (Filtered {filteredPlaylist.length} entries)
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-sm font-medium text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            <span>Syncing ecosystem assets...</span>
          </div>
        )}
      </main>

      {/* --- RESPONSIVE MODAL POPUP WINDOW --- */}
      {videoModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col border border-gray-100 transform animate-scale-up max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {videoModal.mode === 'edit' ? 'Modify Lesson Stream' : 'Append New Lesson'}
              </h3>
              <button 
                type="button"
                disabled={uploading} 
                onClick={() => setVideoModal({open: false, mode: 'add', videoId: null})} 
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleVideoSubmit} className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 text-left">
              
              {/* Grid Layout fields: Stacks fully on small displays, grids up on tablet/desktops */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">Title</label>
                  <input 
                    type="text" 
                    required 
                    disabled={uploading} 
                    value={videoForm.title} 
                    onChange={e => setVideoForm({...videoForm, title: e.target.value})} 
                    className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 text-sm font-medium transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <ListOrdered className="w-3.5 h-3.5 text-gray-400" /> Order
                  </label>
                  <input 
                    type="number" 
                    disabled={uploading} 
                    value={videoForm.order} 
                    onChange={e => setVideoForm({...videoForm, order: e.target.value})} 
                    className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 text-sm font-medium transition-all" 
                  />
                </div>
              </div>

              {/* Local File Input with Drag UI */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resource Storage Source</label>
                <label className={`p-4 sm:p-5 border-2 border-dashed rounded-xl text-center block cursor-pointer transition-all group ${
                  uploading 
                    ? 'border-gray-200 bg-gray-50/50 cursor-not-allowed' 
                    : videoForm.videoUrl 
                      ? 'border-gray-100 bg-gray-50/20 opacity-50 cursor-not-allowed'
                      : 'border-indigo-200 bg-indigo-50/10 hover:bg-indigo-50/30'
                }`}>
                  <UploadCloud className={`w-8 h-8 mx-auto mb-1.5 transition-transform group-hover:-translate-y-0.5 ${uploading ? 'text-gray-400' : 'text-indigo-500'}`} />
                  <span className={`text-xs font-bold uppercase block mb-1 ${uploading ? 'text-gray-400' : 'text-indigo-600'}`}>
                    Choose local computer video
                  </span>
                  <input 
                    type="file" 
                    accept="video/*" 
                    disabled={uploading || !!videoForm.videoUrl} 
                    onChange={e => {
                      const file = e.target.files[0] || null;
                      setVideoFile(file);
                      if (file) setVideoForm(prev => ({ ...prev, videoUrl: '' })); 
                    }} 
                    className="hidden" 
                  />
                  {videoFile ? (
                    <div className="mt-2 text-xs font-mono text-emerald-600 bg-emerald-50 py-1.5 px-2 rounded-lg border border-emerald-100 break-all">
                      Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  ) : videoForm.videoUrl ? (
                    <p className="text-[11px] text-gray-400">Clear target external URL input to re-enable local file drops.</p>
                  ) : (
                    <p className="text-[11px] text-gray-400">Supports native video containers up to 100MB</p>
                  )}
                </label>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">OR</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              {/* External Link Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-gray-400" /> Streaming External URL
                </label>
                <input 
                  type="url" 
                  disabled={uploading || !!videoFile} 
                  value={videoForm.videoUrl} 
                  onChange={e => setVideoForm({...videoForm, videoUrl: e.target.value})} 
                  className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-medium disabled:bg-gray-50 disabled:text-gray-400 transition-all" 
                  placeholder="e.g. https://player.vimeo.com/video/example.mp4" 
                />
              </div>

              {/* Time track input field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> Track Duration
                </label>
                <input 
                  type="text" 
                  required 
                  disabled={uploading} 
                  value={videoForm.duration} 
                  onChange={e => setVideoForm({...videoForm, duration: e.target.value})} 
                  className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-medium transition-all" 
                  placeholder="e.g. 14:20 or 1hr 15m" 
                />
              </div>

              {/* Radial Upload Progress bar indicator */}
              {uploading && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-indigo-600 animate-pulse">{uploadProgress < 100 ? "Uploading asset stream..." : "Saving records..."}</span>
                    <span className="text-gray-500 font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </form>

            {/* Sticky Action Footer buttons */}
            <div className="flex justify-end items-center space-x-2 p-4 border-t border-gray-100 bg-gray-50/50 shrink-0 rounded-b-2xl">
              <button 
                type="button" 
                disabled={uploading} 
                onClick={() => setVideoModal({open: false, mode: 'add', videoId: null})} 
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Cancel
              </button>
              
              <button 
                type="button"
                disabled={uploading}
                onClick={handleVideoSubmit}
                className="min-w-[100px] sm:min-w-[120px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              >
                {uploading ? (
                  <span className="animate-dots">Uploading</span>
                ) : (
                  <span>Save video</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    
    </div>
  );
};

export default Videos;