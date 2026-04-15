import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MobileHeader from './components/MobileHeader';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Rooms from './pages/Rooms';
import Payments from './pages/Payments';
import './mobile.css';
import Expenses from './pages/Expenses';
import Audit from './pages/Audit';

// Protected route component that checks token on render
const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem('token');
  return token ? element : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/bookings" element={<ProtectedRoute element={<Bookings />} />} />
        <Route path="/rooms" element={<ProtectedRoute element={<Rooms />} />} />
        <Route path="/payments" element={<ProtectedRoute element={<Payments />} />} />
        <Route path="/expenses" element={<ProtectedRoute element={<Expenses />} />} />
        <Route path="/audit" element={<ProtectedRoute element={<Audit />} />} />
      </Routes>
    </Router>
  );
}

export default App;