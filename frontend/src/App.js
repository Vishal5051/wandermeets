import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Import components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MapView from './components/Map/MapView';
import ActivityDetails from './components/Activities/ActivityDetails';
import CreateActivity from './components/Activities/CreateActivity';
import Profile from './components/Profile/Profile';
import TravelJournal from './components/Journal/TravelJournal';
import Marketplace from './components/Marketplace/Marketplace';
import VendorDashboard from './components/Vendor/VendorDashboard';
// import VendorListings from './components/Vendor/VendorListings';
import TravelPackages from './components/Packages/TravelPackages';
import ProviderDashboard from './components/Provider/ProviderDashboard';
import WaveDashboard from './components/Waves/WaveDashboard';
import Navbar from './components/Layout/Navbar';
import SOSButton from './components/Safety/SOSButton';

import { motion, AnimatePresence } from 'framer-motion';

const PageWrapper = ({ children }) => {
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      className="page-container"
    >
      {children}
    </motion.div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-modern"></div>
        <p>WanderMeets is getting ready...</p>
      </div>
    );
  }

  const isVendor = user?.role === 'vendor';
  const isProvider = user?.role === 'provider';
  const defaultRoute = isVendor ? '/vendor/dashboard' : isProvider ? '/provider/dashboard' : '/';

  return (
      <div className="App">
        <div className="noise-bg" />
        {user && <Navbar user={user} onLogout={handleLogout} />}
        {user && <SOSButton user={user} />}
        
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={defaultRoute} />} 
            />
            <Route 
              path="/register" 
              element={!user ? <Register onLogin={handleLogin} /> : <Navigate to={defaultRoute} />} 
            />

            {/* Traveler routes */}
            <Route 
              path="/" 
              element={user ? <MapView user={user} onLocationChange={setUserLocation} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/activity/:id" 
              element={user ? <PageWrapper><ActivityDetails user={user} /></PageWrapper> : <Navigate to="/login" />} 
            />
            <Route 
              path="/create-activity" 
              element={user ? <PageWrapper><CreateActivity user={user} /></PageWrapper> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile" 
              element={user ? <PageWrapper><Profile user={user} setUser={setUser} userLocation={userLocation} onLogout={handleLogout} /></PageWrapper> : <Navigate to="/login" />} 
            />
            <Route 
              path="/journal" 
              element={user ? <PageWrapper><TravelJournal user={user} /></PageWrapper> : <Navigate to="/login" />} 
            />
            <Route 
              path="/marketplace" 
              element={user ? <PageWrapper><Marketplace user={user} userLocation={userLocation} /></PageWrapper> : <Navigate to="/login" />} 
            />
            <Route 
              path="/packages" 
              element={user ? <PageWrapper><TravelPackages user={user} userLocation={userLocation} /></PageWrapper> : <Navigate to="/login" />} 
            />
            <Route 
              path="/waves" 
              element={user ? <PageWrapper><WaveDashboard user={user} userLocation={userLocation} /></PageWrapper> : <Navigate to="/login" />} 
            />

            <Route 
              path="/vendor/dashboard" 
              element={user && isVendor ? <PageWrapper><VendorDashboard user={user} /></PageWrapper> : <Navigate to="/login" />} 
            />
            <Route 
              path="/provider/dashboard" 
              element={user && isProvider ? <PageWrapper><ProviderDashboard user={user} /></PageWrapper> : <Navigate to="/login" />} 
            />
          </Routes>
        </AnimatePresence>
      </div>
  );
}

export default App;
