import React, { useEffect, useRef, useState } from "react";

const host = window.location.host;  // includes domain and port if any
// const WS_URL = `${protocol}//${host}/api/ws`;  // Adjust path as needed

const PROTOCOL = host === "www.steamednotes.com" ? "wss" : "ws";

const WS_URL = `${PROTOCOL}://${host}/api/ws`; // Replace with your WS URL

const WebSocketComponent: React.FC = () => {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // Create WebSocket connection
    ws.current = new WebSocket(WS_URL);

    // Connection opened
    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    // Listen for messages
    ws.current.onmessage = (event) => {
      console.log("Message from server:", event.data);
      setMessages((prev) => [...prev, event.data]);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    // Cleanup on unmount
    return () => {
      ws.current?.close();
    };
  }, []);

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(input);
      setInput(""); // Clear input after sending
    } else {
      console.log("WebSocket is not open");
    }
  };

  return (
    <div>
      <h2>WebSocket React + TypeScript Demo</h2>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type message"
      />
      <button onClick={sendMessage}>Send</button>

      <div>
        <h3>Messages:</h3>
        <ul>
          {messages.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketComponent;
