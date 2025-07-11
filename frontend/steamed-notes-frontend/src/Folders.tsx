import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from './Breadcrumbs';
import UserMenu from './UserMenu';
import { logout } from './helper/Logout';
import LoadingScreen from './Loading';

interface Folder {
  id: string;
  name: string;
  roomId: string;
}

interface FolderAPIInterface{
  ID: string;
  Name: string;
  CreatedAt: EpochTimeStamp;
}

function transformFromApiToFolder(input: FolderAPIInterface, roomId: string): Folder{
  return {id: input.ID, name: input.Name, roomId: roomId} as Folder
}

const CreateFolderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}> = ({ isOpen, onClose, onCreate }) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = (name: string): string => {
    if (!name.trim()) return 'Folder name is required';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateName(folderName);
    setError(validationError);

    if (!validationError) {
      setIsSubmitting(true);
      try {
        await onCreate(folderName);
        setFolderName('');
        onClose();
      } catch {
        setError('Failed to create folder');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-yellow-100 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Folder</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700">Folder Name</label>
            <input
              type="text"
              id="folderName"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError('');
              }}
              autoFocus
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter folder name"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setFolderName('');
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

interface FolderScreenProp {
  setLoggedOut: React.Dispatch<React.SetStateAction<boolean>>;
}

const FoldersScreen: React.FC<FolderScreenProp> = ({setLoggedOut}) => {
  const { roomId } = useParams<{ roomId: string }>();
  const [ roomName, setRoomName ] = useState<string>();
  const [ isLoadingRoomDetails, setIsLoadingRoomDetails ] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [error, setError] = useState('');
  const [refreshToggle, setRefreshToggle] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) {
      navigate('/rooms');
      return;
    }
    // let mounted = true;
    setIsLoadingFolders(true);
    setIsLoadingRoomDetails(true);
    setError('');
    // TODO: Fetch folders for roomId
    // Example: fetch(`/api/rooms/${roomId}/folders`).then(res => res.json()).then(data => setFolders(data));
    
    fetch(`/api/folders/get?room_id=${roomId}`).then((response) => {
      if (response.ok){
        return response.json(); // Parse JSON if response is OK
      } else {
        throw new Error("Response was not okay, status:" + response.status + " " + response.statusText)
      }
    })
    .then((data) => {
      if (data != null) {
        let foldersData: FolderAPIInterface[] = data as  FolderAPIInterface[]
        let transformedData: Folder[] = foldersData.map(x => transformFromApiToFolder(x, roomId))

        setFolders(transformedData)
        setIsLoadingFolders(false);
      } else {
        setFolders([]);
        setIsLoadingFolders(false);
      }
    })
    .catch((err) => {
      console.error("Fetch error:", error);
      updateError(err)
    });



    fetch(`/api/rooms/getdetails?room_id=${roomId}`).then((response) => {
      if (response.ok){
        return response.json(); // Parse JSON if response is OK
      } else {
        throw new Error("Response was not okay, status:" + response.status + " " + response.statusText)
      }
    })
    .then((data) => {
      if (data != null) {
        setRoomName(data.room_name)
        setIsLoadingRoomDetails(false);
      } else {
        setRoomName('')
        setIsLoadingRoomDetails(false);
      }
    })
    .catch((err) => {
      console.error("Fetch error:", error);
      updateError(err)
    });

  }, [roomId, refreshToggle]);

  function updateError(err: string){
      setError(old => {
        if (old === '') {
          return err
        } else {
          return old + "\n" + err
        }
      })
      throw err;
    }


  const handleCreateFolder = async (name: string) => {
    try {
      // TODO: Create folder via API
      // Example: await fetch(`/api/rooms/${roomId}/folders`, { method: 'POST', body: JSON.stringify({ name }) });
      console.log('Creating folder:', name);

    fetch(`/api/folders/create`, 
       { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: parseInt(roomId!), folder_name: name }) }
    ).then((response) => {
      if (response.ok){
        return response.json(); // Parse JSON if response is OK
      } else {
        throw new Error("Response was not okay when creating a folder, status:" + response.status + " " + response.statusText)
      }
    })
    .then((_) => {
      setRefreshToggle(x => !x);
    })
    .catch((err) => {
      console.error("API error:", error);
      updateError(err)
    });

    } catch (err) {
      console.error('Error creating folder:', err);
      updateError(String(err));
    }
  };


  return (
    <div className="min-h-screen bg-yellow-50 bg-[repeating-linear-gradient(to_bottom,_transparent_0px,_transparent_24px,#e0e0e0_25px,#e0e0e0_26px)] flex justify-center p-4">
      <div className="bg-yellow-100 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        {/* <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Folders in Room</h2> */}
        {isLoadingFolders || isLoadingRoomDetails ? (
          <LoadingScreen msg={'Loading Folders...'} />
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : folders.length === 0 ? (
          <>
          <div className="flex items-center justify-between mb-4">
          <Breadcrumb room={{id:roomId!, name:roomName!}}/>
          <UserMenu initials="SA" onLogout={() => logout(navigate, setLoggedOut)} />
          </div>
          <div className="text-center py-8">
            <p className="text-5xl mb-4">🙁</p>
            <p className="text-lg italic text-gray-700 shadow-sm">No Folders Available</p>
            <p className="text-sm text-gray-600 mt-2">Create a new folder to get started!</p>
          </div>
          </>
        ) : (
          <>
          <div className="flex items-center justify-between mb-4">
          <Breadcrumb room={{id:roomId!, name:roomName!}}/>
          <UserMenu initials="SA" onLogout={() => logout(navigate, setLoggedOut)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center space-x-3 p-4 bg-yellow-200 border border-yellow-300 rounded-lg shadow-sm cursor-pointer hover:bg-yellow-300 transition"
              onClick={() => navigate(`/folder/${folder.id}`)}
            >
              <div className="text-yellow-700 text-2xl">📁</div>
              <div className="text-gray-800 font-semibold">{folder.name}</div>
            </div>))}
          </div></>
        )}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Folder
        </button>
        <CreateFolderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateFolder}
        />
      </div>
    </div>
  );
};

export default FoldersScreen;