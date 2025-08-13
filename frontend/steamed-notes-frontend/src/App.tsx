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
import AdminPage from "./Admin";
import About from "./staticPages/About";
import Shortcuts from "./staticPages/Shortcuts";
import RequireAuth from "./RequireAuth";


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
            hasCheckedSignIn ? <SignIn setHasSignIn={setSignedIn}/> 
            : <LoadingScreen msg="Loading your notes..." />
          }
        />
        <Route path="/signup" element={<SignupForm/>} />
        <Route path="terminal" element={<Terminal/>}/>
        <Route path="/" element={hasCheckedSignIn ? (signedIn ? <Navigate to="/rooms"/> : <Navigate to="/signin" />) : <LoadingScreen msg="Loading..." />} />
        <Route path="/messages" element={<WebSocketComponent/>} />
        <Route path="/admin" element={<AdminPage/>} />
        <Route path="/about" element={<About/>} />
        <Route path="/shortcuts" element={<Shortcuts/>} />


        {/* PROTECTED PATHS BELOW */}
        <Route path="/note/:noteId" element={<RequireAuth isSignedIn={signedIn} hasCheckedSignIn={hasCheckedSignIn}><NoteScreen setLoggedOut={setLoggedOut}/></RequireAuth>} />
        <Route path="/rooms" element={<RequireAuth isSignedIn={signedIn} hasCheckedSignIn={hasCheckedSignIn}><RoomsScreen setLoggedOut={setLoggedOut} /></RequireAuth>} />
        <Route path="/rooms/:roomId" element={<RequireAuth isSignedIn={signedIn} hasCheckedSignIn={hasCheckedSignIn}><FoldersScreen setLoggedOut={setLoggedOut}/></RequireAuth>} />
        <Route path="/folder/:folderId" element={<RequireAuth isSignedIn={signedIn} hasCheckedSignIn={hasCheckedSignIn}><NotesScreen setLoggedOut={setLoggedOut}/></RequireAuth>} />

      </Routes>
    </BrowserRouter>
  )
}

export default App;