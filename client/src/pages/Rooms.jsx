import Sidebar from '../components/Sidebar';

function Rooms() {
  const rooms = Array.from({length: 16}, (_, i) => ({ id: i+1, status: i < 3 ? 'occupied' : 'available' }));

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
        <div className="grid grid-cols-4">
          {rooms.map(r => (
            <div key={r.id} className={`room-card ${getStatusClass(r.status)}`}>
              <h3>Room {r.id}</h3>
              <p>{r.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Rooms;