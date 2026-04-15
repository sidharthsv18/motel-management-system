import React from 'react';

const MobileHeader = ({ onMenuClick, isLoggedIn }) => {
  if (!isLoggedIn) return null;

  return (
    <div className="mobile-header">
      <button 
        className="mobile-menu-btn"
        onClick={onMenuClick}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '8px',
          color: '#333'
        }}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <h3 style={{ margin: 0, fontSize: '18px', flex: 1 }}>Motel Management</h3>
    </div>
  );
};

export default MobileHeader;
