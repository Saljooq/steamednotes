import React from 'react';

interface Note {
  ID: number;
  Content: string;
  Owner: string;
}

interface NotesProps {
  username: string;
  notes: Note[];
  newNote: string;
  setNewNote: (value: string) => void;
  handleCreateNote: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function Notes({ 
  username, 
  notes, 
  newNote, 
  setNewNote, 
  handleCreateNote 
}: NotesProps) { 
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
        {notes?.length > 0 ? (
          notes.map((note) => <li key={note.ID}>{note.Content}</li>)
        ) : (
          <li>No notes yet</li>
        )}
      </ul>
    </div>
  );
}