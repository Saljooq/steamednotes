export default function Notes({ username, fetchNotes, notes, newNote, setNewNote, handleCreateNote }){ 
    
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