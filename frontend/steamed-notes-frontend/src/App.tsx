import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SignIn } from "./SignIn";
import Terminal from "./terminal/Terminal"
import Notes from "./Notes";
import SignupForm from "./CreateUser";
import RoomsScreen from "./Rooms";

interface Note {
  ID: number
  Content: string
  Owner: string
}

function App() {
  const [username, setUsername] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [ hasCheckedSignIn, setHasCheckedSignIn] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");

  const apiUrl = window.location.origin;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/notes`, {
          credentials: "include",
        });
        setHasCheckedSignIn(true);
        if (res.ok) {
          console.log("Sign in successful")
          setSignedIn(true);
          await fetchNotes();
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setHasCheckedSignIn(true);
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
            hasCheckedSignIn ? (
              signedIn ? (
                <Notes
                  username={username}
                  notes={notes}
                  newNote={newNote}
                  setNewNote={setNewNote}
                  handleCreateNote={handleCreateNote}
                />
              ) : (
                <Navigate to="/signin" />
              )
            ) : <h1>Loading...</h1>
          }
        />
        <Route path="/signup" element={<SignupForm/>} />
        <Route path="terminal" element={<Terminal/>}/>
        <Route path="/" element={<Navigate to="/notes" />} />
        <Route path="/rooms" element={<RoomsScreen/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;