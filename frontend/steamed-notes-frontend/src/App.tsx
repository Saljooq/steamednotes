import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SignIn } from "./SignIn";
import Notes from "./Notes";

interface Note {
  ID: number
  Content: string
  Owner: string
}

function App() {
  const [username, setUsername] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");

  const apiUrl = window.location.origin;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/notes`, {
          credentials: "include",
        });
        if (res.ok) {
          setSignedIn(true);
          await fetchNotes();
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    };
    checkAuth();
  }, []);

  const fetchNotes = async () => {
    const res = await fetch(`${apiUrl}/api/notes`, {
      headers: { "X-Username": username },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const data = await res.json();
    console.log("Here's what we got")
    console.log(data)
    setNotes(data);
    
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${apiUrl}/api/notes/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Username": username,
      },
      body: JSON.stringify({ content: newNote }),
      credentials: "include",
    });
    if (res.ok) {
      setNewNote("");
      fetchNotes();
    }
  };
  
  const handleSignInSuccess = (user: string) => {
    setSignedIn(true);
    setUsername(user);
    fetchNotes();
  };



  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/signin"
          element={signedIn ? <Navigate to="/notes" /> : <SignIn onSignIn={handleSignInSuccess} />}
        />
        <Route
          path="/notes"
          element={
            signedIn ? (
              <Notes
                username={username}
                fetchNotes={fetchNotes}
                notes={notes}
                newNote={newNote}
                setNewNote={setNewNote}
                handleCreateNote={handleCreateNote}
              />
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        <Route path="/" element={<Navigate to="/notes" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;