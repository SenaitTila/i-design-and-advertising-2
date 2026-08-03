import React, { useState, useEffect, useMemo } from 'react';
import API from '../../api/authApi'; 

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'analytics'
  const [selectedQuizAnalytics, setSelectedQuizAnalytics] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');

  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [quizModal, setQuizModal] = useState({ open: false, mode: 'create', id: null });
  
  // Helper to generate a default question setup with exactly 4 options
  const generateDefaultQuestion = () => ({
    questionText: '',
    questionImage: '',
    options: [
      { text: '', imageURL: '' },
      { text: '', imageURL: '' },
      { text: '', imageURL: '' },
      { text: '', imageURL: '' }
    ],
    correctOptionIndex: 0
  });

  const [quizForm, setQuizForm] = useState({
    title: '',
    course: '',
    description: '',
    passingPercentage: 70, 
    questionsPerPage: 1,   
    duration: 30,          
    maxAttempts: 3,        
    questions: [generateDefaultQuestion()]
  });

  const triggerAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchCourses = async () => {
    try {
      const { data } = await API.get('/admin/courses', { _skipGlobalLoading: true });
      const fetchedCourses = data.data || data || [];
      setCourses(fetchedCourses);
      return fetchedCourses;
    } catch (err) {
      console.error("Error loading parental course relations:", err);
      return [];
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/quizzes', { _skipGlobalLoading: true });
      setQuizzes(data.data || data || []);
    } catch (err) {
      console.error("Error syncing quiz inventories:", err);
      triggerAlert("Failed to sync quiz layouts with backend repository", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizAnalytics = async (quizId) => {
    try {
      setLoading(true);
      const { data } = await API.get(`/admin/quizzes/analytics/${quizId}`, { _skipGlobalLoading: true });
      setSelectedQuizAnalytics(data.data || data || null);
      setActiveTab('analytics');
    } catch (err) {
      triggerAlert("Failed to parse completion telemetry matrices", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      await fetchCourses();
      await fetchQuizzes();
    };
    initializeDashboard();
  }, []);

  // Filtered Quiz List computation
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const titleMatches = quiz.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const descMatches = quiz.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const extractedCourseId = quiz.course && typeof quiz.course === 'object' ? quiz.course._id : quiz.course;
      const courseMatches = !selectedCourseFilter || extractedCourseId === selectedCourseFilter;

      return (titleMatches || descMatches) && courseMatches;
    });
  }, [quizzes, searchTerm, selectedCourseFilter]);

  const handleImageUpload = async (e, qIndex, oIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);

    try {
      const { data } = await API.post('/admin/quizzes/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        _skipGlobalLoading: true
      });

      const updatedQuestions = [...quizForm.questions];
      if (oIndex !== null) {
        updatedQuestions[qIndex].options[oIndex].imageURL = data.imageURL;
      } else {
        updatedQuestions[qIndex].questionImage = data.imageURL;
      }
      setQuizForm({ ...quizForm, questions: updatedQuestions });
      triggerAlert("Media asset committed to Cloudinary storage bucket!");
    } catch (err) {
      triggerAlert("Media serialization upload dropped by cloud provider", "error");
    }
  };

  const openQuizModal = (mode, quiz = null) => {
    if (mode === 'edit' && quiz) {
      const extractedCourseId = quiz.course && typeof quiz.course === 'object' ? quiz.course._id : quiz.course;
      setQuizForm({
        title: quiz.title || '',
        course: extractedCourseId || '',
        description: quiz.description || '',
        passingPercentage: quiz.passingPercentage ?? 70,
        questionsPerPage: quiz.questionsPerPage ?? 1,
        duration: quiz.duration ?? 30,
        maxAttempts: quiz.maxAttempts ?? 3,
        questions: quiz.questions || []
      });
      setQuizModal({ open: true, mode: 'edit', id: quiz._id });
    } else {
      setQuizForm({
        title: '',
        course: courses[0]?._id || '',
        description: '',
        passingPercentage: 70,
        questionsPerPage: 1,
        duration: 30,
        maxAttempts: 3, 
        questions: [generateDefaultQuestion()]
      });
      setQuizModal({ open: true, mode: 'create', id: null });
    }
  };

  const handleQuizSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      if (quizModal.mode === 'edit') {
        await API.put(`/admin/quizzes/${quizModal.id}`, quizForm, { _skipGlobalLoading: true });
        triggerAlert("Quiz verification logic catalog updated successfully!");
      } else {
        await API.post('/admin/quizzes', quizForm, { _skipGlobalLoading: true });
        triggerAlert("Advanced structured evaluation panel provisioned!");
      }
      setQuizModal({ open: false, mode: 'create', id: null });
      fetchQuizzes();
    } catch (err) {
      triggerAlert(err.response?.data?.error || "Quiz configuration parameters failed integrity checks", "error");
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm("Are you sure you want to drop this assessment node? Student data records will clear.")) return;
    try {
      await API.delete(`/admin/quizzes/${id}`, { _skipGlobalLoading: true });
      triggerAlert("Quiz structural components dropped completely.");
      fetchQuizzes();
    } catch (err) {
      triggerAlert("Failed to clear validation index tree maps", "error");
    }
  };

  const handleDeleteOption = (qIndex, oIndex) => {
    const updatedQuestions = [...quizForm.questions];
    const targetQuestion = updatedQuestions[qIndex];
    
    if (targetQuestion.options.length <= 2) {
      triggerAlert("An assessment query requires a baseline constraint minimum of 2 alternate choice arrays.", "error");
      return;
    }

    targetQuestion.options.splice(oIndex, 1);

    if (targetQuestion.correctOptionIndex >= targetQuestion.options.length) {
      targetQuestion.correctOptionIndex = targetQuestion.options.length - 1;
    } else if (targetQuestion.correctOptionIndex === oIndex) {
      targetQuestion.correctOptionIndex = 0;
    }

    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const handleDeleteQuestion = (qIndex) => {
    if (quizForm.questions.length <= 1) {
      triggerAlert("The assessment structural blueprint must retain at least 1 functional question block.", "error");
      return;
    }
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions.splice(qIndex, 1);
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 relative">
      
      {/* Notifications Node */}
      {alert.show && (
        <div className="fixed top-6 right-6 z-50 animate-bounce shadow-2xl max-w-sm w-full rounded-xl border p-4 flex items-start space-x-3 bg-white border-l-4"
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
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 mb-6 space-x-4">
          <button onClick={() => setActiveTab('manage')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'manage' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Manage Quizzes
          </button>
          {selectedQuizAnalytics && (
            <button onClick={() => setActiveTab('analytics')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Telemetry Metrics: {selectedQuizAnalytics.quizTitle}
            </button>
          )}
        </div>

        {activeTab === 'manage' ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Assessments Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Configure multimedia evaluation components, criteria controls, and student check matrices.</p>
              </div>
              <button onClick={() => openQuizModal('create')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                + Design Advanced Quiz
              </button>
            </div>

            {/* --- ADVANCED SEARCH & FILTER PANEL --- */}
            <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Search Assessments</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by quiz title or syllabus details..."
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-xs">
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full md:w-64">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filter by Course Track</label>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Course Modules</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 font-medium text-gray-500 animate-pulse">Synchronizing database execution context pipes...</div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
                <p className="text-gray-500 font-medium">No quiz configurations match the search queries.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Quiz Title</th>
                        <th className="px-6 py-4">Course Name </th>
                        <th className="px-6 py-4">Constraints Framework</th>
                        <th className="px-6 py-4">Number of Questions</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                      {filteredQuizzes.map((quiz) => (
                        <tr key={quiz._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            <div>{quiz.title}</div>
                            {quiz.description && <span className="text-xs font-normal text-gray-400 line-clamp-1">{quiz.description}</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {quiz.course && typeof quiz.course === 'object' 
                              ? quiz.course.title 
                              : (courses.find(c => c._id === quiz.course)?.title || "Detached Module Pipeline")}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 space-y-0.5">
                            <div>⏱️ Time Limit: <span className="font-bold text-gray-700">{quiz.duration ?? 30} mins</span></div>
                            <div>🎯 Pass Mark: <span className="font-bold text-gray-700">{quiz.passingPercentage ?? 70}%</span></div>
                            <div>📄 View Layout: <span className="font-bold text-gray-700">{quiz.questionsPerPage ?? 1} Q/Page</span></div>
                            <div className="text-indigo-600">🔁 Max Attempts: <span className="font-extrabold">{quiz.maxAttempts ?? 3} Allowed</span></div>
                          </td>
                          <td className="px-6 py-4 font-medium text-indigo-600">{quiz.questions?.length || 0} Questions</td>
                          <td className="px-6 py-4 text-right space-x-3.5 whitespace-nowrap">
                            <button onClick={() => fetchQuizAnalytics(quiz._id)} className="text-emerald-600 hover:text-emerald-900 font-medium">Analysis</button>
                            <button onClick={() => openQuizModal('edit', quiz)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit </button>
                            <button onClick={() => handleDeleteQuiz(quiz._id)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          /* --- STUDENT PROGRESS METRICS COMPONENT VIEW --- */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedQuizAnalytics?.quizTitle} Completion Telemetry</h2>
                <p className="text-sm text-gray-500">Live summary indices aggregation compiled from interactive database submission states.</p>
              </div>
              <button onClick={() => { setSelectedQuizAnalytics(null); setActiveTab('manage'); }} className="px-3  py-1.5 border border-gray-300 hover:bg-gray-100 rounded-lg text-xs font-semibold">
                ← Back
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 border rounded-xl shadow-sm text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Submissions</span>
                <p className="text-2xl font-black text-gray-800 mt-1">{selectedQuizAnalytics?.summary?.totalAttempts || 0}</p>
              </div>
              <div className="bg-white p-4 border rounded-xl shadow-sm text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Midpoint</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{selectedQuizAnalytics?.summary?.averageScore?.toFixed(1) || 0}%</p>
              </div>
              <div className="bg-white p-4 border rounded-xl shadow-sm text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ceiling</span>
                <p className="text-2xl font-black text-indigo-600 mt-1">{selectedQuizAnalytics?.summary?.highestScore || 0}%</p>
              </div>
              <div className="bg-white p-4 border rounded-xl shadow-sm text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Floor</span>
                <p className="text-2xl font-black text-rose-600 mt-1">{selectedQuizAnalytics?.summary?.lowestScore || 0}%</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Student Profile</th>
                    <th className="px-6 py-4">Communications Channel</th>
                    <th className="px-6 py-4 text-center">Raw Index Matrix</th>
                    <th className="px-6 py-4 text-center">Performance Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                  {selectedQuizAnalytics?.students?.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{row.studentId?.name || "Anonymous Scholar"}</td>
                      <td className="px-6 py-4 text-gray-500">{row.studentId?.email || "N/A"}</td>
                      <td className="px-6 py-4 text-center font-mono text-gray-600">{row.score} / {row.totalQuestions}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${row.percentage >= (selectedQuizAnalytics?.passingPercentage || 70) ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {row.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL: BUILD AND MODIFY ASSESSMENT FIELDS --- */}
      {quizModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto my-8 relative">
            
            {/* Modal Form Wrap */}
            <form onSubmit={handleQuizSubmit} className="space-y-5 text-left">
              
              {/* Modal Dynamic Sticky Top Action Bar */}
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xl font-bold text-gray-900">
                  {quizModal.mode === 'edit' ? 'Modify Quiz Fields Schema' : 'Draft Advanced Multimedia Quiz'}
                </h3>
                <div className="flex items-center space-x-2">
                  <button 
                    type="button" 
                    onClick={() => setQuizModal({ open: false, mode: 'create', id: null })} 
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Primary Settings Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-gray-600 uppercase">Assessment Identification Header</div>
                  <input type="text" required value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} className="w-full mt-1 border border-gray-300 p-2 rounded-md outline-none text-sm" placeholder="e.g., CapCut Core Evaluation" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-600 uppercase">Course Module Scope Connection</div>
                  <select value={quizForm.course} required onChange={e => setQuizForm({ ...quizForm, course: e.target.value })} className="w-full mt-1 border border-gray-300 p-2 rounded-md bg-white outline-none text-sm">
                    <option value="" disabled>-- Select Dashboard Track Mapping --</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
              </div>

              {/* Execution Criteria Parameters Matrix */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-indigo-900 uppercase block">Passing Mark (%)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    required 
                    value={quizForm.passingPercentage} 
                    onChange={e => setQuizForm({ ...quizForm, passingPercentage: Number(e.target.value) })} 
                    className="w-full mt-1 border border-gray-300 p-2 rounded-md bg-white text-sm outline-none font-semibold text-gray-800"
                    placeholder="70"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-indigo-900 uppercase block">Questions / Slide</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={quizForm.questionsPerPage} 
                    onChange={e => setQuizForm({ ...quizForm, questionsPerPage: Number(e.target.value) })} 
                    className="w-full mt-1 border border-gray-300 p-2 rounded-md bg-white text-sm outline-none font-semibold text-gray-800"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-indigo-900 uppercase block">Duration (Minutes)</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={quizForm.duration} 
                    onChange={e => setQuizForm({ ...quizForm, duration: Number(e.target.value) })} 
                    className="w-full mt-1 border border-gray-300 p-2 rounded-md bg-white text-sm outline-none font-semibold text-gray-800"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-indigo-900 uppercase block">Allowed Attempts</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={quizForm.maxAttempts} 
                    onChange={e => setQuizForm({ ...quizForm, maxAttempts: Number(e.target.value) })} 
                    className="w-full mt-1 border border-indigo-300 p-2 rounded-md bg-white text-sm outline-none font-black text-indigo-700 shadow-inner focus:border-indigo-500"
                    placeholder="3"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-600 uppercase">Description Scope Summary</div>
                <textarea rows="1" value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} className="w-full mt-1 border border-gray-300 p-2 rounded-md outline-none text-sm" placeholder="Syllabus target parameters..."></textarea>
              </div>

              {/* Dynamic Questions Map Stack */}
              <div className="space-y-6 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-gray-700">Structured Questions Pipeline</h4>
                </div>
                
                {quizForm.questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 border rounded-xl bg-gray-50/50 relative space-y-3 border-gray-200">
                    
                    {/* Top Panel to Remove the entire Question block Node */}
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-indigo-600 uppercase">Question Element String {qIndex + 1}</div>
                      {quizForm.questions.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleDeleteQuestion(qIndex)} 
                          className="text-xs text-red-500 font-bold hover:text-red-700 transition-colors px-2 py-0.5 border border-red-200 hover:border-red-400 bg-red-50 rounded"
                        >
                          ✕ Remove Question Block {qIndex + 1}
                        </button>
                      )}
                    </div>

                    <div>
                      <input type="text" required value={q.questionText} onChange={e => {
                        const updated = [...quizForm.questions]; updated[qIndex].questionText = e.target.value; setQuizForm({ ...quizForm, questions: updated });
                      }} className="w-full mt-1 border border-gray-300 p-2 rounded-md bg-white outline-none text-sm" placeholder="Enter target dynamic query..." />
                    </div>

                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase block mb-1">Question Graphical Asset (Cloudinary Reference)</div>
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, qIndex)} className="text-xs text-gray-500" />
                      {q.questionImage && <img src={q.questionImage} alt="Embedded" className="mt-2 h-20 rounded border object-cover" />}
                    </div>

                    {/* Choices Variant Stack Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="p-3 border rounded-md bg-white space-y-2 shadow-sm relative group">
                          <button 
                            type="button" 
                            onClick={() => handleDeleteOption(qIndex, oIndex)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 font-bold text-xs transition-colors p-1"
                            title="Purge Option Node"
                          >
                            ✕
                          </button>

                          <div className="text-[10px] font-bold text-gray-400 uppercase pr-4">Choice option {oIndex + 1}</div>
                          <input type="text" required value={opt.text} onChange={e => {
                            const updated = [...quizForm.questions]; updated[qIndex].options[oIndex].text = e.target.value; setQuizForm({ ...quizForm, questions: updated });
                          }} className="w-full p-1.5 border border-gray-200 rounded text-xs outline-none" placeholder="Choice option text..." />
                          <input type="file" accept="image/*" onChange={e => handleImageUpload(e, qIndex, oIndex)} className="block text-[10px] text-gray-400" />
                          {opt.imageURL && <img src={opt.imageURL} alt="Variant Vector" className="h-12 rounded border object-cover" />}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button type="button" onClick={() => {
                        const updated = [...quizForm.questions]; updated[qIndex].options.push({ text: '', imageURL: '' }); setQuizForm({ ...quizForm, questions: updated });
                      }} className="text-xs text-indigo-600 font-bold hover:underline">+ Add Alternative Vector</button>

                      <div className="flex items-center space-x-2">
                        <div className="text-xs font-bold text-gray-500 uppercase">Correct Answer Target Index:</div>
                        <select value={q.correctOptionIndex} onChange={e => {
                          const updated = [...quizForm.questions]; updated[qIndex].correctOptionIndex = Number(e.target.value); setQuizForm({ ...quizForm, questions: updated });
                        }} className="border p-1 rounded bg-white text-xs font-bold outline-none">
                          {q.options.map((_, idx) => <option key={idx} value={idx}>Choice {idx + 1}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Footer Action Nodes */}
              <div className="flex justify-between items-center border-t pt-4">
                <button type="button" onClick={() => setQuizForm({ ...quizForm, questions: [...quizForm.questions, generateDefaultQuestion()] })} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-bold text-gray-700 transition-colors">
                  + Append Question Block Node
                </button>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setQuizModal({ open: false, mode: 'create', id: null })} className="px-4 py-2 border rounded-md text-sm text-gray-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">Commit Structural Fields</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Quizzes;