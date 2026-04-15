import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = localStorage.getItem('userRole');
  const userEmail = localStorage.getItem('userEmail');

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <div className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={mobileOpen ? { transform: 'translateX(0)' } : {}}>
      <button 
        className="sidebar-close-btn"
        onClick={() => setMobileOpen(false)}
        style={{ display: 'none' }}
      >
        ✕
      </button>
      <div className="sidebar-header">
        <h2>Motel Management</h2>
        <div className="user-info">
          <div className="user-email">{userEmail}</div>
          <div className="user-role">{userRole}</div>
        </div>
      </div>

      <ul>
        <li><button className={isActive('/dashboard') ? 'active' : ''} onClick={() => navigate('/dashboard')}><span className="emoji">📊</span><span className="text">Dashboard</span></button></li>
        <li><button className={isActive('/bookings') ? 'active' : ''} onClick={() => navigate('/bookings')}><span className="emoji">📅</span><span className="text">Bookings</span></button></li>
        <li><button className={isActive('/rooms') ? 'active' : ''} onClick={() => navigate('/rooms')}><span className="emoji">🛏️</span><span className="text">Rooms</span></button></li>
        <li><button className={isActive('/payments') ? 'active' : ''} onClick={() => navigate('/payments')}><span className="emoji">💰</span><span className="text">Payments</span></button></li>
        <li><button className={isActive('/expenses') ? 'active' : ''} onClick={() => navigate('/expenses')}><span className="emoji">💸</span><span className="text">Expenses</span></button></li>
        {userRole === 'owner' && (
          <li><button className={isActive('/audit') ? 'active' : ''} onClick={() => navigate('/audit')}><span className="emoji">📋</span><span className="text">Audit Logs</span></button></li>
        )}
      </ul>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Sidebar;