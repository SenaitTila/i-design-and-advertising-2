import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '../../api/authApi'; 

const AccessCodes = () => {
  const [courses, setCourses] = useState([]);
  const [codesList, setCodesList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [customPrefix, setCustomPrefix] = useState('CAD');
  const [submitting, setSubmitting] = useState(false);

  // 🔍 Searchable Dropdown States
  const [courseSearch, setCourseSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // UI Micro-States
  const [copiedId, setCopiedId] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  const triggerAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 4000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardMetrics = useCallback(async () => {
    try {
      setLoading(true);
      let coursesRes;
      try {
        coursesRes = await API.get('/admin/courses');
      } catch (adminApiError) {
        console.warn("Admin course ledger route inaccessible, using fallback catalog routing...", adminApiError);
        coursesRes = await API.get('/student/catalog');
      }

      const codesRes = await API.get('/admin/access-codes');
      
      const extractedCourses = coursesRes.data?.data || coursesRes.data?.courses || coursesRes.data || [];
      const extractedCodes = codesRes.data?.data || codesRes.data?.codes || codesRes.data || [];
      
      setCourses(Array.isArray(extractedCourses) ? extractedCourses : []);
      setCodesList(Array.isArray(extractedCodes) ? extractedCodes : []);
    } catch (err) {
      console.error("Critical failure populating system distribution data:", err);
      triggerAlert("Failed to sync structural ledger data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  const handleCreateCode = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return triggerAlert('Please select a target training matrix track node.', 'error');

    try {
      setSubmitting(true);
      const { data } = await API.post('/admin/access-codes', {
        courseId: selectedCourse,
        durationDays,
        prefix: customPrefix.trim().toUpperCase()
      });

      if (data.success || data) {
        setSelectedCourse('');
        setCourseSearch(''); // Reset Search input
        setCustomPrefix('CAD');
        setDurationDays(30);
        triggerAlert("Access key securely compiled and registered!");
        fetchDashboardMetrics(); 
      }
    } catch (err) {
      triggerAlert(err.response?.data?.error || "Voucher initialization procedure aborted.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRawCode = async (record) => {
    try {
      await navigator.clipboard.writeText(record.code);
      setCopiedId(record._id || record.id);
      triggerAlert(`Code ${record.code} copied to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      triggerAlert("Failed to copy token", "error");
    }
  };

  const handleShareToPrivateChat = (record) => {
    const courseTitle = (record.course && typeof record.course === 'object') 
      ? record.course.title 
      : "your assigned training module";
      
    const formattedMessage = `Hello! Here is your exclusive access code to enroll in "${courseTitle}":\n\n🔑 Code: ${record.code}\n⏱️ Duration: ${record.durationDays} Days of access\n\nPlease apply this code during checkout or in your dashboard to activate your module enrollment. Happy learning!`;
    
    const encodedMessage = encodeURIComponent(formattedMessage);
    window.location.href = `/admin/inbox?prefilledMessage=${encodedMessage}`;
  };

  const handleRevokeCode = async (codeId) => {
    if (!window.confirm("Permanently revoke this access token? It can no longer be used for enrollment.")) return;
    
    try {
      await API.delete(`/admin/access-codes/${codeId}`);
      triggerAlert("Access code successfully terminated.");
      fetchDashboardMetrics();
    } catch (err) {
      triggerAlert(err.response?.data?.error || "Failed to drop the target access token.", "error");
    }
  };

  // 🔍 Performance filter mapping for extensive catalogs
  const filteredCourses = courses.filter(course => 
    (course.title || '').toLowerCase().includes(courseSearch.toLowerCase())
  );

  const currentlySelectedCourseObj = courses.find(c => (c._id || c.id) === selectedCourse);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-left relative">
      
      {/* System Toast Alerts */}
      {alert.show && (
        <div className="fixed top-6 right-6 z-50 shadow-2xl max-w-sm w-full rounded-xl border p-4 flex items-start space-x-3 bg-white border-l-4"
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

      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Access Voucher Distribution Hub</h1>
        <p className="text-xs text-gray-500 mt-0.5">Generate, issue, and audit single-use cryptographic security key codes for students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Configurator */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 h-fit shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Generate Fresh Key</h3>
            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 font-mono text-indigo-600 rounded">
              Loaded: {courses.length}
            </span>
          </div>
          
          <form onSubmit={handleCreateCode} className="space-y-4">
            
            {/* 🔍 Searchable Dropdown Layout Wrapper */}
            <div className="space-y-1 relative" ref={dropdownRef}>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Target Course</label>
              
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus-within:border-indigo-500 font-medium text-gray-700 cursor-pointer flex justify-between items-center"
              >
                <span className={currentlySelectedCourseObj ? "text-gray-900 font-semibold" : "text-gray-400"}>
                  {currentlySelectedCourseObj 
                    ? `${currentlySelectedCourseObj.title} ($${currentlySelectedCourseObj.price !== undefined ? currentlySelectedCourseObj.price : 0})` 
                    : "-- Search & Choose Blueprint --"}
                </span>
                <svg className={`w-3 h-3 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Collapsible search panel */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <input 
                      type="text"
                      placeholder="Type to filter training tracks..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on input click
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-medium"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                    {filteredCourses.length === 0 ? (
                      <div className="p-3 text-xs text-gray-400 italic text-center">No matching track nodes found</div>
                    ) : (
                      filteredCourses.map(c => {
                        const id = c._id || c.id;
                        return (
                          <div
                            key={id}
                            onClick={() => {
                              setSelectedCourse(id);
                              setIsDropdownOpen(false);
                            }}
                            className={`p-2.5 text-xs text-left cursor-pointer transition-colors hover:bg-indigo-50 hover:text-indigo-900 font-medium ${selectedCourse === id ? 'bg-indigo-50/50 text-indigo-600 font-bold' : 'text-gray-700'}`}
                          >
                            {c.title || 'Untitled'} (${c.price !== undefined ? c.price : 0})
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Key Prefix</label>
                <input 
                  type="text" 
                  maxLength={5}
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-bold uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Duration (Days)</label>
                <input 
                  type="number" 
                  min={1} 
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
            >
              {submitting ? 'Constructing Key System...' : '🛡️ Compile Fresh Token Key'}
            </button>
          </form>
        </div>

        {/* Audit Tables */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="p-4">Secure Token Code</th>
                  <th className="p-4">Mapped Blueprint</th>
                  <th className="p-4">Lifespan</th>
                  <th className="p-4">Redemption Status</th>
                  <th className="p-4 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 animate-pulse">Syncing distribution logs...</td>
                  </tr>
                ) : codesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">No access codes built inside this collection yet.</td>
                  </tr>
                ) : (
                  codesList.map((record) => {
                    const recordId = record._id || record.id;
                    const courseTitle = record.course && typeof record.course === 'object' 
                      ? record.course.title 
                      : null;

                    return (
                      <tr key={recordId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-900 border font-bold tracking-wide select-all">
                              {record.code}
                            </span>
                            <button
                              onClick={() => handleCopyRawCode(record)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                              title="Copy raw token key string directly"
                            >
                              {copiedId === recordId ? (
                                <span className="text-[10px] text-green-600 font-bold">✓</span>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900 max-w-[180px] truncate" title={courseTitle || 'Unbound module mapping reference'}>
                            {courseTitle || <span className="text-red-400 font-normal italic">Removed Course</span>}
                          </div>
                        </td>
                        <td className="p-4 text-gray-500">{record.durationDays} Days</td>
                        <td className="p-4">
                          {record.usedBy ? (
                            <div className="space-y-0.5">
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-sm border">
                                🔒 Consumed
                              </span>
                              <p className="text-[10px] text-gray-400 max-w-[140px] truncate" title={typeof record.usedBy === 'object' ? record.usedBy?.email : ''}>
                                by {typeof record.usedBy === 'object' ? (record.usedBy?.name || record.usedBy?.email) : 'Active Student'}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-sm border border-emerald-100">
                              ✨ Active Ready
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleShareToPrivateChat(record)}
                            className="inline-flex items-center space-x-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-md border border-indigo-100 transition-all text-[11px]"
                            title="Forward text voucher template straight to private support channel panel"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.028-2.014m0 5.07l-4.028-2.014m9.184-3.03a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0zm-9.184 5.07a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" />
                            </svg>
                            <span>Share to Private Chat</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleRevokeCode(recordId)}
                            className="text-gray-400 hover:text-red-600 transition-colors font-semibold px-2 py-1 rounded-md hover:bg-red-50 text-[11px]"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessCodes;