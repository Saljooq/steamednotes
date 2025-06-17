import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SignIn } from "./SignIn";
import Terminal from "./terminal/Terminal"
import SignupForm from "./CreateUser";
import RoomsScreen from "./Rooms";
import LoadingScreen from "./Loading";
import FoldersScreen from "./Folders";


function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [ hasCheckedSignIn, setHasCheckedSignIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
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
  }, []);


  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/signin"
          element={
            hasCheckedSignIn ? ( signedIn ? <Navigate to="/rooms" /> : <SignIn /> ) 
            : <LoadingScreen msg="Loading your notes..." />
          }
        />
        <Route path="/signup" element={<SignupForm/>} />
        <Route path="terminal" element={<Terminal/>}/>
        <Route path="/" element={<Navigate to="/signin" />} />
        <Route path="/rooms" element={<RoomsScreen/>} />
        <Route path="/rooms/:roomId" element={<FoldersScreen/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;