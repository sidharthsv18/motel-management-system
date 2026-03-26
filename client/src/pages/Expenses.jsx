import { useState } from 'react';
import Sidebar from '../components/Sidebar';

function Expenses() {
  const [showModal, setShowModal] = useState(false);
  const [expenses, setExpenses] = useState([
    { id: 1, date: '2023-10-01', expenseType: 'Salary', amount: 1000, paidTo: 'John', notes: 'Monthly salary' }
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
        <h1 className="page-title">Expenses</h1>
        <button className="btn" onClick={() => setShowModal(true)}>Add New Expense</button>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense Type</th>
              <th>Amount</th>
              <th>Paid To</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>{e.expenseType}</td>
                <td>₹{e.amount}</td>
                <td>{e.paidTo}</td>
                <td>{e.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Expense</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" required />
                </div>
                <div className="form-group">
                  <label>Expense Type</label>
                  <select required>
                    <option value="">Select Type</option>
                    <option value="Salary">Salary</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input type="number" min="0" required />
                </div>
                <div className="form-group">
                  <label>Paid To</label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea rows="3"></textarea>
                </div>
                <div className="modal-buttons">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn">Save Expense</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Expenses;