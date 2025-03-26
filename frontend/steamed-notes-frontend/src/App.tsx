import { useState } from "react";

interface Note {
  ID: number
  Content: string
  Owner: string
}

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");

  const apiUrl = window.location.origin;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${apiUrl}/api/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      setSignedIn(true);
      fetchNotes();
    } else {
      alert("Sign-in failed");
    }
  };

  const fetchNotes = async () => {
    const res = await fetch(`${apiUrl}/api/notes`, {
      headers: { "X-Username": username },
    });
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
    });
    if (res.ok) {
      setNewNote("");
      fetchNotes();
    }
  };

  if (!signedIn) {
    return (
      <div>
        <h1>Steamed Notes - Sign In</h1>
        <form onSubmit={handleSignIn}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button type="submit">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1>Steamed Notes - {username}</h1>
      <form onSubmit={handleCreateNote}>
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="New note"
        />
        <button type="submit">Add Note</button>
      </form>
      <ul>
        {notes.length > 0 ? (
          notes.map((note) => <li key={note.ID}>{note.Content}</li>)
        ) : (
          <li>No notes yet</li>
        )}
      </ul>
    </div>
  );
}

export default App;