// C:\creative-academy\src\pages\student\Certificate.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const Certificate = () => {
  const { certId } = useParams();
  const navigate = useNavigate();
  const certificateRef = useRef(null);

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [downloading, setDownloading] = useState(false);
  
  // Cache the link string in a dedicated state variable to prevent canvas evaluation loops
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
    
    const verifyDocument = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        console.log(`📡 Fetching Public Certificate Verification Data for: ${certId}`);
        
        // Use direct axios to hit your local backend port safely
        const response = await axios.get(`http://localhost:5000/api/v1/student/verify-credentials/${certId}`);
        
        console.log("🎯 Backend verification payload returned:", response.data);
        setCertificate(response.data.data);
      } catch (err) {
        console.error("❌ Public verification request failed completely:", err);
        setErrorMsg(err.response?.data?.error || "Unable to reach the verification registry server.");
      } finally {
        setLoading(false); // Guarantees the loader disappears no matter what
      }
    };

    if (certId) {
      verifyDocument();
    } else {
      setLoading(false);
      setErrorMsg("Missing unique certificate credential tracking token identifier.");
    }
  }, [certId]);

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    try {
      setDownloading(true);
      const element = certificateRef.current;
      
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({ 
        orientation: 'landscape', 
        unit: 'px', 
        format: [canvas.width, canvas.height] 
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`creative_academy_certificate_${certId}.pdf`);
    } catch (err) {
      console.error("PDF generation layout engine crash:", err);
      window.print(); 
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Validating Credential Hash...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-lg font-bold text-slate-800 mt-2">Verification Failed</h2>
          <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 p-2 rounded-xl">
            {errorMsg || "This specific tracking credential code is invalid or missing."}
          </p>
          <button onClick={() => navigate('/')} className="mt-4 text-xs font-bold text-indigo-600 block mx-auto hover:underline">
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans antialiased">
      
      {/* Target printable context frame */}
      <div 
        ref={certificateRef} 
        className="max-w-3xl w-full p-12 bg-white border-[12px] border-slate-900 rounded-sm shadow-2xl text-center font-serif relative"
      >
        <div className="absolute top-2 left-2 right-2 bottom-2 border border-slate-200 pointer-events-none" />
        <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-indigo-600 block mb-2">Verified Academic Credential</span>
        
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Creative Academy</h1>
        <div className="w-16 h-0.5 bg-indigo-600 mx-auto my-6" />
        
        <p className="text-slate-500 italic text-xs">This document formally confirms that</p>
        <h2 className="text-3xl font-bold text-slate-900 my-4 font-sans">{certificate.studentId?.name || "Academic Scholar"}</h2>
        
        <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
          has successfully satisfied all testing performance parameters and demonstrated structural field competence in:
        </p>
        <h3 className="font-sans font-extrabold text-indigo-950 text-xl mt-3">{certificate.courseId?.title}</h3>
        
        {/* Isolated string rendering for validation URL */}
        <div className="mt-8 p-2 bg-slate-50 border border-slate-100 rounded-md max-w-sm mx-auto font-sans">
          <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Public Verification Registry URL</span>
          <span className="text-[9px] font-mono text-indigo-600 break-all">{currentUrl}</span>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between text-[10px] font-sans text-slate-400 font-medium">
          <span>SERIAL ID: {certificate.certificateId}</span>
          <span>ISSUED ON: {new Date(certificate.issuedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button 
          onClick={handleDownloadPDF} 
          disabled={downloading} 
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {downloading ? "Compiling PDF Asset..." : "📥 Download Official PDF"}
        </button>
      </div>
    </div>
  );
};

export default Certificate;