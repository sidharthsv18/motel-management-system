import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar() {
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
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Motel Management</h2>
        <div className="user-info">
          <div className="user-email">{userEmail}</div>
          <div className="user-role">{userRole}</div>
        </div>
      </div>

      <ul>
        <li><button className={isActive('/dashboard') ? 'active' : ''} onClick={() => navigate('/dashboard')}>Dashboard</button></li>
        <li><button className={isActive('/bookings') ? 'active' : ''} onClick={() => navigate('/bookings')}>Bookings</button></li>
        <li><button className={isActive('/rooms') ? 'active' : ''} onClick={() => navigate('/rooms')}>Rooms</button></li>
        <li><button className={isActive('/payments') ? 'active' : ''} onClick={() => navigate('/payments')}>Payments</button></li>
        <li><button className={isActive('/expenses') ? 'active' : ''} onClick={() => navigate('/expenses')}>Expenses</button></li>
        {userRole === 'owner' && (
          <li><button className={isActive('/audit') ? 'active' : ''} onClick={() => navigate('/audit')}>Audit Logs</button></li>
        )}
      </ul>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Sidebar;