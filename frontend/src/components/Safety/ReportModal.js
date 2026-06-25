import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { safetyAPI } from '../../utils/api';

const REPORT_CATEGORIES = [
  'Fraud / Scam',
  'Harassment',
  'Safety Concern',
  'Inappropriate Content',
  'Other'
];

function ReportModal({ entityId, entityType, entityName, onClose }) {
  const [category, setCategory] = useState(REPORT_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await safetyAPI.reportFraud({
        entity_id: entityId,
        entity_type: entityType,
        report_type: category,
        description
      });
      alert('Report submitted. Our safety team will investigate this immediately. Thank you for keeping WanderMeets safe.');
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
          <ShieldAlert color="#ef4444" size={24} />
          <h2 className="modal-title" style={{ margin:0 }}>Report Concern</h2>
        </div>
        <p className="modal-subtitle">Tell us what's wrong with this {entityType} by {entityName}.</p>

        <form onSubmit={handleSubmit}>
          <div className="report-type-grid">
            {REPORT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`report-type-btn ${category === cat ? 'selected' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display:'block', fontSize:'12px', fontWeight:'700', marginBottom:'8px', textTransform:'uppercase', color:'#64748b' }}>
              Details
            </label>
            <textarea
              className="modern-input"
              rows="4"
              placeholder="Please provide specifics to help us investigate..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="btn-modern"
            style={{ width: '100%', background: '#ef4444', color: 'white' }}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
          <p style={{ fontSize:'11px', color:'#94a3b8', textAlign:'center', marginTop:'12px' }}>
            Your report is confidential. Misuse of the reporting system may lead to account suspension.
          </p>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;
