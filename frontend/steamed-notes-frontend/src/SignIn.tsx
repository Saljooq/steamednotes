import { useState } from "react";

interface SignInProps {
    onSignIn: (user: string) => void;
}

export function SignIn({ onSignIn }: SignInProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const apiUrl = window.location.origin;
  
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`${apiUrl}/api/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include",
        });
        if (res.ok) {
            onSignIn(username); // Pass username up
        } else {
            alert("Sign-in failed: " + (await res.text()));
        }
    };
    return (
        <div>
          <h1>Steamed Notes - Sign In</h1>
          <form onSubmit={handleSignIn}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button type="submit">Sign In</button>
          </form>
        </div>
    );
}