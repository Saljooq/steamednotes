import { useEffect, useRef, useState } from "react";
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

interface FolderNote { // + Added for folder notes
  id: string;
  name: string;
}

function transformFromApiToFolderNote(input: { ID: string; Title: string; CreatedAt: number }): FolderNote {
  return { id: input.ID, name: input.Title } as FolderNote;
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
  const [folderNotes, setFolderNotes] = useState<FolderNote[]>([]); // + Added for folder notes
  const [isLoadingFolderNotes, setIsLoadingFolderNotes] = useState(false);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aspectRatio = window.innerHeight / window.innerWidth;
  const [showFolderView, setShowFolderView] = useState(aspectRatio < 1); // + Added for toggle

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
          // + Update folder notes if already shown
          if (showFolderView) {
            setFolderNotes((prev) =>
              prev.map((n) =>
                n.id === data.ID ? { ...n, name: data.Title } : n
              )
            );
          }
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
          title: unsavedName,
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

  useEffect(() => { // + Added for auto-resize
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      textarea.style.height = `${textarea.scrollHeight + 50}px`; // Set to content height
    }
  }, [unsavedContent]); // + Trigger on content change

  useEffect(() => { // + Added for Ctrl + Up or Ctrl + Down
    const handleNoteChange = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "ArrowDown") {
        event.preventDefault();

        var noteIdx: number | null = null;
        for (let i = 0; i < folderNotes.length; i++){
          if (noteId! == folderNotes[i].id){
            noteIdx = i;
            break;
          }
        }
        navigate(`/note/${folderNotes[(noteIdx! + 1) % folderNotes.length].id}`)
      }  
      
      if (event.ctrlKey && event.key === "ArrowUp") {
        event.preventDefault();
        var noteIdx: number | null = null;
        for (let i = 0; i < folderNotes.length; i++){
          if (noteId! == folderNotes[i].id){
            noteIdx = i;
            break;
          }
        }

        if ( noteIdx! > 0){
          navigate(`/note/${folderNotes[noteIdx! - 1].id}`)
        } else {
          navigate(`/note/${folderNotes[noteIdx! - 1 + folderNotes.length].id}`)
        }
      }
    };
    document.addEventListener('keydown', handleNoteChange as any);
    return () => {
      document.removeEventListener('keydown', handleNoteChange as any);
    };
  }, [folderNotes]);


  useEffect(() => { // + Added for Ctrl + S
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown as any);
    return () => {
      document.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [handleSave]);


  useEffect(() => { // + Added to fetch folder notes
    if (!showFolderView || !note?.folderId) return;
    setIsLoadingFolderNotes(true);
    fetch(`/api/notes?folder_id=${note.folderId}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error(`Response was not okay, status: ${response.status} ${response.statusText}`);
      })
      .then((data) => {
        const notesData: { ID: string; Title: string; CreatedAt: number }[] = data;
        setFolderNotes(notesData.map(transformFromApiToFolderNote));
        setIsLoadingFolderNotes(false);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError(String(err));
        setIsLoadingFolderNotes(false);
      });

    // setFolderNotes([{ID: "1", Name: "note", CreatedAt: 1}].map(transformFromApiToFolderNote));
    // setIsLoadingFolderNotes(false);
  }, [showFolderView, note?.folderId]);


  const handleSelectNote = (noteId: string) => { // + Added to switch notes
    if (noteId !== note?.id) {
      navigate(`/note/${noteId}`);
    }
  };

  const toggleFolderView = () => { // + Added to toggle folder view
    setShowFolderView(!showFolderView);
    setError('');
  };

  return (
    <div className="min-h-screen bg-yellow-50 bg-[repeating-linear-gradient(to_bottom,_transparent_0px,_transparent_24px,#e0e0e0_25px,#e0e0e0_26px)] flex justify-center p-4">
      <div className="relative min-h-screen w-full flex justify-center">
      <div className="bg-yellow-100 p-4 rounded-lg shadow-lg w-full max-w-4xl">
        {showFolderView && ( // + Added left panel
          <div className={`fixed top-0 left-0 h-full w-64 bg-yellow-100 p-4 shadow-lg transform ${showFolderView ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-10 overflow-y-auto`}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Notes in Folder</h2>
            {isLoadingFolderNotes ? (
              <LoadingScreen msg="Loading Notes..." />
            ) : error && showFolderView ? (
              <p className="text-center text-red-600">{error}</p>
            ) : folderNotes.length === 0 ? (
              <p className="text-center text-gray-600">No Notes Available</p>
            ) : (
              <div className="space-y-2">
                {folderNotes.map((folderNote) => (
                  <div
                    key={folderNote.id}
                    className={`flex items-center space-x-3 p-2 bg-yellow-200 border border-yellow-300 rounded-md cursor-pointer hover:bg-yellow-300 transition ${folderNote.id === note?.id ? 'bg-yellow-300' : ''}`}
                    onClick={() => handleSelectNote(folderNote.id)}
                  >
                    <div className="text-yellow-700 text-xl">📝</div>
                    <div className="text-gray-800 font-semibold">{folderNote.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="w-full">
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
              <div className="flex items-center space-x-2 select-none">
                  <div // + Added toggle button
                    onClick={toggleFolderView}
                      className="text-2xl text-yellow-700 hover:text-yellow-800 cursor-pointer"
                      title={showFolderView ? 'Hide Folder View' : 'Show Folder View'}
                  >
                    {showFolderView ? '📂' : '📁'}
                  </div>
              <UserMenu
                onLogout={() => logout(navigate, setLoggedOut)}
              />
              </div>
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
              className="w-full min-h-90 p-4 bg-yellow-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-gray-800 resize-none"
              ref={textareaRef}
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
      </div>
    </div>
  );
};

export default NoteScreen;
