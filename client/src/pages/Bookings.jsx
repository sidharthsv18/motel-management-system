import { useState } from 'react';
import Sidebar from '../components/Sidebar';

function Bookings() {
  const [showModal, setShowModal] = useState(false);
  const [bookings, setBookings] = useState([
    { id: 1, customer: 'John Doe', phone: '1234567890', checkIn: '2023-10-01', checkOut: '2023-10-02', room: 1, guests: 2, price: 2000, status: 'Checked-in' }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // For demo, just close
    setShowModal(false);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="main-content flex-1">
        <h1 className="page-title">Bookings</h1>
        <button className="btn" onClick={() => setShowModal(true)}>Add New Booking</button>
        <table className="table">
          <thead>
            <tr>
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
            {bookings.map(b => (
              <tr key={b.id}>
                <td>{b.customer}</td>
                <td>{b.phone}</td>
                <td>{b.checkIn}</td>
                <td>{b.checkOut}</td>
                <td>{b.room}</td>
                <td>{b.guests}</td>
                <td>₹{b.price}</td>
                <td>{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Booking</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Customer Name</label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" required />
                </div>
                <div className="form-group">
                  <label>Check-in Date</label>
                  <input type="date" required />
                </div>
                <div className="form-group">
                  <label>Check-out Date</label>
                  <input type="date" required />
                </div>
                <div className="form-group">
                  <label>Room Number</label>
                  <select required>
                    <option value="">Select Room</option>
                    {Array.from({length: 16}, (_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of Guests</label>
                  <input type="number" min="1" required />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" min="0" required />
                </div>
                <div className="modal-buttons">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn">Save Booking</button>
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