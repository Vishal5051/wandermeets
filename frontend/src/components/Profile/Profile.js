import React, { useState, useEffect } from 'react';
import { usersAPI, wavesAPI, bookingAPI, packagesAPI, safetyAPI } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, ShieldCheck, 
  LogOut, Edit3, Calendar, ChevronRight, Star,
  CheckCircle, Shield, Phone, Camera, Mail, X
} from 'lucide-react';
import './Profile.css';
import './EditProfile.css';

function Profile({ user, setUser, userLocation, onLogout }) {
  const [profile, setProfile] = useState(user || null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    full_name: user?.full_name || '', 
    bio: user?.bio || '', 
    home_location: user?.home_location || '', 
    email: user?.email || '', 
    phone_number: user?.phone_number || '' 
  });
  const [loading, setLoading] = useState(!user);
  
  const [activeTab, setActiveTab] = useState('insights');
  const [activities, setActivities] = useState({ hosted: [], attending: [] });
  const [waves, setWaves] = useState({ hosted: [], requested: [] });
  const [bookings, setBookings] = useState([]);
  const [packageBookings, setPackageBookings] = useState([]);
  const [actLoading, setActLoading] = useState(false);

  const [aadhaarStatus, setAadhaarStatus] = useState('unverified');
  // eslint-disable-next-line
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  // eslint-disable-next-line
  const [aadhaarName, setAadhaarName] = useState('');
  // eslint-disable-next-line
  const [aadhaarFile, setAadhaarFile] = useState(null);
  // eslint-disable-next-line
  const [contacts, setContacts] = useState([]);
  // eslint-disable-next-line
  const [submittingAadhaar, setSubmittingAadhaar] = useState(false);
  // eslint-disable-next-line
  const [showContactForm, setShowContactForm] = useState(false);
  // eslint-disable-next-line
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '' });
  // eslint-disable-next-line
  const [otpCode, setOtpCode] = useState('');
  // eslint-disable-next-line
  const [otpSent, setOtpSent] = useState(false);
  // eslint-disable-next-line
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  useEffect(() => { 
    fetchProfile();
    fetchSafetyData();
  }, []); // Run once on mount

  const fetchProfile = async () => {
    try {
      const res = await usersAPI.getProfile();
      const userData = res.data.user;
      setProfile(userData); // Update local state for immediate render
      
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        bio: userData.bio || '',
        home_location: userData.home_location || ''
      });
    } catch (err) { 
      console.error('Profile fetch failed:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchSafetyData = async () => {
    try {
      const statusRes = await safetyAPI.getAadhaarStatus();
      setAadhaarStatus(statusRes.data.status);
      const contactsRes = await safetyAPI.getContacts();
      setContacts(contactsRes.data.contacts);
    } catch (err) { console.error('Error fetching safety data:', err); }
  };

  const fetchUnifiedActivities = async () => {
    try {
      setActLoading(true);
      const [actRes, waveRes, bookRes, pkgRes] = await Promise.all([
        usersAPI.getMyActivities(),
        wavesAPI.getMyWaves(),
        bookingAPI.getMyBookings(),
        packagesAPI.getMyBookings()
      ]);
      setActivities(actRes.data || { hosted: [], attending: [] });
      setWaves(waveRes.data || { hosted: [], requested: [] });
      setBookings(bookRes.data?.bookings || []);
      setPackageBookings(pkgRes.data?.bookings || []);
    } catch (err) { 
        console.error('Error fetching activities:', err); 
    } finally { 
        setActLoading(false); 
        setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'travels') fetchUnifiedActivities();
  }, [activeTab]);

  const handleSaveProfile = async () => {
    try {
      const fd = new FormData();
      Object.keys(formData).forEach(key => fd.append(key, formData[key]));
      const res = await usersAPI.updateProfile(fd);
      const updatedUser = res.data.user;
      setProfile(updatedUser);
      
      // Update global state ONLY when saving changes
      if (setUser) {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      setEditing(false);
      alert('Profile updated!');
    } catch (err) { alert('Failed to update profile'); }
  };

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  if (loading && !profile) return (
    <div className="profile-page-modern">
      <div className="loading-wave"><div className="spinner-modern"></div></div>
    </div>
  );

  const trustScore = profile?.trust_score || 0;

  return (
    <div className="profile-page-modern">
      <div className="profile-layout-container">
        
        {/* LEFT COLUMN: Sidebar Card */}
        <aside className="profile-sidebar">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="sidebar-card-glass"
          >
            <div className="sidebar-header-actions">
              <button className="edit-circle-btn" onClick={() => setEditing(!editing)}>
                {editing ? <CheckCircle size={18} /> : <Edit3 size={18} />}
              </button>
            </div>

            <div className="profile-avatar-section">
              <div className="main-avatar-v2">
                {profile?.profile_photo ? (
                  <img src={profile.profile_photo} alt={profile.full_name} />
                ) : (
                  profile?.full_name?.charAt(0) || user?.full_name?.charAt(0) || 'U'
                )}
                {aadhaarStatus === 'verified' && (
                  <div className="verified-seal">
                    <ShieldCheck size={24} fill="var(--teal)" color="white" />
                  </div>
                )}
              </div>
              <h2>{profile?.full_name || 'Traveler'}</h2>
              <p className="user-handle">@{profile?.username || 'user'}</p>
              
              <div className="sidebar-meta">
                <span className="sidebar-meta-item"><MapPin size={14} /> {profile?.home_location || 'Digital Nomad'}</span>
                <span className="sidebar-meta-item"><Calendar size={14} /> Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, {month:'short', year:'numeric'}) : 'Recently'}</span>
                {profile?.email && (
                  <span className="sidebar-meta-item"><Mail size={14} /> {profile.email}</span>
                )}
                {profile?.phone_number && (
                  <span className="sidebar-meta-item"><Phone size={14} /> {profile.phone_number}</span>
                )}
              </div>
            </div>

            <div className="sidebar-stats-grid">
              <div className="sb-stat">
                <span className="sb-stat-val">{Number(trustScore || 0)}</span>
                <span className="sb-stat-lbl">Trust</span>
              </div>
              <div className="sb-stat">
                <span className="sb-stat-val">{(Number(activities?.hosted?.length) || 0) + (Number(waves?.hosted?.length) || 0)}</span>
                <span className="sb-stat-lbl">Hosted</span>
              </div>
              <div className="sb-stat">
                <span className="sb-stat-val">{profile?.connections_count || 0}</span>
                <span className="sb-stat-lbl">Vibes</span>
              </div>
            </div>

            <nav className="profile-sidebar-nav">
              {[
                { id: 'insights', label: 'Overview', icon: Star },
                { id: 'travels', label: 'Adventures', icon: Navigation },
                { id: 'safety', label: 'Trust & Safety', icon: ShieldCheck }
              ].map(tab => (
                <button 
                  key={tab.id}
                  className={`sb-nav-item ${activeTab === tab.id ? 'active' : ''}`} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="sb-nav-icon"><tab.icon size={18} /></div>
                  <span>{tab.label}</span>
                  <ChevronRight size={14} className="sb-nav-arrow" />
                </button>
              ))}
            </nav>

            <div className="sidebar-bio">
              <h3>Bio</h3>
              <p>{profile?.bio || "Just another WanderMeet exploring the world..."}</p>
            </div>

            <div className="sidebar-actions">
              <button className="btn-modern btn-modern-secondary btn-full" onClick={handleLogoutClick}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </motion.div>
        </aside>

        {/* RIGHT COLUMN: Tabbed Content */}
        <main className="profile-main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="tab-content-panel"
            >
              {activeTab === 'insights' && (
                <>
                  {aadhaarStatus !== 'verified' && (
                    <motion.div whileHover={{ scale: 1.01 }} className="verification-banner-v2" onClick={() => setActiveTab('safety')}>
                      <Shield size={32} />
                      <div className="v-banner-content">
                        <h4>Boost your trust score!</h4>
                        <p>Verified accounts get 3x more host requests. Verify your Aadhaar now.</p>
                      </div>
                      <button className="v-btn-arrow">Verify ➔</button>
                    </motion.div>
                  )}

                  <div className="trust-meter-card">
                    <div className="tm-header">
                       <ShieldCheck size={24} color="var(--teal)" />
                       <div>
                         <h3>Identity Status</h3>
                         <p>Calculated based on your verified credentials</p>
                       </div>
                    </div>
                    <div className="tm-points-list">
                      <div className="tm-point">
                        <span className="tm-point-info">Identity Verification</span>
                        <span className={`tm-point-status ${aadhaarStatus === 'verified' ? 'status-verified' : 'status-missing'}`}>
                          {aadhaarStatus === 'verified' ? 'Verified +40' : 'Missing'}
                        </span>
                      </div>
                      <div className="tm-point">
                        <span className="tm-point-info">Phone Connection</span>
                        <span className={`tm-point-status ${profile?.phone_verified ? 'status-verified' : 'status-missing'}`}>
                          {profile?.phone_verified ? 'Secure +20' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="quick-stats-row">
                    <div className="q-stat-card glass-card">
                      <Star size={20} color="var(--coral)" />
                      <h4>Experiences</h4>
                      <p className="large-val">{(bookings?.length || 0) + (packageBookings?.length || 0)}</p>
                    </div>
                    <div className="q-stat-card glass-card">
                      <Navigation size={20} color="var(--teal)" />
                      <h4>Connections</h4>
                      <p className="large-val">{profile?.connections_count || 0}</p>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'travels' && (
                <div className="travels-tab">
                  {actLoading ? <div className="loading-wave"><div className="spinner-modern"></div></div> : (
                    <div className="unified-timeline">
                      <section className="timeline-section">
                        <h4>Upcoming Adventures</h4>
                        {[...(activities?.hosted || []), ...(activities?.attending || [])].length === 0 ? (
                           <div className="timeline-item">
                             <p>Your journey is just beginning. Host or join an activity to see it here!</p>
                           </div>
                        ) : (
                          [...(activities?.hosted || []), ...(activities?.attending || [])].map((act, i) => (
                            <div key={act.id || i} className="timeline-item">
                               <div className="tl-icon"><Calendar size={20} /></div>
                               <div className="tl-details">
                                  <h5>{act.title || 'Untitled Activity'}</h5>
                                  <p>{act.start_time ? new Date(act.start_time).toLocaleDateString() : 'Date TBD'}</p>
                               </div>
                               <ChevronRight size={16} className="ml-auto opacity-30" />
                            </div>
                          ))
                        )}
                      </section>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'safety' && (
                <div className="safety-tab">
                  <div className="v-card-v2">
                    <div className="v-header">
                      <h3>Security & Privacy</h3>
                      {profile?.phone_verified && <span className="v-badge-done">Secured ✓</span>}
                    </div>
                    <div className="v-grid-v2">
                      <div className={`v-item-v2 ${aadhaarStatus === 'verified' ? 'verified' : ''}`}>
                        <div className="v-icon-box"><ShieldCheck size={20} /></div>
                        <div className="v-info">
                          <h5>Aadhaar ID</h5>
                          <p>{aadhaarStatus === 'verified' ? 'Verified Official' : 'Verification Required'}</p>
                        </div>
                        {aadhaarStatus === 'verified' ? <CheckCircle size={18} className="v-done" /> : (
                           <button className="v-action-btn">Start</button>
                        )}
                      </div>
                      <div className={`v-item-v2 ${profile?.phone_verified ? 'verified' : ''}`}>
                        <div className="v-icon-box"><Phone size={20} /></div>
                        <div className="v-info">
                          <h5>Phone #</h5>
                          <p>{profile?.phone_verified ? 'Verified Active' : 'Unverified'}</p>
                        </div>
                        {profile?.phone_verified ? <CheckCircle size={18} className="v-done" /> : (
                           <button className="v-action-btn">Verify</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {editing && (
        <EditProfileModal 
          formData={formData} 
          setFormData={setFormData}
          onSave={handleSaveProfile}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function EditProfileModal({ formData, setFormData, onSave, onClose }) {
  const [photoPreview, setPhotoPreview] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profile_photo: file });
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="edit-profile-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="edit-profile-modal" 
        onClick={e => e.stopPropagation()}
      >
        <div className="ep-header">
          <div className="ep-header-text">
            <h2>Edit Profile</h2>
            <p>Customize your WanderMeet identity</p>
          </div>
          <button className="close-ep-btn" onClick={onClose}><X size={20}/></button>
        </div>

        <div className="ep-body">
          {/* Avatar Section */}
          <div className="ep-photo-suite">
            <div className="ep-avatar-preview">
              {photoPreview ? <img src={photoPreview} alt="Preview" /> : (formData.profile_photo_url ? <img src={formData.profile_photo_url} alt="Profile" /> : formData.full_name?.charAt(0))}
            </div>
            <div className="ep-photo-controls">
              <h4>Profile Picture</h4>
              <label className="upload-trigger">
                 <Camera size={14} /> Change Photo
                 <input type="file" hidden accept="image/*" onChange={handlePhotoChange} />
              </label>
            </div>
          </div>

          <div className="ep-form-sections">
            <h5 className="ep-section-title">Personal Information</h5>
            <div className="ep-grid">
              <div className="ep-input-group">
                <label className="ep-label">Full Name</label>
                <input 
                  className="ep-input" 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  placeholder="Enter your name"
                />
              </div>
              <div className="ep-input-group">
                <label className="ep-label">Home Base</label>
                <input 
                  className="ep-input" 
                  value={formData.home_location} 
                  onChange={e => setFormData({...formData, home_location: e.target.value})} 
                  placeholder="e.g. London, UK"
                />
              </div>
              <div className="ep-input-group">
                <label className="ep-label">Email Address</label>
                <div className="ep-input-icon-wrap">
                  <span className="ep-input-icon"><Mail size={15} /></span>
                  <input 
                    className="ep-input ep-input-with-icon" 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div className="ep-input-group">
                <label className="ep-label">Contact Number</label>
                <div className="ep-input-icon-wrap">
                  <span className="ep-input-icon"><Phone size={15} /></span>
                  <input 
                    className="ep-input ep-input-with-icon" 
                    type="tel"
                    value={formData.phone_number} 
                    onChange={e => setFormData({...formData, phone_number: e.target.value})} 
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            <h5 className="ep-section-title mt-4">About Me</h5>
            <div className="ep-input-group">
              <label className="ep-label">Story / Bio</label>
              <textarea 
                className="ep-input ep-textarea" 
                rows="3"
                value={formData.bio} 
                onChange={e => setFormData({...formData, bio: e.target.value})} 
                placeholder="Tell the world about your travels..."
              />
            </div>
          </div>
        </div>

        <div className="ep-footer">
          <button className="btn-modern btn-modern-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-modern btn-modern-primary" onClick={onSave}>Save Changes</button>
        </div>
      </motion.div>
    </div>
  );
}

export default Profile;
