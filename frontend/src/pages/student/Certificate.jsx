// C:\creative-academy\src\pages\student\Certificate.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Download, ArrowLeft, RefreshCw } from 'lucide-react';
import API from '../../api/authApi'; 

const Certificate = () => {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [downloading, setDownloading] = useState(false);
  
  // Keep track of the active object URL to clean it up properly
  const objectUrlRef = useRef(null);

  useEffect(() => {
    document.title = "Verified Credential | I Design & Advertising";
  }, []);

  const fetchCertificateBlob = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const response = await API.get(
        `/student/verify-credentials/${certId}/download`,
        { responseType: 'blob' }
      );
      
      // Ensure we get a valid blob even if the interceptor unwraps data
      const blob = response instanceof Blob ? response : new Blob([response.data], { type: 'application/pdf' });
      
      if (blob.size === 0) {
        throw new Error("Received empty data stream from server.");
      }

      // Revoke previous object URL if it exists
      if (objectUrlRef.current) {
        window.URL.revokeObjectURL(objectUrlRef.current);
      }

      const objectUrl = window.URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      setPdfUrl(objectUrl);
    } catch (err) {
      console.error("❌ Failed to stream native certificate layout:", err);
      setErrorMsg("Unable to render the official document blueprint preview.");
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (certId) {
      fetchCertificateBlob();
    }
    
    // Cleanup generated object URL on component unmount
    return () => {
      if (objectUrlRef.current) {
        window.URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [certId]);

  const handleDownloadPDF = () => {
    if (!pdfUrl) return;
    setDownloading(true);
    
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.setAttribute('download', `Certificate-${certId.toUpperCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Download processing failure:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-semibold tracking-wide">Syncing Print Layout Engine...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-center font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-base font-bold text-slate-200 mt-2">Verification Error</h2>
          <p className="text-xs text-red-400 mt-2 font-medium bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
            {errorMsg}
          </p>
          <div className="mt-5 flex items-center justify-center gap-4">
            <button onClick={() => navigate(-1)} className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Go Back
            </button>
            <button onClick={fetchCertificateBlob} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Retry Layout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 font-sans antialiased">
      
      {/* 🔐 PLATFORM VERIFICATION BAR */}
      <div className="w-full max-w-4xl mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs px-2">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Verified Certificate ID: {certId}</span>
        </div>
      </div>

      {/* 📜 REAL-TIME UNIFIED IFRAME VIEWPORT */}
      <div className="w-full max-w-4xl aspect-[1.414/1] bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden relative group">
        {pdfUrl && (
          <iframe 
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            title="Official Certificate Verification Frame"
            className="w-full h-full border-none rounded-lg"
            style={{ colorScheme: 'normal' }}
          />
        )}
      </div>

      {/* 📥 USER INTERACTION PANEL */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
        <button 
          onClick={() => navigate('/student/dashboard')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard Console
        </button>

        <button 
          onClick={handleDownloadPDF} 
          disabled={downloading} 
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {downloading ? "Saving copy..." : "Download Original PDF Copy"}
        </button>
      </div>

    </div>
  );
};

export default Certificate;