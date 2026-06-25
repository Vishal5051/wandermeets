import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Mail, Lock, Eye, EyeOff, MapPin, Users, Star } from 'lucide-react';
import { authAPI } from '../../utils/api';
import './Auth.css';

const features = [
  { icon: '🌎', title: 'Explore Together', desc: 'Discover activities near you & connect with travelers' },
  { icon: '🚕', title: 'Waves (Ride Share)', desc: 'Split cabs, share journeys, save money' },
  { icon: '📸', title: 'Travel Journal', desc: 'Pin memories on your personal map' },
];

function Login({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login(formData);
      onLogin(response.data.user, response.data.token);
      const role = response.data.user.role;
      navigate(role === 'vendor' ? '/vendor/dashboard' : role === 'provider' ? '/provider/dashboard' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">

      {/* ── Desktop Aside ── */}
      <aside className="auth-aside">
        <div className="auth-aside-mesh">
          <div className="mesh-blob mesh-blob-1" />
          <div className="mesh-blob mesh-blob-2" />
          <div className="mesh-blob mesh-blob-3" />
        </div>

        <div className="aside-top">
          <div className="aside-logo-icon">
            <Compass size={24} color="white" />
          </div>
          <span className="aside-brand-name">Wander<span>Mates</span></span>
        </div>

        <div className="aside-main">
          <h1 className="aside-tagline">
            Travel is better<br />
            <span className="gradient-text">together.</span>
          </h1>
          <p className="aside-desc">
            Join thousands of explorers discovering adventures, sharing rides,
            and creating memories across India and beyond.
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

          {/* Heading */}
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back 👋</h2>
            <p className="auth-form-subtitle">Sign in to continue your journey</p>
          </div>

          {/* Social Login */}
          <div className="social-login">
            <button className="social-btn">
              <span className="social-icon">G</span>
              Google
            </button>
            <button className="social-btn">
              <span className="social-icon"></span>
              Apple
            </button>
          </div>

          <div className="auth-divider">or continue with email</div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form-body">
            <div className="field-group">
              <label className="field-label">Email or Username</label>
              <div className="field-input-wrap">
                <Mail size={16} className="field-input-icon" />
                <input
                  type="text"
                  name="email"
                  className="field-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="field-input-wrap">
                <Lock size={16} className="field-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="field-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
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
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div className="auth-form-footer">
            <p>Don't have an account? <Link to="/register" className="auth-link">Create one free</Link></p>
            <a href="#forgot" className="forgot-link">Forgot your password?</a>
          </div>

          <motion.div
            className="demo-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="demo-box-label">🔑 Demo Access</div>
            <p>Email: sarah@example.com<br />Password: password123</p>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}

export default Login;
