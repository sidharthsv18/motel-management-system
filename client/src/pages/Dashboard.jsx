import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState({
    todayCheckIns: 0,
    todayCheckOuts: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    todayRevenue: 0,
    todayExpenses: 0,
    todayProfit: 0
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, [selectedDate]);

  // Mock check-in/out lists
  const getListsForDate = (date) => ({
    checkIns: date === new Date().toISOString().split('T')[0] ? [
      { name: 'John Doe', room: 101, time: '10:00 AM' },
      { name: 'Jane Smith', room: 102, time: '11:30 AM' }
    ] : [],
    checkOuts: date === new Date().toISOString().split('T')[0] ? [
      { name: 'Bob Johnson', room: 103, time: '2:00 PM' }
    ] : []
  });

  const lists = getListsForDate(selectedDate);

  // Mock chart data
  const revenueData = [
    { day: 'Mon', revenue: 4200 },
    { day: 'Tue', revenue: 3800 },
    { day: 'Wed', revenue: 5100 },
    { day: 'Thu', revenue: 4600 },
    { day: 'Fri', revenue: 5800 },
    { day: 'Sat', revenue: 6200 },
    { day: 'Sun', revenue: 5500 }
  ];

  const checkInOutData = [
    { day: 'Mon', checkIns: 3, checkOuts: 2 },
    { day: 'Tue', checkIns: 2, checkOuts: 3 },
    { day: 'Wed', checkIns: 4, checkOuts: 1 },
    { day: 'Thu', checkIns: 3, checkOuts: 2 },
    { day: 'Fri', checkIns: 5, checkOuts: 3 },
    { day: 'Sat', checkIns: 6, checkOuts: 4 },
    { day: 'Sun', checkIns: 4, checkOuts: 5 }
  ];

  const roomData = [
    { name: 'Occupied', value: 3, color: '#3498db' },
    { name: 'Available', value: 13, color: '#2ecc71' }
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="main-content">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1 className="dashboard-title">Dashboard</h1>
            <div className="date-picker">
              <label htmlFor="date-select">Select Date: </label>
              <input
                type="date"
                id="date-select"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
            </div>
          </div>
          <div className="kpi-grid">
            <div className="card">
              <h3>Check-ins</h3>
              <p>{data.todayCheckIns}</p>
            </div>
            <div className="card">
              <h3>Check-outs</h3>
              <p>{data.todayCheckOuts}</p>
            </div>
            <div className="card">
              <h3>Available Rooms</h3>
              <p>{data.availableRooms}</p>
            </div>
            <div className="card">
              <h3>Occupied Rooms</h3>
              <p>{data.occupiedRooms}</p>
            </div>
            <div className="card">
              <h3>Revenue</h3>
              <p>₹{data.todayRevenue}</p>
            </div>
            <div className="card">
              <h3>Expenses</h3>
              <p>₹{data.todayExpenses}</p>
            </div>
            <div className="card">
              <h3>Profit</h3>
              <p>₹{data.todayProfit}</p>
            </div>
          </div>

          <div className="charts-section">
            <h2 className="section-title">Weekly Overview</h2>
            <div className="charts-grid">
              <div className="chart-card">
                <h3>Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#3498db" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Check-ins vs Check-outs</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={checkInOutData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="checkIns" fill="#2ecc71" name="Check-ins" />
                    <Bar dataKey="checkOuts" fill="#e74c3c" name="Check-outs" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Room Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={roomData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roomData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="lists-grid">
            <div className="list-card">
              <h3>Check-ins</h3>
              {lists.checkIns.length > 0 ? lists.checkIns.map((checkIn, index) => (
                <div key={index} className="list-item">
                  <span>{checkIn.name} - Room {checkIn.room}</span>
                  <span>{checkIn.time}</span>
                </div>
              )) : <p className="no-data">No check-ins for selected date</p>}
            </div>
            <div className="list-card">
              <h3>Check-outs</h3>
              {lists.checkOuts.length > 0 ? lists.checkOuts.map((checkOut, index) => (
                <div key={index} className="list-item">
                  <span>{checkOut.name} - Room {checkOut.room}</span>
                  <span>{checkOut.time}</span>
                </div>
              )) : <p className="no-data">No check-outs for selected date</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;