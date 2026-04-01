import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

function Bookings() {
  const [showModal, setShowModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    check_in: '',
    check_out: '',
    room_id: '',
    guests: '',
    price: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Convert room_id, guests, and price to numbers
      const bookingData = {
        ...formData,
        room_id: parseInt(formData.room_id),
        guests: parseInt(formData.guests),
        price: parseFloat(formData.price)
      };

      const response = await axios.post('/api/bookings', bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookings([response.data, ...bookings]);
      setFormData({
        customer_name: '',
        phone: '',
        check_in: '',
        check_out: '',
        room_id: '',
        guests: '',
        price: ''
      });
      setShowModal(false);
      setError('');
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="main-content flex-1">
        <h1 className="page-title">Bookings</h1>
        <button className="btn" onClick={() => setShowModal(true)} disabled={loading}>Add New Booking</button>
        
        {error && <div style={{ color: 'red', padding: '10px', margin: '10px 0' }}>{error}</div>}
        
        {loading && <p>Loading...</p>}
        
        {!loading && (
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Room</th>
                <th>Guests</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings && bookings.length > 0 ? (
                bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.customer_name}</td>
                    <td>{b.phone}</td>
                    <td>{b.check_in}</td>
                    <td>{b.check_out}</td>
                    <td>{b.room_id}</td>
                    <td>{b.guests}</td>
                    <td>₹{parseFloat(b.price).toFixed(2)}</td>
                    <td>{b.status}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="9" style={{ textAlign: 'center' }}>No bookings found</td></tr>
              )}
            </tbody>
          </table>
        )}
        
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Booking</h2>
              {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Customer Name</label>
                  <input 
                    type="text" 
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Check-in Date</label>
                  <input 
                    type="date" 
                    name="check_in"
                    value={formData.check_in}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Check-out Date</label>
                  <input 
                    type="date" 
                    name="check_out"
                    value={formData.check_out}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Room Number</label>
                  <select 
                    name="room_id"
                    value={formData.room_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Room</option>
                    {Array.from({length: 16}, (_, i) => (
                      <option key={i+1} value={i+1}>Room {i+1}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of Guests</label>
                  <input 
                    type="number" 
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    min="1" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input 
                    type="number" 
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0" 
                    step="0.01"
                    required 
                  />
                </div>
                <div className="modal-buttons">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn" disabled={loading}>Save Booking</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Bookings;