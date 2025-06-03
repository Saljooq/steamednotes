import { useEffect, useState } from "react";

interface Room {
  id: string;
  name: string;
}

export default function RoomsScreen(){
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Simulate fetching rooms (replace with API call)
  useEffect(() => {
    // TODO: Implement API call to fetch rooms
    // Example: fetch('/api/rooms').then(res => res.json()).then(data => setRooms(data));
    // Simulated data for demonstration
    const dummyRooms: Room[] = [
      // { id: '1', name: 'Meeting Room A' },
      // { id: '2', name: 'Creative Space' },
    ];
    setRooms(dummyRooms);
  }, []);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      // TODO: Implement API call to create a new room
      // Example: await fetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name: 'New Room' }) });
      console.log("Creating new room");
      // Simulate adding a room (replace with actual API response)
      setRooms((prev) => [
        ...prev,
        { id: Date.now().toString(), name: `Room ${prev.length + 1}` },
      ]);
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 bg-[repeating-linear-gradient(to_bottom,_transparent_0px,_transparent_24px,_#e0e0e0_25px,_#e0e0e0_26px)] flex items-center justify-center p-4">
      <div className="bg-yellow-100 p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Your Rooms
        </h2>
        {rooms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-5xl mb-4">🙁</p>
            <p className="text-lg italic text-gray-700 shadow-sm">
              No Rooms Available
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Create a new room to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-yellow-50 p-4 rounded-md border border-gray-200 shadow-sm"
              >
                <h3 className="text-md font-medium text-gray-800">
                  {room.name}
                </h3>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create New Room"}
        </button>
      </div>
    </div>
  );
};
