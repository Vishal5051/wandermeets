import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { activitiesAPI, pinsAPI } from '../../utils/api';
import { MapPin, Settings, Bell, Plus, Navigation, Search as LucideSearch, X, Map as MapIcon, Image as ImageIcon, Clock } from 'lucide-react';
import axios from 'axios';
import CreatePinModal from '../Journal/CreatePinModal';
import './MapView.css';

const activityEmoji = {
  'Hike': '🏔️', 'Cafe': '☕', 'Night Out': '🕺', 'Yoga': '🧘', 'Food Tour': '😋',
  'Arts': '🎭', 'Photography': '📸', 'Weekend Trip': '🏕️', 'Sports': '⚽',
  'Spiritual': '🛕', 'Community': '🙌', 'Other': '📍'
};

const activityColor = {
  'Hike': '#10B981', // Emerald
  'Cafe': '#F97316', // Coral
  'Night Out': '#8B5CF6', // Violet
  'Yoga': '#0D9488', // Teal
  'Food Tour': '#F43F5E', // Rose
  'Arts': '#EC4899', // Pink
  'Photography': '#06B6D4', // Cyan
  'Weekend Trip': '#F59E0B', // Amber
  'Sports': '#3B82F6', // Blue
  'Spiritual': '#8B5CF6', // Violet
  'Community': '#0D9488', // Teal
  'Other': '#64748B'  // Slate
};

// OpenFreeMap Liberty style (very clean, resembles Snapchat/premium styles)
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const RADIUS_KM = 50;

const formatAddress = (feat) => {
  if (!feat || !feat.properties) return '';
  const p = feat.properties;
  const name = p.name || '';
  const city = p.city || p.district || p.town || '';
  const country = p.country || '';
  
  const parts = [];
  if (name) parts.push(name);
  if (city && city !== name) parts.push(city);
  if (country && country !== city && country !== name) parts.push(country);
  
  return parts.join(', ');
};

function MapView({ user, onLocationChange }) {
  const [viewState, setViewState] = useState({
    latitude: 30.0869,
    longitude: 78.2676,
    zoom: 13
  });
  const [activities, setActivities] = useState([]);
  const [userPins, setUserPins] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('Locating...');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [showActivitiesList, setShowActivitiesList] = useState(false);
  
  const mapRef = useRef();
  const navigate = useNavigate();
  const lastFetchCoords = useRef({ lat: 0, lng: 0 });
  const fetchTimeout = useRef(null);

  const slideUp = {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { type: 'spring', damping: 25, stiffness: 200 }
  };

  const fadeInScale = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchData = async (lat, lng) => {
    const dist = calculateDistance(lat, lng, lastFetchCoords.current.lat, lastFetchCoords.current.lng);
    if (dist < 5 && activities.length > 0) return;

    try {
      setLoading(true);
      lastFetchCoords.current = { lat, lng };
      const [activitiesRes, pinsRes] = await Promise.all([
        activitiesAPI.getNearby(lat, lng, RADIUS_KM * 1000),
        pinsAPI.getAll(lat, lng, RADIUS_KM * 1000)
      ]);
      setActivities(activitiesRes.data.activities || []);
      setUserPins(pinsRes.data.pins || []);
    } catch (err) {
      console.error('Error fetching map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    fetchTimeout.current = setTimeout(() => {
      fetchData(viewState.latitude, viewState.longitude);
    }, 500);

    return () => { if (fetchTimeout.current) clearTimeout(fetchTimeout.current); };
  }, [viewState.latitude, viewState.longitude]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, zoom: 13 };
          setViewState(loc);
          if (onLocationChange) onLocationChange({ lat: loc.latitude, lng: loc.longitude });
          reverseGeocode(loc.latitude, loc.longitude);
        },
        () => {
          setLocationName('Rishikesh');
        }
      );
    }
  }, []);

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await axios.get(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`);
      const feat = res.data.features?.[0];
      if (feat) {
        const fullName = formatAddress(feat);
        setLocationName(fullName);
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    }
  };

  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await axios.get(`https://photon.komoot.io/api/?q=${searchTerm}&limit=5`);
        setSearchResults(res.data.features || []);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectPlace = (feat) => {
    const [lon, lat] = feat.geometry.coordinates;
    const newLoc = { latitude: lat, longitude: lon, zoom: 14 };
    setViewState(newLoc);
    if (onLocationChange) onLocationChange({ lat, lng: lon });
    
    const fullName = formatAddress(feat);
    setLocationName(fullName);
    
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    
    if (mapRef.current) {
      mapRef.current.getMap().flyTo({ center: [lon, lat], duration: 2000 });
    }
  };

  const recenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, zoom: 14 };
        setViewState(loc);
        if (mapRef.current) {
          mapRef.current.getMap().flyTo({ center: [loc.longitude, loc.latitude], duration: 1500 });
        }
        reverseGeocode(loc.latitude, loc.longitude);
      });
    }
  };

  return (
    <div className="map-page immersion-theme">
      <AnimatePresence>
        {isPinningMode && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="pinning-mode-banner"
          >
            Tap anywhere to drop a pin
            <button className="cancel-pinning-btn" onClick={() => setIsPinningMode(false)}>Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        animate={{ opacity: isPinningMode ? 0 : 1, y: isPinningMode ? -20 : 0 }}
        className="map-top-container"
      >
        <div className="search-bar-outer">
          <div className="search-bar-wrapper">
            <div className="search-icon-box">
              <LucideSearch size={20} />
            </div>
            <input
              type="text"
              placeholder="Where to next?"
              className="map-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowResults(true)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <X size={18} />
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {showResults && searchResults.length > 0 && (
              <motion.div 
                {...fadeInScale}
                className="search-results-dropdown"
              >
                {searchResults.map((feat, i) => (
                  <div key={i} className="search-result-item" onClick={() => handleSelectPlace(feat)}>
                    <MapPin size={16} className="item-icon" />
                    <div className="item-text">
                      <div className="item-name">{feat.properties.name}</div>
                      <div className="item-sub">
                        {[feat.properties.city, feat.properties.state, feat.properties.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="location-pill" onClick={recenter}>
          <Navigation size={14} className="pill-icon" />
          <span>{locationName}</span>
        </div>
      </motion.div>

      <div className={`side-actions ${isPinningMode ? 'hidden-ui' : ''}`}>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="action-btn" onClick={recenter}>
          <MapIcon size={20} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="action-btn"><Bell size={20} /></motion.button>
      </div>

      <div className="map-canvas">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          ref={mapRef}
          mapStyle={MAP_STYLE}
          style={{ width: '100%', height: '100%', cursor: isPinningMode ? 'crosshair' : 'grab' }}
          attributionControl={false}
          onClick={(e) => {
            if (isPinningMode) {
              setPinLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
              setShowPinModal(true);
              setIsPinningMode(false);
            }
          }}
        >
          {activities.map((act) => (
            <Marker
              key={act.id}
              latitude={parseFloat(act.latitude)}
              longitude={parseFloat(act.longitude)}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedActivity(act);
              }}
            >
              <motion.div 
                whileHover={{ scale: 1.2, y: -5 }}
                className="premium-marker" 
                style={{ background: activityColor[act.activity_type] || '#6B7280' }}
              >
                {activityEmoji[act.activity_type] || '📍'}
              </motion.div>
            </Marker>
          ))}

          {userPins.map((pin) => (
            <Marker
              key={`pin-${pin.id}`}
              latitude={parseFloat(pin.latitude)}
              longitude={parseFloat(pin.longitude)}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedPin(pin);
              }}
            >
              <motion.div 
                whileHover={{ scale: 1.2, y: -5 }}
                className="premium-marker pin-marker"
              >
                {pin.mood_emoji || '📍'}
              </motion.div>
            </Marker>
          ))}

          <GeolocateControl position="bottom-right" />
        </Map>
      </div>

      <AnimatePresence>
        {!loading && activities.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="activity-status-pill clickable" 
            onClick={() => setShowActivitiesList(true)}
          >
            <div className="status-dot" />
            <span>{activities.length} WanderMeets nearby</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showActivitiesList && (
          <motion.div 
            {...slideUp}
            className="activities-list-drawer"
          >
            <div className="drawer-header">
              <h3>Nearby WanderMeets</h3>
              <button className="close-drawer" onClick={() => setShowActivitiesList(false)}><X size={20}/></button>
            </div>
            <div className="drawer-content">
              {activities.map(act => (
                <motion.div 
                  key={act.id} 
                  whileHover={{ x: 5 }}
                  className="activity-card-mini" 
                  onClick={() => {
                    setViewState({ latitude: parseFloat(act.latitude), longitude: parseFloat(act.longitude), zoom: 15 });
                    setSelectedActivity(act);
                    setShowActivitiesList(false);
                  }}
                >
                  <div className="card-type-icon" style={{ background: activityColor[act.activity_type] }}>
                    {activityEmoji[act.activity_type]}
                  </div>
                  <div className="card-mini-details">
                    <h4>{act.title}</h4>
                    <p>{act.host_name}</p>
                    <span className="mini-time">{new Date(act.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </motion.div>
              ))}
              {activities.length === 0 && <p className="empty-drawer-msg">No activities found nearby.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Memory Pin Sheet */}
      <AnimatePresence>
        {selectedPin && (
          <motion.div 
            {...slideUp}
            className="bottom-sheet-card"
          >
            <div className="sheet-header">
              <div className="sheet-drag-handle" onClick={() => setSelectedPin(null)} />
            </div>
            <div className="sheet-body">
              <div className="sheet-main-info">
                <div className="sheet-activity-avatar pin-avatar">
                  {selectedPin.mood_emoji || '📍'}
                </div>
                <div className="sheet-text-content">
                  <h3 className="sheet-title">{selectedPin.title || 'Personal Memory'}</h3>
                  <p className="sheet-subtitle">{selectedPin.location_name}</p>
                </div>
                <div className="sheet-date-badge">
                  {new Date(selectedPin.visit_date).toLocaleDateString()}
                </div>
              </div>
              {selectedPin.note && <p className="sheet-description">{selectedPin.note}</p>}
              <button className="sheet-action-btn" onClick={() => navigate('/journal')}>
                Open in Journal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Activity Sheet */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div 
            {...slideUp}
            className="bottom-sheet-card"
          >
            <div className="sheet-header">
              <div className="sheet-drag-handle" onClick={() => setSelectedActivity(null)} />
            </div>
            <div className="sheet-body">
              <div className="sheet-main-info">
                <div 
                  className="sheet-activity-avatar"
                  style={{ background: activityColor[selectedActivity.activity_type] }}
                >
                  {activityEmoji[selectedActivity.activity_type]}
                </div>
                <div className="sheet-text-content">
                  <h3 className="sheet-title">{selectedActivity.title}</h3>
                  <p className="sheet-subtitle">
                    Hosted by <span style={{color:'var(--teal)', fontWeight:700}}>{selectedActivity.host_name}</span>
                  </p>
                </div>
                <div className="sheet-status-badge">
                  {selectedActivity.current_attendees}/{selectedActivity.capacity} Joined
                </div>
              </div>
              
              <div className="sheet-meta-strip">
                <div className="meta-strip-item">
                  <Clock size={14} />
                  <span>{new Date(selectedActivity.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="meta-strip-item">
                  <MapPin size={14} />
                  <span className="truncate">{selectedActivity.location_name}</span>
                </div>
              </div>

              <button className="sheet-action-btn primary" onClick={() => navigate(`/activity/${selectedActivity.id}`)}>
                View Details & Join
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons Container */}
      <div className={`fab-container ${isPinningMode ? 'hidden-ui' : ''}`}>
        <button className="snap-fab pin-fab" onClick={() => {
          setIsPinningMode(true);
        }} title="Drop a Pin">
          <MapPin size={24} />
        </button>
        
        <button className="snap-fab" onClick={() => navigate('/create-activity')} title="Create Event">
          <Plus size={28} />
        </button>
      </div>

      {/* Create Pin Modal */}
      {showPinModal && (
        <CreatePinModal 
          onClose={() => setShowPinModal(false)}
          onSuccess={() => {
            alert('Memory saved successfully! View it in your Journal.');
          }}
          initialLocation={pinLocation}
        />
      )}
    </div>
  );
}

export default MapView;
