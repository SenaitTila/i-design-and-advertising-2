import React, { useState, useEffect } from 'react';
import API from '../../api/authApi';

const Profile = () => {
  const [profile, setProfile] = useState({ name: '', email: '', role: '' });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 🎯 Updates the browser tab title when the profile component mounts
  useEffect(() => {
    document.title = "Profile | I Design & Advertising";
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/auth/me'); // Hits auth extraction parsing block
        setProfile({
          name: data.data.name || '',
          email: data.data.email || '',
          role: data.data.role || 'student'
        });
      } catch (err) {
        console.error("Error reading token identity context:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setMessage({ type: '', text: '' });
      
      const { data } = await API.put('/auth/updatedetails', {
        name: profile.name,
        email: profile.email
      });

      setProfile(prev => ({ ...prev, name: data.data.name, email: data.data.email }));
      setMessage({ type: 'success', text: 'Profile changes updated cleanly!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to modify profile.' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
    
      <main className="flex-grow py-12 px-4 max-w-xl mx-auto w-full">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
            <p className="text-xs text-gray-500 mt-1">Review your contact data parameters or update account registrations.</p>
          </div>

          {loading ? (
            <div className="text-center py-10 font-medium text-gray-500 animate-pulse">Querying membership node...</div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
              {message.text && (
                <div className={`p-3 text-xs font-semibold rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">System Clearance Role</label>
                <input 
                  type="text" 
                  disabled 
                  value={profile.role} 
                  className="w-full mt-1 border border-gray-200 p-2 rounded-md outline-none bg-gray-50 text-gray-400 capitalize font-medium cursor-not-allowed text-sm" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={profile.name} 
                  onChange={e => setProfile({ ...profile, name: e.target.value })} 
                  className="w-full mt-1 border border-gray-300 p-2 rounded-md outline-none text-sm focus:border-indigo-500" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={profile.email} 
                  onChange={e => setProfile({ ...profile, email: e.target.value })} 
                  className="w-full mt-1 border border-gray-300 p-2 rounded-md outline-none text-sm focus:border-indigo-500" 
                />
              </div>

              <button 
                type="submit" 
                disabled={updating}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm disabled:bg-indigo-400"
              >
                {updating ? 'Saving changes...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      </main>
       
    </div>
  );
};

export default Profile;