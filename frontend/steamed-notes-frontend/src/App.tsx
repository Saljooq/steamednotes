import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SignIn } from "./SignIn";
import Terminal from "./terminal/Terminal"
import SignupForm from "./CreateUser";
import RoomsScreen from "./Rooms";


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


const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-yellow-50 bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-yellow-100 p-8 rounded-lg shadow-lg max-w-md text-center">
        <div className="flex justify-center mb-4">
          <span className="text-4xl animate-pulse">✏️</span>
        </div>
        <p className="text-xl font-mono text-gray-800">
          Loading your notes...
          <span className="inline-block w-0.5 h-5 bg-gray-800 animate-blink ml-1 align-middle" />
        </p>
      </div>
    </div>
  );
};


  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/signin"
          element={
            hasCheckedSignIn ? ( signedIn ? <Navigate to="/rooms" /> : <SignIn /> ) 
            : <LoadingScreen/>
          }
        />
        <Route path="/signup" element={<SignupForm/>} />
        <Route path="terminal" element={<Terminal/>}/>
        <Route path="/" element={<Navigate to="/signin" />} />
        <Route path="/rooms" element={<RoomsScreen/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;