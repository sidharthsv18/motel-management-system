import { useState } from 'react';
import Sidebar from '../components/Sidebar';

function Payments() {
  const [showModal, setShowModal] = useState(false);
  const [payments, setPayments] = useState([
    { id: 1, bookingId: 1, totalAmount: 2000, paidAmount: 2000, paymentMethod: 'cash', paymentDate: '2023-10-01' }
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
        <h1 className="page-title">Payments</h1>
        <button className="btn" onClick={() => setShowModal(true)}>Add New Payment</button>
        <table className="table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Total Amount</th>
              <th>Paid Amount</th>
              <th>Payment Method</th>
              <th>Payment Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td>{p.bookingId}</td>
                <td>₹{p.totalAmount}</td>
                <td>₹{p.paidAmount}</td>
                <td>{p.paymentMethod}</td>
                <td>{p.paymentDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Payment</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Booking ID</label>
                  <input type="number" required />
                </div>
                <div className="form-group">
                  <label>Total Amount</label>
                  <input type="number" min="0" required />
                </div>
                <div className="form-group">
                  <label>Paid Amount</label>
                  <input type="number" min="0" required />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select required>
                    <option value="">Select Method</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Date</label>
                  <input type="date" required />
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