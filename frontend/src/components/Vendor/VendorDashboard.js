import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { marketplaceAPI, bookingAPI } from '../../utils/api';
import { Package, Star, Clock, CheckCircle, Plus, ShoppingBag, Trash2, Edit3, User } from 'lucide-react';
import './Vendor.css';

const CATEGORY_EMOJIS = {
  Yoga: '🧘', Rafting: '🚣', Stays: '🏨', Camping: '⛺',
  Photography: '📸', Cafe: '☕', Adventure: '🏔️', Other: '🎯'
};

function VendorDashboard({ user }) {
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [listingsRes, bookingsRes] = await Promise.all([
        marketplaceAPI.getMyListings(),
        bookingAPI.getVendorBookings()
      ]);
      setListings(listingsRes.data.listings || []);
      setBookings(bookingsRes.data.bookings || []);
    } catch (err) {
      console.error('Error fetching vendor data:', err);
    } finally { setLoading(false); }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await bookingAPI.updateStatus(bookingId, status);
      fetchData();
    } catch (err) {
      alert('Failed to update booking');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this listing?')) {
      try {
        await marketplaceAPI.delete(id);
        fetchData();
      } catch (err) { alert('Failed to delete listing'); }
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  const stats = [
    { icon: <Package size={24} />, value: listings.length, label: 'Active Listings', color: 'var(--teal)' },
    { icon: <Star size={24} />, value: listings.length > 0 ? (listings.reduce((sum, l) => sum + (l.rating || 0), 0) / listings.length).toFixed(1) : '4.8', label: 'Avg Rating', color: '#F59E0B' },
    { icon: <Clock size={24} />, value: pendingBookings.length, label: 'Pending Bookings', color: 'var(--coral)' },
    { icon: <CheckCircle size={24} />, value: bookings.filter(b => b.status === 'confirmed').length, label: 'Confirmed', color: 'var(--teal)' }
  ];

  if (loading) return <div className="vendor-dashboard"><div className="loading-wave"><div className="spinner-modern"></div></div></div>;

  return (
    <div className="vendor-dashboard">
      <div className="vendor-header">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1>Partner Dashboard</h1>
          <p>Hi {user?.full_name}, here is your performance overview for today.</p>
        </motion.div>
      </div>

      <div className="vendor-body">
        {/* Stats */}
        <div className="vendor-stats">
          {stats.map((s, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="vendor-stat-card"
            >
              <div className="vendor-stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="vendor-stat-value">{s.value}</div>
              <div className="vendor-stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="vendor-actions">
          <button className="vendor-action-btn primary" onClick={() => navigate('/vendor/listings/new')}>
            <Plus size={20} /> Add New Listing
          </button>
          <button className="vendor-action-btn secondary" onClick={() => navigate('/vendor/listings')}>
            <Package size={20} /> My Listings
          </button>
          <button className="vendor-action-btn secondary" onClick={() => navigate('/marketplace')}>
            <ShoppingBag size={20} /> Visit Market
          </button>
        </div>

        {/* Recent bookings */}
        <div className="vendor-section">
          <h2>Recent Requests</h2>
          <AnimatePresence>
            {bookings.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="vendor-empty">
                <div className="empty-icon"><Clock size={48} /></div>
                <h3>No bookings yet</h3>
                <p>When travelers book your experiences, they will appear here.</p>
              </motion.div>
            ) : (
              <div className="vendor-bookings-list">
                {bookings.slice(0, 10).map((b) => (
                  <motion.div 
                    key={b.id} 
                    whileHover={{ x: 8 }}
                    className={`vendor-booking-card status-${b.status}`}
                  >
                    <div className="vbc-info">
                      <div className="vbc-title">{b.listing_title}</div>
                      <div className="vbc-meta">
                        <User size={12} className="inline mr-1" /> {b.booker_name} · 
                        <Package size={12} className="inline mx-1" /> Qty: {b.quantity} · 
                        <span className="text-teal font-bold ml-1">₹{b.total_price}</span>
                        {b.booking_date && ` · ${new Date(b.booking_date).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="vbc-status">{b.status}</div>
                    {b.status === 'pending' && (
                      <div className="vbc-actions">
                        <button className="vbc-btn confirm" onClick={() => handleBookingStatus(b.id, 'confirmed')}>Accept</button>
                        <button className="vbc-btn cancel" onClick={() => handleBookingStatus(b.id, 'cancelled')}>Decline</button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Listings */}
        <div className="vendor-section">
          <h2>Your Experiences</h2>
          {listings.length === 0 ? (
            <div className="vendor-empty">
              <div className="empty-icon"><Package size={48} /></div>
              <h3>Start your journey</h3>
              <p>Create your first listing to showcase your services to the WanderMeets community.</p>
              <button className="btn-modern btn-modern-primary" onClick={() => navigate('/vendor/listings/new')}>
                + Create Listing
              </button>
            </div>
          ) : (
            <div className="vendor-listings-grid">
              {listings.map((listing) => (
                <div key={listing.id} className="vendor-listing-card">
                  <div className="vlc-header">
                    <div className="vlc-icon">
                      {CATEGORY_EMOJIS[listing.category] || '🎯'}
                    </div>
                    <div className="vlc-info">
                      <div className="vlc-title">{listing.title}</div>
                      <div className="vlc-category">{listing.category}</div>
                    </div>
                    <div className="vlc-price">₹{listing.price}</div>
                  </div>
                  <div className="vlc-footer">
                    <div className="vlc-rating"><Star size={14} fill="currentColor" /> {listing.rating || '4.8'}</div>
                    <div className="vlc-actions">
                      <button className="vlc-btn edit" onClick={() => navigate(`/vendor/listings/edit/${listing.id}`)}><Edit3 size={14} /></button>
                      <button className="vlc-btn delete" onClick={() => handleDelete(listing.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
