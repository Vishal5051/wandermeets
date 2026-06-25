import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Mail, Lock, User, AtSign } from 'lucide-react';
import { authAPI } from '../../utils/api';
import './Auth.css';

const features = [
  { icon: '🌏', title: 'Find Your Tribe', desc: 'Connect with travelers who share your vibe' },
  { icon: '🚗', title: 'Smart Commutes', desc: 'Share cabs & split costs with WaveMates' },
  { icon: '🗺️', title: 'Live Map', desc: 'See what\'s happening near you, right now' },
];

function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    full_name: '', username: '', gender: '', role: 'traveler'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleGender = (g) => setFormData({ ...formData, gender: g });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authAPI.register(registerData);
      onLogin(response.data.user, response.data.token);
      const role = response.data.user.role;
      navigate(role === 'vendor' ? '/vendor/dashboard' : role === 'provider' ? '/provider/dashboard' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const genders = [
    { value: 'male',             label: '♂ Male' },
    { value: 'female',           label: '♀ Female' },
    { value: 'other',            label: '⚧ Non-binary' },
    { value: 'prefer_not_to_say', label: '🔒 Private' },
  ];

  const roles = [
    { value: 'traveler', icon: '🎒', label: 'Traveler',  desc: 'Explore & connect with others' },
    { value: 'vendor',   icon: '🏪', label: 'Vendor',    desc: 'Offer local services & deals' },
    { value: 'provider', icon: '✈️', label: 'Provider',  desc: 'Sell curated travel packages' },
  ];

  return (
    <div className="auth-page-wrapper">

      {/* ── Desktop Aside ── */}
      <aside className="auth-aside">
        <div className="aside-top">
          <div className="aside-logo-icon">
            <Compass size={24} color="white" />
          </div>
          <span className="aside-brand-name">Wander<span>Mates</span></span>
        </div>

        <div className="aside-main">
          <h1 className="aside-tagline">
            Your next adventure<br />
            <span className="highlight">starts here.</span>
          </h1>
          <p className="aside-desc">
            Create your free account and join a community of explorers,
            adventurers, and travel enthusiasts across India.
          </p>

          <div className="aside-features">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="aside-feature"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
              >
                <div className="aside-feature-icon">{f.icon}</div>
                <div className="aside-feature-text">
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="aside-floating-card aside-floating-card-1">
            <span className="aside-float-emoji">🆓</span>
            <span className="aside-float-text">Always free · No credit card</span>
          </div>
          <div className="aside-floating-card aside-floating-card-2">
            <span className="aside-float-emoji">🔒</span>
            <span className="aside-float-text">Privacy first · Verified users</span>
          </div>
        </div>

        <div className="aside-footer">
          <p>© 2025 WanderMeets · Privacy · Terms</p>
        </div>
      </aside>

      {/* ── Form Panel ── */}
      <div className="auth-form-panel">
        <motion.div
          className="auth-form-inner"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mobile brand */}
          <div className="auth-mobile-brand">
            <div className="auth-mobile-brand-icon">
              <Compass size={20} />
            </div>
            <span className="auth-mobile-brand-name">Wander<span>Mates</span></span>
          </div>

          <div className="auth-form-header">
            <h2 className="auth-form-title">Create account ✨</h2>
            <p className="auth-form-subtitle">Join thousands of travelers today</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-body">

            {/* Role */}
            <div className="field-group">
              <label className="field-label">I am a</label>
              <div className="role-selector">
                {roles.map(r => (
                  <div
                    key={r.value}
                    className={`role-option ${formData.role === r.value ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, role: r.value })}
                  >
                    <div className="role-option-icon">{r.icon}</div>
                    <div>
                      <div className="role-option-label">{r.label}</div>
                      <div className="role-option-desc">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div className="field-group">
              <label className="field-label">Display Name *</label>
              <div className="field-input-wrap">
                <User size={16} className="field-input-icon" />
                <input
                  type="text"
                  name="full_name"
                  className="field-input"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g., Sarah Sharma"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="field-group">
              <label className="field-label">Username *</label>
              <div className="field-input-wrap">
                <AtSign size={16} className="field-input-icon" />
                <input
                  type="text"
                  name="username"
                  className="field-input"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="your_unique_handle"
                  pattern="[a-zA-Z0-9_]+"
                  title="Letters, numbers, and underscores only"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="field-group">
              <label className="field-label">Email *</label>
              <div className="field-input-wrap">
                <Mail size={16} className="field-input-icon" />
                <input
                  type="email"
                  name="email"
                  className="field-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Gender */}
            <div className="field-group">
              <label className="field-label">Gender *</label>
              <div className="gender-chips">
                {genders.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    className={`gender-chip ${formData.gender === g.value ? 'selected' : ''}`}
                    onClick={() => handleGender(g.value)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div className="field-group">
              <label className="field-label">Password *</label>
              <div className="field-input-wrap">
                <Lock size={16} className="field-input-icon" />
                <input
                  type="password"
                  name="password"
                  className="field-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="field-group">
              <label className="field-label">Confirm Password *</label>
              <div className="field-input-wrap">
                <Lock size={16} className="field-input-icon" />
                <input
                  type="password"
                  name="confirmPassword"
                  className="field-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                className="auth-error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating Account…' : 'Create Account →'}
            </button>
          </form>

          <div className="auth-form-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Sign In</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;
