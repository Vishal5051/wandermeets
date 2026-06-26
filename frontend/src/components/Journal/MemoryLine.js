import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Trash2, Compass } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://wandermeets-backend.onrender.com');

function MemoryLine({ pins, onDeletePin }) {
  if (!pins || pins.length === 0) return null;

  return (
    <>
      {pins.map((pin, index) => {
        let photos = [];
        try {
          if (pin.photos) {
            photos = typeof pin.photos === 'string' ? JSON.parse(pin.photos) : pin.photos;
          }
        } catch(e) { console.error(e); }
        
        return (
          <motion.div 
            key={pin.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, type: "spring" }}
            className="timeline-milestone"
          >
            <div className="milestone-dot">
              <span className="text-sm">{pin.mood_emoji || '✨'}</span>
            </div>
            
            <div className="milestone-card">
              <div className="milestone-header">
                <motion.h3 layoutId={`title-${pin.id}`}>{pin.title || 'Untitled Memory'}</motion.h3>
                <button className="btn-delete-memory" onClick={() => onDeletePin(pin.id)}>
                   <Trash2 size={16} />
                </button>
              </div>

              <div className="milestone-location">
                <MapPin size={14} />
                <span>{pin.location_name || 'Uncharted Territory'}</span>
                <span className="mx-2 opacity-20">|</span>
                <span className="text-xs text-muted uppercase font-bold tracking-widest">
                  {new Date(pin.visit_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                </span>
              </div>

              {photos && photos.length > 0 && (
                <div className="relative overflow-hidden rounded-2xl mb-6 shadow-lg">
                  <img 
                    src={`${API_URL}${photos[0]}`} 
                    alt="Memory Spotlight" 
                    className="milestone-image mb-0" 
                  />
                </div>
              )}

              {pin.note && <p className="milestone-note">{pin.note}</p>}
            </div>
          </motion.div>
        );
      })}
    </>
  );
}

export default MemoryLine;
