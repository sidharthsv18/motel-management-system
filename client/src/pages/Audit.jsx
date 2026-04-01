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
      const response = await axios.get('/api/audit', {
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

  const formatChanges = (changes) => {
    try {
      if (!changes) return 'Action recorded';
      if (typeof changes === 'string') {
        const parsed = JSON.parse(changes);
        return Object.entries(parsed)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ');
      }
      return Object.entries(changes)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');
    } catch {
      return String(changes);
    }
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
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Changes</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>
                      <span className={`action-badge action-${log.action.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.entity_type}</td>
                    <td>#{log.entity_id || 'N/A'}</td>
                    <td style={{fontSize: '12px', color: '#555'}}>{formatChanges(log.changes)}</td>
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