import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Breadcrumb from "./Breadcrumbs";
import UserMenu from "./UserMenu";
import { logout } from "./helper/Logout";
import LoadingScreen from "./Loading";

interface Note {
  id: string;
  name: string;
  content: string;
  folderId: string;
  roomId: string;
}

interface NoteAPIInterface {
  ID: string;
  Title: string;
  Content: string;
  FolderID: string;
  RoomID: string;
  RoomName: string;
  FolderName: string;
  CreatedAt: number;
}

function transformFromApiToNote(input: NoteAPIInterface): Note {
  return {
    id: input.ID,
    name: input.Title,
    content: input.Content,
    folderId: input.FolderID,
    roomId: input.RoomID,
  } as Note;
}

interface NoteScreenProp {
  setLoggedOut: React.Dispatch<React.SetStateAction<boolean>>;
}

const NoteScreen: React.FC<NoteScreenProp> = ({ setLoggedOut }) => {
  const { noteId } = useParams<{ noteId: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [folderName, setFolderName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [unsavedContent, setUnsavedContent] = useState<string>("");
  const [unsavedName, setUnsavedName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!noteId) {
      navigate("/rooms");
      return;
    }
    let mounted = true;
    setIsLoading(true);
    setError("");

    fetch(`/api/notes/getnote?note_id=${noteId}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error(
          `Response was not okay, status: ${response.status} ${response.statusText}`
        );
      })
      .then((data: NoteAPIInterface) => {
        if (mounted && data) {
          setNote(transformFromApiToNote(data));
          setUnsavedContent(data.Content);
          setUnsavedName(data.Title);
          setRoomName(data.RoomName);
          setFolderName(data.FolderName);
          setIsLoading(false);
        } else if (mounted) {
          setNote(null);
          setUnsavedContent("");
          setRoomName("");
		  setUnsavedName("")
          setFolderName("");
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Fetch error:", err);
          setError(String(err));
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [noteId, navigate]);

  const handleContentChange = (content: string) => {
    setUnsavedContent(content);
  };

  const handleNameChange = (name: string) => {
    setUnsavedName(name);
  };

  const handleSave = async () => {
    if (!note) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/note/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parseInt(noteId!),
          content: unsavedContent,
          title: note.name,
        }),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(
          `Response was not okay, status: ${response.status} ${response.statusText}`
        );
      }
      setNote({ ...note, content: unsavedContent });
      setIsSaving(false);
    } catch (err) {
      console.error("Error updating note:", err);
      setError(String(err));
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 bg-[repeating-linear-gradient(to_bottom,_transparent_0px,_transparent_24px,#e0e0e0_25px,#e0e0e0_26px)] flex justify-center p-4">
      <div className="bg-yellow-100 p-8 rounded-lg shadow-lg w-full max-w-2xl">
        {isLoading ? (
          <LoadingScreen msg="Loading Note..." />
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : !note ? (
          <p className="text-center text-red-600">Note not found</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <Breadcrumb
                room={{ id: note.roomId, name: roomName }}
                folder={{ id: note.folderId, name: folderName }}
                note={{ id: note.id, name: unsavedName }}
              />
              <UserMenu
                initials="SA"
                onLogout={() => logout(navigate, setLoggedOut)}
              />
            </div>
            <input
              value={unsavedName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full p-2 mb-4 bg-yellow-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xl text-gray-800"
              placeholder="Enter note name"
            />
            <textarea
              value={unsavedContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-96 p-4 bg-yellow-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-gray-800"
              placeholder="Write your note here..."
            />
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={handleSave}
                disabled={
                  isSaving ||
                  (unsavedName === note.name && unsavedContent === note.content)
                }
                className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NoteScreen;
