import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

function Expenses() {
  const [showModal, setShowModal] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses');
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
      const response = await axios.post('/api/expenses',
        {
          ...formData,
          amount: parseFloat(formData.amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExpenses([response.data, ...expenses]);
      setFormData({ category: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] });
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create expense');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="main-content flex-1">
        <h1 className="page-title">Expenses</h1>
        <button className="btn" onClick={() => setShowModal(true)} disabled={loading}>Add New Expense</button>
        
        {error && <div style={{ color: 'red', padding: '10px', margin: '10px 0' }}>{error}</div>}
        
        {loading ? (
          <p>Loading expenses...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses && expenses.length > 0 ? (
                expenses.map(e => (
                  <tr key={e.id}>
                    <td>{e.expense_date ? new Date(e.expense_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{e.category}</td>
                    <td>{e.description || '-'}</td>
                    <td>₹{parseFloat(e.amount).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center' }}>No expenses found</td></tr>
              )}
            </tbody>
          </table>
        )}

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Expense</h2>
              {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" name="expense_date" value={formData.expense_date} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Select Category</option>
                    <option value="Salary">Salary</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" rows="3" value={formData.description} onChange={handleChange}></textarea>
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input type="number" name="amount" value={formData.amount} onChange={handleChange} min="0" step="0.01" required />
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