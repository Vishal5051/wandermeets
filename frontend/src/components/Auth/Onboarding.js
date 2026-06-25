import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Shield, Check, MapPin, Search, ChevronDown, Bell, User } from 'lucide-react';
import './Auth.css';

function Onboarding({ user, setUser }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: user?.full_name || '',
    age: '25',
    homeCity: '',
    gender: 'male',
    bio: ''
  });
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      // Finalize onboarding
      navigate('/');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Profile Details
  const Step1 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="step-content"
    >
      <h2>Tell us about yourself</h2>
      <p className="subheading">Help others know who you are</p>

      <div className="avatar-upload-section">
        <div className="avatar-upload-circle">
          <Camera size={32} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, marginTop: '0.5rem' }}>Add Photo</span>
        </div>
      </div>

      <div className="modern-form-group">
        <label>Display Name *</label>
        <div className="modern-input-wrapper">
          <span className="modern-input-icon"><User size={18} /></span>
          <input 
            type="text" 
            name="displayName"
            className="modern-input" 
            placeholder="e.g., Sarah"
            value={formData.displayName}
            onChange={handleChange}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
        <div className="modern-form-group">
          <label>Age *</label>
          <div className="modern-input-wrapper">
            <select 
              name="age" 
              className="modern-input" 
              style={{ paddingLeft: '1rem', appearance: 'none' }}
              value={formData.age}
              onChange={handleChange}
            >
              {[...Array(83)].map((_, i) => (
                <option key={i+18} value={i+18}>{i+18}</option>
              ))}
            </select>
            <ChevronDown size={18} style={{ position: 'absolute', right: '1rem', pointerEvents: 'none', opacity: 0.5 }} />
          </div>
        </div>
        <div className="modern-form-group">
          <label>Home City</label>
          <div className="modern-input-wrapper">
            <span className="modern-input-icon"><Search size={18} /></span>
            <input 
              type="text" 
              name="homeCity"
              className="modern-input" 
              placeholder="Search cities..." 
              value={formData.homeCity}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="modern-form-group">
        <label>Gender *</label>
        <div className="gender-selection-modern">
          {['male', 'female', 'non-binary', 'prefer not'].map(g => (
            <button 
              key={g} 
              type="button"
              className={formData.gender === g ? 'active' : ''}
              onClick={() => setFormData({ ...formData, gender: g })}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="modern-form-group">
        <label>Bio (Optional)</label>
        <textarea 
          name="bio"
          className="modern-input" 
          style={{ minHeight: '100px', paddingLeft: '1rem' }} 
          placeholder="Tell travelers about yourself..."
          value={formData.bio}
          onChange={handleChange}
        />
      </div>
    </motion.div>
  );

  // Step 2: Identity Verification
  const Step2 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="step-content"
      style={{ textAlign: 'center' }}
    >
      <div className="verification-badge">
        <Shield size={48} />
      </div>

      <h2>Verify your identity</h2>
      <p className="subheading">Your ID is encrypted and never shared with other users</p>

      <div className="benefits-box">
        <h4>Why Verify?</h4>
        <div className="benefits-list">
          {[
            'Host activities for other travelers',
            'See women-only events & activities',
            'Higher Trust Score & credibility',
            'Priority customer support'
          ].map(benefit => (
            <div className="benefit-item" key={benefit}>
              <Check size={18} color="#10b981" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '0.5rem', 
        background: '#eff6ff', 
        padding: '1rem', 
        borderRadius: '12px',
        color: '#1e40af',
        fontWeight: 700,
        fontSize: '0.85rem',
        marginBottom: '2rem'
      }}>
        <span>🔐 Powered by Onfido — Bank-grade identity verification</span>
      </div>
    </motion.div>
  );

  // Step 3: Location Access
  const Step3 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="step-content"
      style={{ textAlign: 'center' }}
    >
      <div className="location-radar-container">
        <div className="radar-pulse"></div>
        <div className="radar-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="radar-pin">
           <MapPin size={24} />
        </div>
      </div>

      <h2>Find travelers near you</h2>
      <p className="subheading">WanderMeets shows activities happening around you in real-time. Your exact location is never shared — only the city you're in.</p>

      <div className="location-benefits">
        <div className="loc-benefit-card">
          <MapPin size={20} />
          <span>Live activities on the map</span>
        </div>
        <div className="loc-benefit-card" style={{ background: '#f5f3ff', color: '#5b21b6' }}>
          <User size={20} />
          <span>Travelers nearby right now</span>
        </div>
        <div className="loc-benefit-card" style={{ background: '#fffbeb', color: '#92400e' }}>
          <Bell size={20} />
          <span>Instant activity notifications</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="onboarding-outer">
       {/* Desktop Wrapper for larger screens */}
       <div className="auth-desktop-layout">
          <div className="auth-desktop-aside desktop-view">
             <div style={{ textAlign: 'center' }}>
                <Compass size={80} color="white" />
                <h1 style={{ color: 'white', marginTop: '1rem' }}>WanderMeets</h1>
                <p style={{ color: 'white', opacity: 0.8 }}>Start your travel journey today.</p>
             </div>
          </div>
          
          <div className="auth-desktop-main">
             <div className="onboarding-card">
                <div className="step-progress-container">
                  <div className="step-indicator-bar">
                    <div className={`indicator-dot ${step >= 1 ? 'active' : ''}`}></div>
                    <div className={`indicator-dot ${step >= 2 ? 'active' : ''}`}></div>
                    <div className={`indicator-dot ${step >= 3 ? 'active' : ''}`}></div>
                  </div>
                  <div className="step-text-indicator">Step {step} of 3</div>
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 && <Step1 key="step1" />}
                  {step === 2 && <Step2 key="step2" />}
                  {step === 3 && <Step3 key="step3" />}
                </AnimatePresence>

                <div className="onboarding-footer">
                  <button className="btn-continue" onClick={handleNext}>
                    {step === 1 ? 'Continue →' : step === 2 ? 'Verify with Onfido →' : 'Enable Location 📍'}
                  </button>
                  {step === 2 && (
                    <button className="btn-secondary-link" onClick={handleNext}>
                      I'll do this later
                    </button>
                  )}
                  {step === 3 && (
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af', marginTop: '1rem', fontWeight: 600 }}>
                      You can change this in Settings anytime
                    </p>
                  )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

export default Onboarding;
