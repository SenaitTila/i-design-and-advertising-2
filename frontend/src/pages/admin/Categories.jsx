import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/authApi';

// Centralized API Domain Root Address
const BACKEND_BASE_URL = "http://localhost:5000";

// Fallback high-quality placeholder image for graphic/video catalogs
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, mode: 'create', id: null });
  const [form, setForm] = useState({ name: '', description: '', status: 'Active' });
  
  // File upload specific layout management states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/categories', { _skipGlobalLoading: true });
      setCategories(data.data || []);
    } catch (err) {
      console.error("Failed fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCategories(); 
    // Clean up dynamic object URLs on unmount to avoid temporary memory leaks
    return () => { if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // Helper function to resolve dynamic cover asset paths correctly
  const resolveImageSrc = (path) => {
    if (!path) return FALLBACK_IMAGE;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
      return path;
    }
    return `${BACKEND_BASE_URL}${path}`;
  };

  const openModal = (mode, cat = null) => {
    setSelectedFile(null);
    if (mode === 'edit' && cat) {
      setForm({ name: cat.name, description: cat.description || '', status: cat.status });
      setPreviewUrl(resolveImageSrc(cat.thumbnailUrl));
      setModal({ open: true, mode: 'edit', id: cat._id });
    } else {
      setForm({ name: '', description: '', status: 'Active' });
      setPreviewUrl('');
      setModal({ open: true, mode: 'create', id: null });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reject assets larger than 5MB safely at client runtime border profiles
    if (file.size > 5 * 1024 * 1024) {
      alert("Asset file boundary constraint exception: Size cannot exceed 5MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('status', form.status);
      
      if (selectedFile) {
        formData.append('thumbnail', selectedFile);
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        _skipGlobalLoading: true
      };

      if (modal.mode === 'edit') {
        await API.put(`/admin/categories/${modal.id}`, formData, config);
      } else {
        await API.post('/admin/categories', formData, config);
      }
      
      setModal({ open: false, mode: 'create', id: null });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || "Action failed to parse validation criteria");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete category branch? Existing courses will lose reference constraints.")) return;
    try {
      await API.delete(`/admin/categories/${id}`, { _skipGlobalLoading: true });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || "Delete lifecycle validation failure");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Panel Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Parent Category Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">Initialize top-tier segments like Graphic Design, Video Editing, & Layout parameters.</p>
        </div>
        <button onClick={() => openModal('create')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition active:scale-95 shadow-sm whitespace-nowrap">
          + Add New Category
        </button>
      </div>

      {/* Main Core View Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500">Querying live database framework matrices...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center bg-white border border-dashed border-gray-300 rounded-xl py-16 px-4">
          <p className="text-gray-500 font-medium text-sm">No functional category nodes found initialized in the current layer schema.</p>
          <button onClick={() => openModal('create')} className="mt-3 text-sm text-indigo-600 font-semibold hover:text-indigo-800">&rarr; Inject baseline model node now</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Visual Cover</th>
                <th className="px-6 py-4">Category Name</th>
                <th className="px-6 py-4">Description Context</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions Matrix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-gray-50/40 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img 
                      src={resolveImageSrc(cat.thumbnailUrl)} 
                      alt={cat.name} 
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm transition group-hover:scale-105"
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{cat.name}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{cat.description || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${cat.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {cat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap space-x-4">
                    <button onClick={() => openModal('edit', cat)} className="text-indigo-600 hover:text-indigo-900 font-semibold transition">Edit</button>
                    <button onClick={() => handleDelete(cat._id)} className="text-red-600 hover:text-red-900 font-semibold transition">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DYNAMIC FORM MODAL WINDOW */}
      {modal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100 flex flex-col max-h-[90vh] overflow-y-auto space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                {modal.mode === 'edit' ? 'Modify Category Node Parameters' : 'Construct New Category Node'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Configure storage identities, layouts, and scope visibility flags securely.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-left flex-grow">
              {/* Image Drag and Drop Block */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Cover Thumbnail Node</label>
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-gray-50 hover:bg-indigo-50/20 transition group relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]"
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  
                  {previewUrl ? (
                    <div className="absolute inset-0 w-full h-full bg-gray-100">
                      <img src={previewUrl} alt="Payload preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs text-white font-medium">
                        Change File Image Asset
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-indigo-500 transition" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V24M28 8l12 12M28 8v12h12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-xs font-semibold text-gray-600">Click to upload physical file stream</p>
                      <p className="text-[10px] text-gray-400">PNG, JPG up to 5MB (Uses default fallback if skipped)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Category Structural Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1.5 border border-gray-300 focus:border-indigo-500 p-2.5 rounded-lg text-sm outline-none transition bg-white" placeholder="e.g., Video Editing Pro" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Description Context Block</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full mt-1.5 border border-gray-300 focus:border-indigo-500 p-2.5 rounded-lg text-sm outline-none h-20 resize-none transition bg-white" placeholder="Summarize catalog pipeline topics..." />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Visibility Status Flag</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full mt-1.5 border border-gray-300 focus:border-indigo-500 p-2.5 rounded-lg text-sm outline-none bg-white transition cursor-pointer">
                  <option value="Active">Active </option>
                  <option value="Draft">Draft </option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button type="button" disabled={submitLoading} onClick={() => setModal({open: false, mode: 'create', id: null})} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50 transition disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={submitLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center justify-center min-w-[110px] disabled:opacity-50">
                  {submitLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;