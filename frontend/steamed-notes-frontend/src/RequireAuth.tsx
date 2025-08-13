import{ ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import LoadingScreen from "./Loading";

interface RequireAuthProps {
  children: ReactNode;
  isSignedIn: boolean; 
  hasCheckedSignIn: boolean
}

export default function RequireAuth({ children, isSignedIn, hasCheckedSignIn }: RequireAuthProps) {
  const location = useLocation();

  if (!hasCheckedSignIn){
    return <LoadingScreen msg="Loading..." />
  }

  if (isSignedIn){
        return <>{children}</> 
  } else {
      return  <Navigate to="/signin" state={{ from: location }} replace />
  }
}
