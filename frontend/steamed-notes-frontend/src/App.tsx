import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [notes, setNotes] = useState("")

  const apiUrl = window.location.origin;
  fetch(`${apiUrl}/api/notes`)
    .then(res => res.text())
    .then(setNotes)
    .catch(console.log)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div>
        <h1>Steamed Notes</h1>
        <p>{notes || "Loading notes...."}</p>
      </div>
    </>
  )
}

export default App
