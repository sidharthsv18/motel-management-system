import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

function Payments() {
  const [showModal, setShowModal] = useState(false);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    booking_id: '',
    customer_name: '',
    amount: '',
    payment_method: 'cash'
  });

  useEffect(() => {
    fetchPayments();
    fetchBookings();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-populate customer name and amount when booking ID is selected
    if (name === 'booking_id' && value) {
      const booking = bookings.find(b => b.id === parseInt(value));
      if (booking) {
        setFormData(prev => ({
          ...prev,
          customer_name: booking.customer_name,
          amount: booking.price || ''
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/payments',
        {
          ...formData,
          booking_id: parseInt(formData.booking_id),
          amount: parseFloat(formData.amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayments([response.data, ...payments]);
      setFormData({ booking_id: '', customer_name: '', amount: '', payment_method: 'cash' });
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payment');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="main-content flex-1">
        <h1 className="page-title">Payments</h1>
        <button className="btn" onClick={() => setShowModal(true)} disabled={loading}>Add New Payment</button>
        
        {error && <div style={{ color: 'red', padding: '10px', margin: '10px 0' }}>{error}</div>}
        
        {loading ? (
          <p>Loading payments...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments && payments.length > 0 ? (
                payments.map(p => (
                  <tr key={p.id}>
                    <td>{p.booking_id}</td>
                    <td>{p.customer_name || 'N/A'}</td>
                    <td>₹{parseFloat(p.amount).toFixed(2)}</td>
                    <td>{p.payment_method}</td>
                    <td>{p.status}</td>
                    <td>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No payments found</td></tr>
              )}
            </tbody>
          </table>
        )}

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Payment</h2>
              {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Booking ID</label>
                  <select 
                    name="booking_id" 
                    value={formData.booking_id} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="">Select Booking</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>
                        Booking #{b.id} - {b.customer_name} (₹{b.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Customer Name</label>
                  <input 
                    type="text" 
                    name="customer_name" 
                    value={formData.customer_name} 
                    onChange={handleChange} 
                    placeholder="Auto-filled from booking"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input 
                    type="number" 
                    name="amount" 
                    value={formData.amount} 
                    onChange={handleChange} 
                    placeholder="Auto-filled from booking price"
                    min="0" 
                    step="0.01" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select name="payment_method" value={formData.payment_method} onChange={handleChange} required>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
                <div className="modal-buttons">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn">Save Payment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payments;