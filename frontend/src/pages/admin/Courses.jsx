import React, { useState, useEffect, useRef, useMemo } from 'react';
import API from '../../api/authApi'; 

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); 

  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [courseModal, setCourseModal] = useState({ open: false, mode: 'create', id: null });
  
  const [courseForm, setCourseForm] = useState({ 
    title: '', 
    category: '', 
    description: '', 
    price: '', 
    thumbnailUrl: '', 
    thumbnailFile: null, 
    status: 'Active' 
  });

  // --- SMART SEARCH & PAGINATION STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all'); // 'all', 'free', 'under50', '50to100', 'over100'
  const [sortOption, setSortOption] = useState('newest'); // 'newest', 'price-low', 'price-high', 'title-asc'
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const previewUrlRef = useRef(null);
  const fileInputRef = useRef(null);

  const triggerAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/admin/categories', { _skipGlobalLoading: true });
      const fetchedCats = data.data || data || [];
      setCategories(fetchedCats);
      return fetchedCats;
    } catch (err) {
      console.error("Error loading category definitions:", err);
      return [];
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/courses', { _skipGlobalLoading: true });
      setCourses(data.data || data || []);
    } catch (err) {
      console.error("Error loading live catalogs:", err);
      triggerAlert("Failed to sync course lists with backend repository", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      await fetchCategories();
      await fetchCourses();
    };
    initializeDashboard();

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !courseForm.category && courseModal.open && courseModal.mode === 'create') {
      setCourseForm(prev => ({ ...prev, category: categories[0]._id }));
    }
  }, [categories, courseModal.open, courseModal.mode]);

  // Reset page when search/filter attributes change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, priceFilter, sortOption]);

  // --- SMART FILTERING & PAGINATION ENGINE ---
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    // 1. Filter by Search Query (Title or Description)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        course => 
          course.title?.toLowerCase().includes(query) || 
          course.description?.toLowerCase().includes(query)
      );
    }

    // 2. Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter(course => {
        const catId = course.category && typeof course.category === 'object' 
          ? course.category._id 
          : course.category;
        return catId === selectedCategory;
      });
    }

    // 3. Filter by Price Ranges
    if (priceFilter !== 'all') {
      result = result.filter(course => {
        const price = parseFloat(course.price) || 0;
        if (priceFilter === 'free') return price === 0;
        if (priceFilter === 'under50') return price > 0 && price <= 50;
        if (priceFilter === '50to100') return price > 50 && price <= 100;
        if (priceFilter === 'over100') return price > 100;
        return true;
      });
    }

    // 4. Sort Options
    if (sortOption === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortOption === 'price-low') {
      result.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortOption === 'price-high') {
      result.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (sortOption === 'title-asc') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [courses, searchQuery, selectedCategory, priceFilter, sortOption]);

  // Calculate Paginated Chunk
  const totalPages = Math.ceil(filteredAndSortedCourses.length / itemsPerPage) || 1;
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCourses, currentPage]);

  const cleanupPreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const openCourseModal = (mode, course = null) => {
    cleanupPreviewUrl();
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (mode === 'edit' && course) {
      const extractedCategoryId = course.category && typeof course.category === 'object' 
        ? course.category._id 
        : course.category;

      setCourseForm({ 
        title: course.title || '', 
        category: extractedCategoryId || '', 
        description: course.description || '',
        price: course.price || '', 
        thumbnailUrl: course.thumbnailUrl || '', 
        thumbnailFile: null, 
        status: course.status || 'Active' 
      });
      setCourseModal({ open: true, mode: 'edit', id: course._id });
    } else {
      setCourseForm({ 
        title: '', 
        category: categories[0]?._id || '', 
        description: '',
        price: '', 
        thumbnailUrl: '',
        thumbnailFile: null, 
        status: 'Active' 
      });
      setCourseModal({ open: true, mode: 'create', id: null });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSizeBytes = 5 * 1024 * 1024; 

    if (!allowedTypes.includes(file.type)) {
      triggerAlert("Invalid format. Please select a valid JPEG, PNG, WEBP, or GIF image.", "error");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > maxSizeBytes) {
      triggerAlert("Selected image is too large. Maximum allowable size is 5MB.", "error");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    cleanupPreviewUrl(); 
    previewUrlRef.current = URL.createObjectURL(file);
    setCourseForm(prev => ({ ...prev, thumbnailFile: file }));
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();

    if (!courseForm.category || courseForm.category.trim() === "") {
      triggerAlert("Please select a valid Category reference before submitting.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', courseForm.title.trim());
      formData.append('category', courseForm.category);
      formData.append('description', courseForm.description.trim());
      formData.append('price', courseForm.price);
      formData.append('status', courseForm.status);
      
      if (courseForm.thumbnailFile) {
        formData.append('thumbnail', courseForm.thumbnailFile);
      } else if (courseForm.thumbnailUrl) {
        formData.append('thumbnailUrl', courseForm.thumbnailUrl);
      }

      const config = {
        _skipGlobalLoading: true,
        headers: {
          'Content-Type': 'multipart/form-data',
          'upload-folder': 'courses' 
        },
      };

      if (courseModal.mode === 'edit') {
        await API.put(`/admin/courses/${courseModal.id}`, formData, config);
        triggerAlert("Course details updated successfully!");
      } else {
        await API.post('/admin/courses', formData, config);
        triggerAlert("New training course successfully created!");
      }
      
      cleanupPreviewUrl();
      setCourseModal({ open: false, mode: 'create', id: null });
      fetchCourses();
    } catch (err) {
      console.error("Course Submission Error:", err.response?.data);
      triggerAlert(err.response?.data?.error || "Course processing workflow generated an exception", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this course package? All connected lessons will be dropped.")) return;
    try {
      await API.delete(`/admin/courses/${id}`, { _skipGlobalLoading: true });
      triggerAlert("Course module dropped completely.");
      fetchCourses();
    } catch (err) {
      triggerAlert("Failed to delete requested course bundle structure", "error");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 relative">
      
      {/* Toast Alert */}
      {alert.show && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in-down shadow-2xl max-w-sm w-full rounded-xl border p-4 flex items-start space-x-3 bg-white border-l-4 border-l-indigo-600 transition-all duration-300"
             style={{ borderLeftColor: alert.type === 'success' ? '#10B981' : '#EF4444' }}>
          <div className="flex-grow">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {alert.type === 'success' ? '⚡ System Alert' : '🛑 Transaction Failure'}
            </h4>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{alert.message}</p>
          </div>
          <button onClick={() => setAlert({ ...alert, show: false })} className="text-gray-400 hover:text-gray-600 font-bold text-xs px-1">✕</button>
        </div>
      )}

      <main className="flex-grow py-8 px-4 max-w-7xl mx-auto w-full">
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Courses Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage catalog definitions, status tracking, and structural configurations.</p>
          </div>
          <button onClick={() => openCourseModal('create')} className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Create New Course
          </button>
        </div>

        {/* --- SMART FILTERS & SEARCH BAR PANEL --- */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Text Search */}
          <div className="relative lg:col-span-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Search by title or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <select 
              value={priceFilter} 
              onChange={(e) => setPriceFilter(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="all">Any Price</option>
              <option value="free">Free Courses</option>
              <option value="under50">Under $50</option>
              <option value="50to100">$50 to $100</option>
              <option value="over100">Over $100</option>
            </select>
          </div>

          {/* Sort Menu */}
          <div>
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="title-asc">Title: Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Dashboard Grid & List Renderer */}
        {loading ? (
          <div className="text-center py-20 font-medium text-gray-500 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            Connecting to server data pipeline...
          </div>
        ) : filteredAndSortedCourses.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <svg className="mx-auto h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-500 font-semibold text-lg">No matching courses found.</p>
            <p className="text-gray-400 text-sm mt-1">Try modifying your search queries or active filter parameters.</p>
          </div>
        ) : (
          <>
            {/* 🖥️ DESKTOP VIEWPORT: Precise Percentage Table (md and up) */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left table-fixed">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 w-[25%]">Course Info</th>
                      <th className="px-6 py-4 w-[20%]">Category Reference</th>
                      <th className="px-6 py-4 w-[10%]">Price</th>
                      <th className="px-6 py-4 w-[10%]">Syllabus Size</th>
                      <th className="px-6 py-4 w-[10%]">Status</th>
                      <th className="px-6 py-4 w-[25%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                    {paginatedCourses.map((course) => (
                      <tr key={course._id} className="hover:bg-gray-50/50 transition-colors">
                        {/* Course Info (25%) */}
                        <td className="px-6 py-4 font-semibold text-gray-900 truncate">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <img 
                              src={course.thumbnailUrl || 'https://placehold.co/120x80?text=No+Image'} 
                              alt={course.title} 
                              className="w-12 h-8 flex-shrink-0 object-cover rounded shadow-sm bg-gray-100 border border-gray-200" 
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = 'https://placehold.co/120x80?text=No+Image';
                              }}
                            />
                            <span className="truncate" title={course.title}>{course.title}</span>
                          </div>
                        </td>

                        {/* Category Reference (20%) */}
                        <td className="px-6 py-4 text-gray-600 truncate">
                          <div className="truncate">
                            {course.category && typeof course.category === 'object' 
                              ? course.category.name 
                              : (categories.find(c => c._id === course.category)?.name || "Uncategorized")}
                          </div>
                        </td>

                        {/* Price (10%) */}
                        <td className="px-6 py-4 font-mono font-semibold truncate">
                          {parseFloat(course.price) === 0 ? 'Free' : `$${course.price}`}
                        </td>

                        {/* Syllabus Size (10%) */}
                        <td className="px-6 py-4 font-medium text-indigo-600 truncate">
                          {course.lessons && Array.isArray(course.lessons) ? `${course.lessons.length} Lessons` : '0 Lessons'}
                        </td>

                        {/* Status (10%) */}
                        <td className="px-6 py-4 truncate">
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${course.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${course.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                            {course.status}
                          </span>
                        </td>

                        {/* Actions (25%) */}
                        <td className="px-6 py-4 text-right space-x-4 truncate">
                          <button onClick={() => openCourseModal('edit', course)} className="text-indigo-600 hover:text-indigo-900 font-semibold transition-colors">Edit</button>
                          <button onClick={() => handleDeleteCourse(course._id)} className="text-red-600 hover:text-red-900 font-semibold transition-colors">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 📱 MOBILE VIEWPORT: Responsive Grid Layout (under md) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {paginatedCourses.map((course) => (
                <div key={course._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={course.thumbnailUrl || 'https://placehold.co/120x80?text=No+Image'} 
                        alt={course.title} 
                        className="w-16 h-12 object-cover rounded shadow-sm border animate-pulse" 
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = 'https://placehold.co/120x80?text=No+Image';
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 line-clamp-1">{course.title}</h4>
                        <p className="text-xs text-gray-400">
                          {course.category && typeof course.category === 'object' 
                            ? course.category.name 
                            : (categories.find(c => c._id === course.category)?.name || "Uncategorized")}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${course.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {course.status}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-1 flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-400 text-xs block">Price</span>
                      <span className="font-bold text-gray-900 font-mono">
                        {parseFloat(course.price) === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 text-xs block">Syllabus Size</span>
                      <span className="font-semibold text-indigo-600">{course.lessons && Array.isArray(course.lessons) ? `${course.lessons.length} Lessons` : '0 Lessons'}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-3 flex justify-end gap-3">
                    <button onClick={() => openCourseModal('edit', course)} className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">Edit</button>
                    <button onClick={() => handleDeleteCourse(course._id)} className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* --- SMART PAGINATION FOOTER PANEL --- */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Showing <strong className="text-gray-800 font-bold">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedCourses.length)}</strong> to <strong className="text-gray-800 font-bold">{Math.min(currentPage * itemsPerPage, filteredAndSortedCourses.length)}</strong> of <strong className="text-gray-800 font-bold">{filteredAndSortedCourses.length}</strong> modules
              </span>
              
              <div className="inline-flex space-x-1.5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-sm' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* --- MODAL: COURSE EDIT / CREATE --- */}
      {courseModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-gray-900">{courseModal.mode === 'edit' ? 'Modify Course Fields' : 'Create Video Course'}</h3>
            <form onSubmit={handleCourseSubmit} className="space-y-4 text-left" encType="multipart/form-data">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Course Title</label>
                <input type="text" required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full mt-1 border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Enter descriptive course title" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Category Reference Relation</label>
                <select 
                  value={courseForm.category} 
                  required
                  onChange={e => setCourseForm({...courseForm, category: e.target.value})} 
                  className="w-full mt-1 border border-gray-300 p-2.5 rounded-lg text-sm bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                  <option value="" disabled>-- Select DB Category Association --</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Course Description</label>
                <textarea rows="3" value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className="w-full mt-1 border border-gray-300 p-2.5 rounded-lg outline-none text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Summarize syllabus scope..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Price ($)</label>
                  <input type="number" required min="0" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: e.target.value})} className="w-full mt-1 border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Deployment Status</label>
                  <select value={courseForm.status} onChange={e => setCourseForm({...courseForm, status: e.target.value})} className="w-full mt-1 border border-gray-300 p-2.5 rounded-lg text-sm outline-none bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer">
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">Upload Thumbnail Image</label>
                
                {courseForm.thumbnailFile ? (
                  <div className="my-2 p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-center space-x-3">
                    <img 
                      src={previewUrlRef.current} 
                      alt="Local Upload Preview" 
                      className="w-16 h-10 object-cover rounded-md border border-indigo-300 shadow-sm" 
                    />
                    <div>
                      <span className="text-xs text-indigo-700 font-bold block">New Selection Ready</span>
                      <span className="text-[10px] text-gray-400">{(courseForm.thumbnailFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                ) : courseForm.thumbnailUrl ? (
                  <div className="my-2 p-2 bg-gray-50 border border-gray-100 rounded-lg flex items-center space-x-3">
                    <img 
                      src={courseForm.thumbnailUrl} 
                      alt="Current Cloud Preview" 
                      className="w-16 h-10 object-cover rounded-md border border-gray-200" 
                    />
                    <div>
                      <span className="text-xs text-gray-600 font-semibold block">Current Cover Active</span>
                      <span className="text-[10px] text-gray-400">No modification yet</span>
                    </div>
                  </div>
                ) : null}

                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  ref={fileInputRef}
                  required={courseModal.mode === 'create'} 
                  onChange={handleFileChange} 
                  className="w-full mt-1 border border-dashed border-gray-300 p-3 rounded-lg outline-none text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" 
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Supports JPG, PNG, WEBP, or GIF. Max payload size: 5MB.</span>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  disabled={submitting}
                  onClick={() => setCourseModal({open: false, mode: 'create', id: null})} 
                  className="px-4 py-2.5 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 min-w-[120px] disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;