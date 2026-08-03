// src/pages/student/Certificates.jsx
import React, { useState, useEffect } from 'react';
import { Award, ExternalLink, Calendar, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../../api/authApi'; // 🚀 Switched to your unified API client

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🎯 Updates the browser tab title when the certificates component mounts
  useEffect(() => {
    document.title = "Certificates | I Design & Advertising";
  }, []);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        // Updated to use the base API routing architecture
        const res = await API.get('/student/certificates');
        setCertificates(res.data.data || []);
      } catch (err) {
        console.error('Error fetching certificates data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  return (
    <div className="space-y-8 w-full text-left">
      {/* 💻 MAIN COMPONENT HEADER SECTION */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Achievements & Certificates
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review, download, and share the official credentials you have earned at Creative Academy.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 font-mono text-sm text-gray-500 animate-pulse">
          Retrieving your graduation credentials...
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500 mb-4">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">No certificates available yet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Complete your enrolled courses and clear their final requirements to unlock your verification matrices.
          </p>
          <Link 
            to="/student/catalog" 
            className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            Browse Catalog
          </Link>
        </div>
      ) : (
        /* Verified Certificate Ledger Cards Grid Box Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div 
              key={cert._id} 
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col group hover:shadow-md transition-shadow duration-200"
            >
              {/* Header Badge Decoration */}
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[11px] font-bold tracking-wider uppercase">Verified Credential</span>
                </div>
                <Award className="w-4 h-4 text-indigo-500" />
              </div>

              {/* Main Body Details */}
              <div className="p-5 flex-1 space-y-3">
                <h3 className="font-bold text-base text-gray-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                  {cert.courseId?.title || 'Course Completion Certificate'}
                </h3>
                
                <div className="flex items-center text-xs text-gray-500 space-x-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Issued: {new Date(cert.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                
                <p 
                  className="text-[10px] font-mono text-gray-400 truncate bg-gray-50 p-1.5 rounded-sm select-all" 
                  title="Click to select UUID token"
                >
                  ID: {cert.certificateId}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-end">
                <Link
                  to={`/verify/certificate/${cert.certificateId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors border border-indigo-100/40"
                >
                  <span>View Certificate</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;