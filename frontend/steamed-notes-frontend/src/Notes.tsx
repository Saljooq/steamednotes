import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Breadcrumb from "./Breadcrumbs";
import UserMenu from "./UserMenu";
import { logout } from "./helper/Logout";
import LoadingScreen from "./Loading";

interface Note {
  id: string;
  name: string;
  folderId: string;
}

interface NoteAPIInterface {
  ID: string;
  Title: string;
  CreatedAt: number;
}

interface FolderAPIInterface {
  ID: string;
  RoomID: number;
  UserID: number;
  Name: string;
  CreatedAt: number;
  RoomName: string;
}

function transformFromApiToNote(
  input: NoteAPIInterface,
  folderId: string
): Note {
  return { id: input.ID, name: input.Title, folderId } as Note;
}

const ConfirmDeleteModal: React.FC<{ // + Added modal component
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  noteName: string;
}> = ({ isOpen, onClose, onConfirm, noteName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-yellow-100 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Delete Note</h3>
        <p className="text-sm text-red-600 mb-4">
          Please click Delete to confirm deleting the '{noteName}' note <br/> This action is irreversible
        </p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateNoteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}> = ({ isOpen, onClose, onCreate }) => {
  const [noteName, setNoteName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = (name: string): string => {
    if (!name.trim()) return "Note name is required";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateName(noteName);
    setError(validationError);

    if (!validationError) {
      setIsSubmitting(true);
      try {
        await onCreate(noteName);
        setNoteName("");
        onClose();
      } catch {
        setError("Failed to create note");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-yellow-100 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Create New Note
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="noteName"
              className="block text-sm font-medium text-gray-700"
            >
              Note Name
            </label>
            <input
              type="text"
              id="noteName"
              value={noteName}
              onChange={(e) => {
                setNoteName(e.target.value);
                setError("");
              }}
              autoFocus
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter note name"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setNoteName("");
                setError("");
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
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface NotesScreenProp {
  setLoggedOut: React.Dispatch<React.SetStateAction<boolean>>;
}

const NotesScreen: React.FC<NotesScreenProp> = ({ setLoggedOut }) => {
  const { folderId } = useParams<{ folderId: string }>();
  const [folderName, setFolderName] = useState<string>();
  const [roomName, setRoomName] = useState<string>();
  const [roomId, setRoomId] = useState<string>();
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [error, setError] = useState("");
  const [refreshToggle, setRefreshToggle] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // + Added for delete modal
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [noteNameToDelete, setNoteNameToDelete] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!folderId) {
      navigate("/rooms");
      return;
    }
    let mounted = true;
    setIsLoadingNotes(true);
    setIsLoadingDetails(true);
    setError("");

    // Fetch notes
    fetch(`/api/notes?folder_id=${folderId}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(
          `Response was not okay, status: ${response.status} ${response.statusText}`
        );
      })
      .then((data) => {
        if (mounted && data) {
          const notesData: NoteAPIInterface[] = data as NoteAPIInterface[];
          const transformedData: Note[] = notesData.map((x) =>
            transformFromApiToNote(x, folderId)
          );
          setNotes(transformedData);
          setIsLoadingNotes(false);
        } else if (mounted) {
          setNotes([]);
          setIsLoadingNotes(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Fetch error:", err);
          setError(String(err));
          setIsLoadingNotes(false);
        }
      });

    // Fetch folder and room details
    fetch(`/api/folders/getdetails?folder_id=${folderId}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(
          `Response was not okay, status: ${response.status} ${response.statusText}`
        );
      })
      .then((data: FolderAPIInterface) => {
        if (mounted && data) {
          setFolderName(data.Name);
          setRoomId(data.RoomID.toString());
          setRoomName(data.RoomName);
          setIsLoadingDetails(false);
        } else if (mounted) {
          setFolderName("");
          setRoomId("");
          setRoomName("");
          setIsLoadingDetails(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Fetch error:", err);
          setError(String(err));
          setIsLoadingDetails(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [folderId, refreshToggle, navigate]);

  useEffect(() => {
    // + Added click-outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenDeleteModal = (noteId: string, noteName: string) => { // + Added to open modal
    setNoteNameToDelete(noteName);
    setNoteToDelete(noteId);
    setDeleteModalOpen(true);
    setDropdownOpen(null);
   };

  const handleCreateNote = async (name: string) => {
    try {
      await fetch("/api/notes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder_id: parseInt(folderId!),
          note_name: name,
        }),
        credentials: "include",
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error(
            `Response was not okay when creating a note, status: ${response.status} ${response.statusText}`
          );
        })
        .then(() => {
          setRefreshToggle((x) => !x);
        })
        .catch((err) => {
          console.error("API error:", err);
          setError(String(err));
        });
    } catch (err) {
      console.error("Error creating note:", err);
      setError(String(err));
    }
  };
  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/note/delete?note_id=${noteId}`, {
        method: "DELETE",
        credentials: "include",
      }).then((response) => {
        if (!response.ok)
          throw new Error(
            `Response was not okay, status: ${response.status} ${response.statusText}`
          );
        setRefreshToggle((x) => !x);
        setDropdownOpen(null);
      });
    } catch (err) {
      console.error("Error deleting note:", err);
      setError(String(err));
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 bg-[repeating-linear-gradient(to_bottom,_transparent_0px,_transparent_24px,#e0e0e0_25px,#e0e0e0_26px)] flex justify-center p-4">
      <div className="bg-yellow-100 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        {isLoadingNotes || isLoadingDetails ? (
          <LoadingScreen msg="Loading Notes..." />
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <Breadcrumb
                room={{ id: roomId || "", name: roomName || "" }}
                folder={{ id: folderId || "", name: folderName || "" }}
              />
              <UserMenu
                onLogout={() => logout(navigate, setLoggedOut)}
              />
            </div>
            {notes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-5xl mb-4">🙁</p>
                <p className="text-lg italic text-gray-700 shadow-sm">
                  No Notes Available
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Create a new note to get started!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {notes.map((note) => (
                  <div key={note.id} className="relative">
                    <Link 
                      key={note.id}
                      className="flex items-center space-x-3 p-4 bg-yellow-200 border border-yellow-300 rounded-lg shadow-sm cursor-pointer hover:bg-yellow-300 transition"
                      to={`/note/${note.id}`} 
                    >
                      <div className="text-yellow-700 text-2xl">📝</div>
                      <div className="text-gray-800 font-semibold">
                        {note.name}
                      </div>
                    </Link>
                    <button 
                      onClick={() =>
                        setDropdownOpen(
                          dropdownOpen === note.id ? null : note.id
                        )
                      }
                      className="absolute top-2 right-2 text-gray-800 hover:bg-yellow-50 rounded-full p-1 focus:outline-none"
                    >
                      ⋯
                    </button>
                    {dropdownOpen === note.id && ( 
                      <div
                        ref={dropdownRef}
                        className="absolute top-8 right-2 bg-yellow-100 border border-gray-300 rounded-md shadow-lg z-10"
                      >
                        <button
                          onClick={() => handleOpenDeleteModal(note.id, note.name)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-yellow-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create New Note
            </button>
            <CreateNoteModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onCreate={handleCreateNote}
            />
          </>
        )}
        <ConfirmDeleteModal 
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setNoteToDelete(null);
            setNoteNameToDelete(null);
          }}
          onConfirm={() => {
            if (noteToDelete) handleDeleteNote(noteToDelete);
            setDeleteModalOpen(false);
            setNoteToDelete(null);
            setNoteNameToDelete(null);
          }}
          noteName={noteNameToDelete || ''}
        />
      </div>
    </div>
  );
};

export default NotesScreen;
