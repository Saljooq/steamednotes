import { NavigateFunction } from "react-router-dom";

export const logout = async (navigate: NavigateFunction, setLoggedOut: (loggedOut:boolean) => void) => {
  // Clear cookies
  await fetch('/api/logout', { method: 'POST', credentials: 'include' })

  setLoggedOut(false);

  navigate('/') // Redirect to login
}