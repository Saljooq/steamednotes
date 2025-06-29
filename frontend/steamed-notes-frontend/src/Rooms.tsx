import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './Loading';
import Breadcrumb from './Breadcrumbs';
import UserMenu from './UserMenu';
import { logout } from './helper/Logout';

interface Room {
  // key: string,
  ID: string;
  Name: string;
  CreatedAt: string;
}
type RoomHandler = (rooms: Room[]) => void;
type setIsLoadingProp = (isLoading:boolean) => void;
const fetchRooms = (setRoom: RoomHandler, setIsLoading: setIsLoadingProp) => {
  fetch(
      '/api/rooms/get'
    ).then((response) => {
      if (response.ok){
        return response.json(); // Parse JSON if response is OK
      } else {
        throw new Error("Response was not okay")
      }
    })
    .then((data) => {
      console.log("Data received:", data);
      if (data != null) {
        setRoom(data)
        setIsLoading(false);
      } else {
        setRoom([]);
        setIsLoading(false);
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
}

const CreateRoomModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}> = ({ isOpen, onClose, onCreate }) => {
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = (name: string): string => {
    if (!name.trim()) return 'Room name is required';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateName(roomName);
    setError(validationError);

    if (!validationError) {
      setIsSubmitting(true);
      try {
        await onCreate(roomName);
        setRoomName('');
        onClose();
      } catch {
        setError('Failed to create room');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-yellow-100 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Room</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700">
              Room Name
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                setError('');
              }}
              autoFocus
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter room name"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setRoomName('');
                setError('');
                onClose();
              }}
              className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RoomScreenProp {
  setLoggedOut: React.Dispatch<React.SetStateAction<boolean>>;
}

const RoomsScreen: React.FC<RoomScreenProp> = ({setLoggedOut}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms(setRooms, setIsLoading)
  }, []);

  const handleCreateRoom = async (name: string) => {
    try {
      // TODO: Implement API call to create a new room
      // Example: await fetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name }) });
      console.log('Creating new room:', name);

      setIsLoading(true)
      fetch('/api/rooms/create', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: name }) }
      ).then((res) => {
        if (!res.ok){
          throw new Error("Error when calling create room")
        }
      }).then((_) => {
        fetchRooms(setRooms, setIsLoading)
      })
        
    } catch (error) {
      console.error('Error creating room:', error);
      throw error; // Rethrow for modal to handle
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 bg-[repeating-linear-gradient(to_bottom,_transparent_0px,_transparent_24px,#e0e0e0_25px,#e0e0e0_26px)] flex  justify-center p-4">
      <div className="bg-yellow-100 p-8 rounded-lg shadow-lg w-full max-w-2xl">
        { isLoading ? <LoadingScreen msg="Loading rooms..."/> : ( <>
        <div className="flex items-center justify-between mb-4">
          <Breadcrumb />
          <UserMenu initials="SA" onLogout={() => logout(navigate, setLoggedOut)} />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Your Rooms</h2>
        {rooms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-5xl mb-4">🙁</p>
            <p className="text-lg italic text-gray-700 shadow-sm">No Rooms Available</p>
            <p className="text-sm text-gray-600 mt-2">Create a new room to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.ID}
                className="bg-yellow-50 p-4 rounded-md border border-gray-200 shadow-sm cursor-pointer hover:bg-yellow-200"
                onClick={() => navigate("/rooms/" + room.ID)}
              >
                <h3 className="text-md font-medium text-gray-800">{room.Name}</h3>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Room
        </button>
        </>)}
        <CreateRoomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateRoom}
        />
      </div>
    </div>
  );
};

export default RoomsScreen;