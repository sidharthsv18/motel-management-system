import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    room_number: '',
    status: 'available',
    price_per_night: ''
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms');
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
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/rooms', 
        {
          ...formData,
          price_per_night: parseFloat(formData.price_per_night)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRooms([response.data, ...rooms]);
      setFormData({ room_number: '', status: 'available', price_per_night: '' });
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'available': return 'room-available';
      case 'occupied': return 'room-occupied';
      case 'cleaning': return 'room-cleaning';
      case 'maintenance': return 'room-maintenance';
      default: return '';
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="main-content flex-1">
        <h1 className="page-title">Rooms</h1>
        <button className="btn" onClick={() => setShowModal(true)}>Add New Room</button>
        
        {error && <div style={{ color: 'red', padding: '10px', margin: '10px 0' }}>{error}</div>}
        
        {loading ? (
          <p>Loading rooms...</p>
        ) : (
          <div className="grid grid-cols-4">
            {rooms.map(r => (
              <div key={r.id} className={`room-card ${getStatusClass(r.status)}`}>
                <h3>Room {r.room_number}</h3>
                <p>{r.status}</p>
                <p>₹{r.price_per_night}/night</p>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Room</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Room Number</label>
                  <input type="text" name="room_number" value={formData.room_number} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price per Night</label>
                  <input type="number" name="price_per_night" value={formData.price_per_night} onChange={handleChange} min="0" step="0.01" required />
                </div>
                <div className="modal-buttons">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn">Save Room</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rooms;