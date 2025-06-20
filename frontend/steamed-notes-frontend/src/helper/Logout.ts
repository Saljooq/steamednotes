import { NavigateFunction } from "react-router-dom";

export const logout = async (navigate: NavigateFunction, setLoggedOut:React.Dispatch<React.SetStateAction<boolean>>) => {
  // Clear cookies
  await fetch('/api/logout', { method: 'POST', credentials: 'include' })

  setLoggedOut(x => !x);

  navigate('/') // Redirect to login
}