
// src/pages/admin/Dashboard.jsx
import {
  FaFolder,
  FaBook,
  FaVideo,
  FaQuestionCircle,
  FaKey,
  FaUserGraduate,
  FaUsers
} from "react-icons/fa";
import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';

const Dashboard = () => {
  // Grab the master sections configuration array passed through the outlet context
  // Provide an immediate empty array fallback fallback mapping safety
 const { sections = [] } = useOutletContext();

  // Inject structural descriptions back to dashboard grid indicators locally
  const descriptions = {
  "Parent Categories":
    "Initialize and structure categories like Video Editing, Graphics, and Design.",

  "Video Courses":
    "Manage course catalogs, pricing, and publishing.",

  "Syllabus & Lessons":
    "Upload videos and organize lessons for each course.",

  "Interactive Quizzes":
    "Create quizzes and monitor student performance.",

  "Access Key Tokens":
    "Generate and manage course access codes.",

  "Student Access":
    "Monitor student enrollments and learning progress.",

  "User Identities":
    "Manage students, instructors, and administrators."
};
const counts = {
  'Parent Categories': 'Category Nodes',
  'Video Courses': 'Active Catalogs',
  'Syllabus & Lessons': 'Media Elements',
  'Interactive Quizzes': 'Evaluation Pools',
  'Access Key Tokens': 'Voucher Logs',
  'Student Access': 'Active Ledgers',
  'User Identities': 'System Members'
};

const icons = {
  "Parent Categories": <FaFolder className="text-4xl text-blue-600 mb-5" />,
  "Video Courses": <FaBook className="text-5xl text-blue-600 mb-5" />,
  "Syllabus & Lessons": <FaVideo className="text-5xl text-blue-600 mb-5" />,
  "Interactive Quizzes": <FaQuestionCircle className="text-5xl text-blue-600 mb-5" />,
  "Access Key Tokens": <FaKey className="text-5xl text-blue-600 mb-5" />,
  "Student Access": <FaUserGraduate className="text-5xl text-blue-600 mb-5" />,
  "User Identities": <FaUsers className="text-5xl text-blue-600 mb-5" />,
};



  return (
  
   <div className="space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-sm w-full">
      <div className="text-left">
        {/* Admin center identity tag changed to administrative dark/red status styling */}
      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 mb-4">
  i Design & Advertising Administration
</span>
<h1
  className="text-5xl font-extrabold text-blue-900"
>
  Welcome Back, Admin 👋
</h1>
<p className="mt-1.5 text-gray-600 text-sm max-w-2xl">
  Manage your courses, students, lessons, quizzes and access codes from one place.
</p>
      </div>
      
      <hr className="border-blue-400/30" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Optional chaining (?.) completely prevents crashes during cold-starts or state loads */}
        {sections?.map((sec, idx) => (
          <Link 
            key={idx} 
            to={sec.path} 
           className={`bg-white p-6 rounded-xl shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-300 flex flex-col justify-between group`}
          >
            <div>
              {/* Removed explicit indigo hover class so dynamic layout borders take precedence */}
                {icons[sec.title]}
              <h3 className="text-xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
                {sec.title}
              </h3>
              <p className="text-sm text-gray-600 mt-4 leading-7">
               <>
  {descriptions[sec.title]}
  {sec.desc}
</>
              </p>
            </div>
            
            {/* Standardized admin navigation links text coloring */}
            <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between items-center text-sm font-semibold text-blue-700 group-hover:text-blue-900 transition-colors">
              <span>{counts[sec.title] || 'Items'}</span>
              <span className="group-hover:translate-x-1 transition-transform text-sm">&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;