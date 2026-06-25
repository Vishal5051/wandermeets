import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import './Auth.css';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Decorative background elements */}
      <div className="landing-bg-circles">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="landing-content">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="landing-logo-container"
        >
          <div className="landing-logo-box">
             <Compass size={48} className="landing-logo-icon" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="landing-text"
        >
          <h1>WanderMeets</h1>
          <p>Your Travel Tribe Awaits</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="landing-actions"
        >
          <button 
            className="btn-landing btn-primary-landing"
            onClick={() => navigate('/register')}
          >
            Get Started →
          </button>
          
          <button 
            className="btn-landing btn-outline-landing"
            onClick={() => navigate('/login')}
          >
            Log In
          </button>
        </motion.div>
      </div>

      <div className="landing-footer">
        <p>Terms of Service • Privacy Policy</p>
      </div>
    </div>
  );
}

export default Landing;
