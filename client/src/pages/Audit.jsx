import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

function Audit() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/audit', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatChanges = (oldValues, newValues) => {
    if (!oldValues && newValues) return 'Created new record';
    if (oldValues && !newValues) return 'Deleted record';
    if (oldValues && newValues) return 'Updated record';
    return 'Unknown action';
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="main-content">
          <div className="dashboard-container">
            <p>Loading audit logs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="main-content">
          <div className="dashboard-container">
            <p style={{color: 'red'}}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="main-content">
        <div className="dashboard-container">
          <h1 className="dashboard-title">Audit Logs</h1>
          <p style={{marginBottom: '20px', color: '#666'}}>
            Track all changes made to the system with user details and timestamps.
          </p>

          <div className="audit-table-container">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Record ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>{log.user_email}</td>
                    <td>
                      <span className={`action-badge action-${log.action.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.table_name}</td>
                    <td>{log.record_id || 'N/A'}</td>
                    <td>{formatChanges(log.old_values, log.new_values)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {auditLogs.length === 0 && (
            <p style={{textAlign: 'center', color: '#666', padding: '40px'}}>
              No audit logs found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Audit;