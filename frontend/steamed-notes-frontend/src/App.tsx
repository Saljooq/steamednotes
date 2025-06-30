import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SignIn } from "./SignIn";
import Terminal from "./terminal/Terminal"
import SignupForm from "./CreateUser";
import RoomsScreen from "./Rooms";
import LoadingScreen from "./Loading";
import FoldersScreen from "./Folders";
import WebSocketComponent from "./Messages";
import NotesScreen from "./Notes";
import NoteScreen from "./Note";


function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [ hasCheckedSignIn, setHasCheckedSignIn] = useState(false);
  const [loggedOutToggle, setLoggedOut] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setSignedIn(false);
      setHasCheckedSignIn(false);
      console.log("Running use effect")
      try {
        const res = await fetch(`/api/users/issignedin`, {
          credentials: "include",
        });
        setHasCheckedSignIn(true);
        if (res.ok) {
          console.log("Sign in successful")
          setSignedIn(true);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setHasCheckedSignIn(true);
      } 
    };
    checkAuth();
  }, [loggedOutToggle]);


  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/signin"
          element={
            hasCheckedSignIn ? ( signedIn ? <RoomsScreen setLoggedOut={setLoggedOut}/> : <SignIn /> ) 
            : <LoadingScreen msg="Loading your notes..." />
          }
        />
        <Route path="/signup" element={<SignupForm/>} />
        <Route path="terminal" element={<Terminal/>}/>
        <Route path="/" element={<Navigate to="/signin" />} />
        <Route path="/rooms" element={<RoomsScreen setLoggedOut={setLoggedOut} />} />
        <Route path="/rooms/:roomId" element={<FoldersScreen setLoggedOut={setLoggedOut}/>} />
        <Route path="/folder/:folderId" element={<NotesScreen setLoggedOut={setLoggedOut}/>} />
        <Route path="/note/:noteId" element={<NoteScreen setLoggedOut={setLoggedOut}/>} />
        <Route path="/messages" element={<WebSocketComponent/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;