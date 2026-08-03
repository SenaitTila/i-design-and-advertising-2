// C:\creative-academy\src\pages\admin\Enrollments.jsx
import React, { useState, useEffect } from 'react';
// 🚀 Custom Axios instance configured with base URL and credentials
import API from '../../api/authApi'; 


const Enrollments = () => {
  // 1. Initialize state as an empty array since data will come from the backend
  const [enrollments, setEnrollments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Fetch enrollment logs automatically when the component mounts
  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/enrollments');
      
      // Your backend structure sends data wrapped inside { success: true, data: [...] }
      setEnrollments(response.data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch real-time enrollment records.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handler to interact with your DELETE router
  const handleRevokeAccess = async (id) => {
    if (window.confirm(`Are you sure you want to permanently revoke access for enrollment ${id}?`)) {
      try {
        await API.delete(`/admin/enrollments/${id}`);
        
        // Update local UI state dynamically only after successful backend deletion
        setEnrollments(prev => prev.filter(item => item._id !== id));
      } catch (err) {
        alert('Could not revoke access. Please check permissions or server status.');
        console.error('Error deleting enrollment:', err);
      }
    }
  };

  // 4. Dynamic local filter updated to handle your exact schema keys safely
  const filteredEnrollments = enrollments.filter(item => {
    const studentName = item.user?.name || '';
    const courseTitle = item.course?.title || '';
    const enrollmentId = item._id || '';

    return (
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollmentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
   
      <main className="flex-grow py-8 px-4 max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Enrollments</h1>
            <p className="text-sm text-gray-500 mt-1">Audit student entry records, billing transactions, and progress terms.</p>
          </div>
          
          {/* Dynamic Search Input UI */}
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search student, ID, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Loading and Error Feedback Blocks */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-500 text-sm font-medium">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
            Syncing live database registries...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl text-center text-sm font-medium">
            {error}
          </div>
        ) : (
          /* Live Ledger Table */
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Enrollment ID</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Target Course Program</th>
                    <th className="px-6 py-4">Registration Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                  {filteredEnrollments.length > 0 ? (
                    filteredEnrollments.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        {/* Maps MongoDB '_id' safely */}
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 truncate max-w-[120px]">
                          {item._id}
                        </td>
                        {/* 🔥 Updated path from item.student to item.user */}
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {item.user?.name || <span className="text-gray-400 italic">User Reference Missing</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.course?.title || <span className="text-gray-400 italic">Course Reference Missing</span>}
                        </td>
                        {/* 🔥 Updated path from item.date to item.enrolledAt */}
                        <td className="px-6 py-4 text-gray-500">
                          {item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString() : 'N/A'}
                        </td>
                        {/* Dynamic status chip colors based on your Enum array ["active", "expired"] */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                            item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleRevokeAccess(item._id)}
                            className="text-red-600 hover:text-red-900 font-medium text-xs bg-red-50 hover:bg-red-100/70 px-2.5 py-1.5 rounded border border-red-200 transition-colors focus:outline-none cursor-pointer"
                          >
                            Revoke Access
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-400">
                        No active matching enrollment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      
    </div>
  );
};

export default Enrollments;