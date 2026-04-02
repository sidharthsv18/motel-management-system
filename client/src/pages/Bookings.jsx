import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

function Bookings() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBookingForDelete, setSelectedBookingForDelete] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
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
  const [success, setSuccess] = useState('');
  const userRole = localStorage.getItem('userRole');

  // Fetch bookings and rooms on component mount
  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, []);

  // Clear error and success when add modal opens
  useEffect(() => {
    if (showModal) {
      setError('');
      setSuccess('');
    }
  }, [showModal]);

  // Clear error and success when delete modal opens/closes
  useEffect(() => {
    if (!showDeleteModal) {
      setError('');
    }
  }, [showDeleteModal]);

  // Auto-hide error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-hide success after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms');
      setRooms(response.data || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
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
      setError('');
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
      setSuccess('Booking created successfully!');
      setShowModal(false);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      if (!selectedBookingForDelete || !selectedBookingForDelete.id) {
        setError('Invalid booking selected');
        return;
      }

      console.log(`Deleting booking ${selectedBookingForDelete.id}...`);
      
      const response = await axios.delete(`/api/bookings/${selectedBookingForDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Delete response:', response.data);

      // Remove deleted booking from state
      setBookings(bookings.filter(b => b.id !== selectedBookingForDelete.id));
      setSuccess('Booking deleted successfully!');
      setShowDeleteModal(false);
      setSelectedBookingForDelete(null);
    } catch (err) {
      console.error('Error deleting booking:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete booking';
      setError(errorMsg);
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`/api/bookings/${bookingId}/check-in`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update bookings list with new status
      setBookings(bookings.map(b => b.id === bookingId ? response.data : b));
      setSuccess('Guest checked in successfully!');
    } catch (err) {
      console.error('Error checking in:', err);
      setError(err.response?.data?.message || 'Failed to check in');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="main-content flex-1">
        <h1 className="page-title">Bookings</h1>
        <button className="btn" onClick={() => setShowModal(true)} disabled={loading}>Add New Booking</button>
        
        {error && <div style={{ color: 'red', padding: '10px', margin: '10px 0', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}
        {success && <div style={{ color: 'green', padding: '10px', margin: '10px 0', backgroundColor: '#e6ffe6', borderRadius: '4px' }}>{success}</div>}
        
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
                <th>Check-in</th>
                {userRole === 'owner' && <th>Actions</th>}
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
                    <td>{b.room_number}</td>
                    <td>{b.guests}</td>
                    <td>₹{parseFloat(b.price).toFixed(2)}</td>
                    <td>
                      {b.status === 'checked_in' && <span style={{color: '#27ae60', fontWeight: 'bold'}}>✓ Checked In</span>}
                      {b.status === 'checked_out' && <span style={{color: '#27ae60', fontWeight: 'bold'}}>✓ Checked Out</span>}
                      {b.status === 'pending' && <span style={{color: '#f39c12'}}>Pending</span>}
                    </td>
                    <td>
                      {b.status !== 'checked_in' && b.status !== 'checked_out' && (
                        <button 
                          className="btn" 
                          onClick={() => handleCheckIn(b.id)}
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#27ae60' }}
                        >
                          Check-In
                        </button>
                      )}
                      {(b.status === 'checked_in' || b.status === 'checked_out') && (
                        <span style={{color: '#27ae60', fontWeight: 'bold'}}>✓</span>
                      )}
                    </td>
                    {userRole === 'owner' && (
                      <td>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => {
                            setSelectedBookingForDelete(b);
                            setShowDeleteModal(true);
                          }}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={userRole === 'owner' ? '11' : '10'} style={{ textAlign: 'center' }}>No bookings found</td></tr>
              )}
            </tbody>
          </table>
        )}
        
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Booking</h2>
              {error && <div style={{ color: 'red', marginBottom: '10px', backgroundColor: '#ffe6e6', padding: '8px', borderRadius: '4px' }}>{error}</div>}
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
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        Room {room.room_number} {room.status === 'occupied' ? '(Occupied)' : '(Available)'}
                      </option>
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

        {showDeleteModal && selectedBookingForDelete && (
          <div className="modal">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <h2>Confirm Delete</h2>
              <p>Are you sure you want to delete booking #{selectedBookingForDelete.id} for {selectedBookingForDelete.customer_name}?</p>
              <p style={{ color: '#666', fontSize: '12px' }}>This action cannot be undone.</p>
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedBookingForDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                  style={{ backgroundColor: '#dc3545' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Bookings;