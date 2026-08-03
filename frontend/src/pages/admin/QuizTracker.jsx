// src/components/admin/QuizTracker.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api/authApi';

export default function QuizTracker({ quizId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;
    fetchQuizAnalytics();
  }, [quizId]);

  const fetchQuizAnalytics = async () => {
    try {
      setLoading(true);

      // 🕵️ Pipeline Request Matrix: Fetch analytics profile targeted by individual quiz context node
      const res = await API.get(`/admin/quiz-analytics/${quizId}`);

      // 🔍 DEBUG WINDOW LOGGING — Check your browser developer console!
      console.log('--- QUIZ TRACKER METRICS PACK ---');
      console.log('Raw Analytics Response Structure:', res.data);

      // Deep unpack checks matching your standard data envelope wrapper patterns
      const unpackedData = res.data?.data || res.data || null;
      setData(unpackedData);
    } catch (err) {
      console.error("Critical failure populating quiz operational tracker metrics:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-sm font-mono text-gray-500 animate-pulse">Syncing metric payloads...</div>;
  }

  // Handle fallback structural modeling when payload variables evaluate to empty states
  const summary = data?.summary || { totalAttempts: 0, averageScore: 0, highestScore: 0, lowestScore: 0 };
  const studentsList = Array.isArray(data?.students) ? data.students : [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-left">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Metrics Tracking Portal</h3>
          <p className="text-xs text-gray-500 mt-0.5">Audit student runtime execution profiles, pass-fail variables, and global cohort grading bands.</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-indigo-50 font-mono text-indigo-600 rounded border border-indigo-100 uppercase tracking-wide">
          Tracking ID: {quizId}
        </span>
      </div>
      
      {/* Summary Score Analytics Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xs text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Entries</span>
          <p className="text-2xl font-black text-gray-800">{summary.totalAttempts}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xs text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Average Score</span>
          <p className="text-2xl font-black text-emerald-600">
            {typeof summary.averageScore === 'number' ? summary.averageScore.toFixed(1) : 0}%
          </p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xs text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Peak</span>
          <p className="text-2xl font-black text-blue-600">{summary.highestScore}%</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xs text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Floor</span>
          <p className="text-2xl font-black text-rose-600">{summary.lowestScore}%</p>
        </div>
      </div>

      {/* Historical Student Attempt Ledger */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Evaluation Registry</span>
          <span className="text-[10px] font-mono text-gray-400 bg-white px-2 py-0.5 border rounded">
            Total Logs: {studentsList.length}
          </span>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/20 border-b border-gray-100 text-xs font-bold uppercase text-gray-400 tracking-wider">
            <tr>
              <th className="p-4">Student Name</th>
              <th className="p-4">Email Address</th>
              <th className="p-4 text-center">Score Profile</th>
              <th className="p-4 text-center">Grade Rating</th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium text-gray-700 divide-y divide-gray-100">
            {studentsList.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400 italic font-normal">
                  No execution attempts captured inside this training node index matrix yet.
                </td>
              </tr>
            ) : (
              studentsList.map((stu) => {
                const targetPercentage = stu.percentage !== undefined ? stu.percentage : 0;
                const scoreId = stu._id || stu.id || Math.random().toString();
                
                return (
                  <tr key={scoreId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-gray-900 font-bold">{stu.studentName || 'Anonymous Student'}</td>
                    <td className="p-4 text-gray-500 font-normal">{stu.studentEmail || 'N/A'}</td>
                    <td className="p-4 text-center font-mono text-gray-600 text-xs">
                      {stu.score} / {stu.totalQuestions}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${
                        targetPercentage >= 75 
                          ? 'bg-green-50 text-green-700 border-green-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {targetPercentage}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}